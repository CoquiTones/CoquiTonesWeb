import { useCallback, useEffect, useRef, useState } from 'react';

import {
  DEFAULT_DISPLAY_MAX_DB,
  DEFAULT_DISPLAY_MIN_DB,
  DEFAULT_MAX_BINS,
  DEFAULT_MAX_FRAMES,
  MAX_DECODED_BYTES,
  clampRange,
  createAnalysisError,
  selectFftSize,
} from './spectrogramModel';

const fileKey = (file) => `${file.name}:${file.size}:${file.lastModified}`;

const normalizeError = (error, fileName) => {
  if (error?.code) return error;
  if (error?.name === 'EncodingError' || /decode/i.test(error?.message ?? '')) {
    return createAnalysisError(
      'decode-failed',
      'The recording could not be read. It may be truncated or corrupted.',
      fileName,
      error?.message ?? null,
    );
  }
  return createAnalysisError(
    'unknown',
    'The spectrogram could not be created. Try another file.',
    fileName,
    error?.message ?? null,
  );
};

export const estimateDecodedBytes = async (file) => {
  if (!file) return 0;
  if (file.name.toLowerCase().endsWith('.wav')) {
    try {
      const header = new DataView(await file.slice(0, 44).arrayBuffer());
      const bitsPerSample = header.getUint16(34, true);
      const dataSize = header.getUint32(40, true);
      if (bitsPerSample > 0 && dataSize > 0) {
        return (dataSize / (bitsPerSample / 8)) * 4;
      }
    } catch {
      // Fall through to the conservative estimate.
    }
  }
  // Compressed audio commonly expands by roughly 10-20x when decoded to Float32.
  return file.size * 20;
};

export const decodeAudioFile = async (file) => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    throw createAnalysisError(
      'worker-failed',
      'Audio analysis is unavailable in this browser.',
      file.name,
    );
  }

  const context = new AudioContextClass();
  try {
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await context.decodeAudioData(arrayBuffer);
    if (!audioBuffer || audioBuffer.length === 0 || audioBuffer.numberOfChannels === 0) {
      throw createAnalysisError('no-frames', 'This recording is too short to analyze.', file.name);
    }
    return {
      samples: audioBuffer.getChannelData(0),
      sampleRate: audioBuffer.sampleRate,
      duration: audioBuffer.duration,
      channelCount: audioBuffer.numberOfChannels,
    };
  } finally {
    await context.close?.();
  }
};

const FULL_FILE_EPSILON = 1e-6;

const clampTimeRange = (range, duration, sampleRate) => {
  const fftSize = selectFftSize(sampleRate);
  return clampRange(range ?? [0, duration], 0, duration, fftSize / sampleRate);
};

/**
 * A full-file pass is safe only while the hop needed to fit the frame budget
 * still overlaps or touches every window. Beyond that point the analysis would
 * leave holes in the timeline, so the hook falls back to the visible window.
 */
export const canAnalyzeFullFile = (duration, sampleRate, maxFrames) => {
  if (!(duration > 0) || !(sampleRate > 0) || !(maxFrames > 1)) return false;
  const fftSize = selectFftSize(sampleRate);
  const durationSamples = duration * sampleRate;
  const budgetHop = Math.ceil(durationSamples / (maxFrames - 1));
  return budgetHop <= fftSize;
};

const timeRangeCovers = (outer, inner) => Boolean(
  outer
  && inner
  && outer[0] <= inner[0] + FULL_FILE_EPSILON
  && outer[1] >= inner[1] - FULL_FILE_EPSILON,
);

const coversTimeRange = (analysis, timeRange) => Boolean(
  analysis && timeRangeCovers(analysis.timeRange, timeRange),
);

const frequencyRangeCovers = (outer, inner) => Boolean(
  outer
  && inner
  && outer[0] <= inner[0] + FULL_FILE_EPSILON
  && outer[1] >= inner[1] - FULL_FILE_EPSILON,
);

/**
 * Decode a recording once. When the whole file fits the frame budget it is
 * analyzed once up front, so time and frequency zooming are just crops of the
 * cached matrix. Longer recordings fall back to a debounced visible-window
 * analysis. The decoded samples stay inside the worker, so nothing is ever
 * decoded twice.
 */
export const useSpectrogram = ({
  audioFile,
  timeRange = null,
  frequencyRange = null,
  maxFrames = DEFAULT_MAX_FRAMES,
  maxBins = DEFAULT_MAX_BINS,
  displayMinDb = DEFAULT_DISPLAY_MIN_DB,
  displayMaxDb = DEFAULT_DISPLAY_MAX_DB,
} = {}) => {
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [primaryAnalysis, setPrimaryAnalysis] = useState(null);
  const [detailAnalysis, setDetailAnalysis] = useState(null);
  const [refining, setRefining] = useState(false);
  const [refineProgress, setRefineProgress] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const workerRef = useRef(null);
  const workerReadyRef = useRef(false);
  const fileTokenRef = useRef(0);
  const requestIdRef = useRef(0);
  const metaRef = useRef({ duration: 0, sampleRate: 0 });
  const configRef = useRef({ maxFrames, maxBins });
  const rangeRef = useRef({ timeRange, frequencyRange });
  const inFlightRef = useRef(null);
  const detailConfigRef = useRef(null);
  const displayRef = useRef({ displayMinDb, displayMaxDb });
  const timeStart = timeRange?.[0] ?? null;
  const timeEnd = timeRange?.[1] ?? null;
  const frequencyStart = frequencyRange?.[0] ?? null;
  const frequencyEnd = frequencyRange?.[1] ?? null;

  useEffect(() => {
    rangeRef.current = { timeRange, frequencyRange };
  }, [timeStart, timeEnd, frequencyStart, frequencyEnd]);

  useEffect(() => {
    displayRef.current = { displayMinDb, displayMaxDb };
  }, [displayMinDb, displayMaxDb]);

  const terminateWorker = useCallback(() => {
    workerReadyRef.current = false;
    inFlightRef.current = null;
    detailConfigRef.current = null;
    setRefining(false);
    setRefineProgress(null);
    const worker = workerRef.current;
    if (worker) {
      worker.postMessage?.({ type: 'dispose' });
      worker.terminate?.();
    }
    workerRef.current = null;
  }, []);

  const requestAnalysis = useCallback((config, kind = 'base') => {
    const worker = workerRef.current;
    const { duration, sampleRate } = metaRef.current;
    if (!worker || !workerReadyRef.current || !(duration > 0) || !(sampleRate > 0)) {
      return false;
    }

    const fftSize = selectFftSize(sampleRate);
    const requestedTime = config.timeRange ?? rangeRef.current.timeRange ?? [0, duration];
    const clampedTime = clampTimeRange(requestedTime, duration, sampleRate);
    const requestedFrequency = kind === 'base'
      ? [0, sampleRate / 2]
      : (config.frequencyRange ?? [0, sampleRate / 2]);
    const clampedFrequency = clampRange(
      requestedFrequency,
      0,
      sampleRate / 2,
      sampleRate / fftSize,
    );

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    inFlightRef.current = {
      kind,
      timeRange: clampedTime,
      frequencyRange: clampedFrequency,
      maxFrames: config.maxFrames,
      maxBins: config.maxBins,
    };
    if (kind === 'detail') {
      setRefining(true);
      setRefineProgress(null);
    } else {
      setStatus('analyzing');
      setProgress(null);
      setError(null);
      setRefining(false);
      setRefineProgress(null);
    }
    worker.postMessage({
      type: 'analyze',
      requestId,
      timeRange: clampedTime,
      frequencyRange: clampedFrequency,
      maxFrames: config.maxFrames,
      maxBins: config.maxBins,
      displayMinDb: displayRef.current.displayMinDb,
      displayMaxDb: displayRef.current.displayMaxDb,
    });
    return true;
  }, []);

  useEffect(() => {
    if (!audioFile) {
      terminateWorker();
      metaRef.current = { duration: 0, sampleRate: 0 };
      setStatus('idle');
      setProgress(null);
      setError(null);
      setPrimaryAnalysis(null);
      setDetailAnalysis(null);
      detailConfigRef.current = null;
      setRefining(false);
      setRefineProgress(null);
      return undefined;
    }

    const token = fileTokenRef.current + 1;
    fileTokenRef.current = token;
    requestIdRef.current = 0;
    metaRef.current = { duration: 0, sampleRate: 0 };
    let cancelled = false;

    terminateWorker();
    setStatus('decoding');
    setProgress(null);
    setError(null);
    setPrimaryAnalysis(null);
    setDetailAnalysis(null);
    detailConfigRef.current = null;
    setRefining(false);
    setRefineProgress(null);

    const fail = (nextError) => {
      if (cancelled || token !== fileTokenRef.current) return;
      const normalized = normalizeError(nextError, audioFile.name);
      setError(normalized);
      setStatus('failed');
      setProgress(null);
    };

    const process = async () => {
      try {
        const estimatedBytes = await estimateDecodedBytes(audioFile);
        if (estimatedBytes > MAX_DECODED_BYTES) {
          throw createAnalysisError(
            'over-budget',
            'This recording is too large to analyze in this browser. Try a shorter file or a lower sample rate.',
            audioFile.name,
          );
        }

        const decoded = await decodeAudioFile(audioFile);
        if (cancelled || token !== fileTokenRef.current) return;

        if (typeof Worker === 'undefined') {
          throw createAnalysisError(
            'worker-failed',
            'Audio analysis is unavailable in this browser.',
            audioFile.name,
          );
        }

        const worker = new Worker(
          new URL('./spectrogram.worker.js', import.meta.url),
          { type: 'module' },
        );
        workerRef.current = worker;

        worker.onmessage = (event) => {
          const message = event?.data;
          if (!message || token !== fileTokenRef.current) return;
          if (message.type === 'result') {
            if (message.requestId !== requestIdRef.current) return;
            const inFlight = inFlightRef.current;
            inFlightRef.current = null;

            if (inFlight?.kind === 'detail') {
              setRefining(false);
              setRefineProgress(null);
              const { duration, sampleRate } = metaRef.current;
              const requested = clampTimeRange(rangeRef.current.timeRange, duration, sampleRate);
              const requestedFrequency = clampRange(
                rangeRef.current.frequencyRange ?? [0, sampleRate / 2],
                0,
                sampleRate / 2,
                sampleRate / selectFftSize(sampleRate),
              );
              if (
                coversTimeRange(message.analysis, requested)
                && frequencyRangeCovers(message.analysis.frequencyRange, requestedFrequency)
              ) {
                detailConfigRef.current = {
                  maxFrames: inFlight.maxFrames,
                  maxBins: inFlight.maxBins,
                };
                setDetailAnalysis(message.analysis);
              }
              return;
            }

            setPrimaryAnalysis(message.analysis);
            setDetailAnalysis(null);
            detailConfigRef.current = null;
            setProgress(null);
            setError(null);
            setStatus('ready');
            setRefining(false);
            setRefineProgress(null);
            return;
          }
          if (message.type === 'progress') {
            if (message.requestId !== requestIdRef.current) return;
            if (inFlightRef.current?.kind === 'detail') {
              setRefineProgress(message.progress);
              setRefining(true);
            } else {
              setProgress(message.progress);
              setStatus('analyzing');
            }
            return;
          }
          if (message.type === 'error') {
            if (message.requestId !== requestIdRef.current) return;
            const kind = inFlightRef.current?.kind;
            inFlightRef.current = null;
            if (kind === 'detail') {
              // A failed refinement leaves the cached plot in place.
              setRefining(false);
              setRefineProgress(null);
              return;
            }
            setError(normalizeError(message.error, audioFile.name));
            setProgress(null);
            setStatus('failed');
            setRefining(false);
            setRefineProgress(null);
          }
        };

        worker.onerror = () => {
          workerReadyRef.current = false;
          inFlightRef.current = null;
          detailConfigRef.current = null;
          setRefining(false);
          setRefineProgress(null);
          fail(createAnalysisError(
            'worker-failed',
            'Audio analysis is unavailable in this browser.',
            audioFile.name,
          ));
        };

        worker.postMessage(
          {
            type: 'init',
            fileId: fileKey(audioFile),
            sampleRate: decoded.sampleRate,
            duration: decoded.duration,
            samples: decoded.samples,
          },
          [decoded.samples.buffer],
        );
        workerReadyRef.current = true;
        metaRef.current = { duration: decoded.duration, sampleRate: decoded.sampleRate };

        // Precompute the whole file when it fits; otherwise analyze the
        // requested visible window. Later zooms reuse this result when they fit
        // inside the analyzed extent.
        const targetTime = canAnalyzeFullFile(
          decoded.duration,
          decoded.sampleRate,
          configRef.current.maxFrames,
        )
          ? [0, decoded.duration]
          : clampTimeRange(rangeRef.current, decoded.duration, decoded.sampleRate);
        requestAnalysis({ ...configRef.current, timeRange: targetTime }, 'base');
      } catch (nextError) {
        fail(nextError);
      }
    };

    process();

    return () => {
      cancelled = true;
      terminateWorker();
    };
  }, [audioFile, retryCount, requestAnalysis, terminateWorker]);

  // Time or generation-detail changes only request new work when the cached
  // matrix cannot serve them. Frequency zoom never reaches this effect: the
  // full-band matrix is already in memory.
  useEffect(() => {
    const nextConfig = { maxFrames, maxBins };
    const configChanged = configRef.current.maxFrames !== maxFrames
      || configRef.current.maxBins !== maxBins;
    configRef.current = nextConfig;
    if (!workerReadyRef.current) return undefined;

    const { duration, sampleRate } = metaRef.current;
    if (!(duration > 0) || !(sampleRate > 0)) return undefined;

    const requested = clampTimeRange(
      timeRange ?? rangeRef.current ?? [0, duration],
      duration,
      sampleRate,
    );
    const targetTime = canAnalyzeFullFile(duration, sampleRate, maxFrames)
      ? [0, duration]
      : requested;

    // A generation-profile change must always produce a new base matrix, so
    // send it immediately instead of letting a range check cancel it.
    if (configChanged) {
      setStatus('analyzing');
      setProgress(null);
      setError(null);
      setDetailAnalysis(null);
      detailConfigRef.current = null;
      setRefining(false);
      setRefineProgress(null);
      requestAnalysis({ ...nextConfig, timeRange: targetTime }, 'base');
      return undefined;
    }

    const inFlight = inFlightRef.current;
    const inFlightCovers = inFlight?.kind === 'base'
      && inFlight.maxFrames === maxFrames
      && inFlight.maxBins === maxBins
      && timeRangeCovers(inFlight.timeRange, targetTime);
    if (coversTimeRange(primaryAnalysis, targetTime) || inFlightCovers) {
      return undefined;
    }

    setStatus('analyzing');
    setProgress(null);
    setError(null);
    setDetailAnalysis(null);
    detailConfigRef.current = null;
    setRefining(false);
    setRefineProgress(null);
    const timer = setTimeout(() => {
      requestAnalysis({ ...nextConfig, timeRange: targetTime }, 'base');
    }, 150);
    return () => clearTimeout(timer);
  }, [timeStart, timeEnd, maxFrames, maxBins, primaryAnalysis, requestAnalysis]);

  // After a zoom has been painted from the cached matrix, quietly replace the
  // visible window with a finer 50%-overlap pass. This never changes `status`,
  // so the controls stay enabled and the plot is never blank.
  useEffect(() => {
    if (status !== 'ready' || !workerReadyRef.current || !primaryAnalysis) return undefined;
    if (inFlightRef.current?.kind === 'base') return undefined;

    const { duration, sampleRate } = metaRef.current;
    if (!(duration > 0) || !(sampleRate > 0)) return undefined;

    const requested = clampTimeRange(
      timeRange ?? rangeRef.current ?? [0, duration],
      duration,
      sampleRate,
    );
    if (!coversTimeRange(primaryAnalysis, requested)) return undefined;

    const fftSize = primaryAnalysis.fftSize || selectFftSize(sampleRate);
    const halfHop = Math.floor(fftSize / 2);
    const spanSamples = Math.max(1, Math.round((requested[1] - requested[0]) * sampleRate));
    const expectedHop = Math.max(
      halfHop,
      Math.ceil(spanSamples / Math.max(1, maxFrames - 1)),
    );

    if (expectedHop >= primaryAnalysis.hopSize) {
      setRefining(false);
      setRefineProgress(null);
      return undefined;
    }

    const detailConfig = detailConfigRef.current;
    const detailMatches = detailAnalysis
      && detailConfig
      && detailConfig.maxFrames === maxFrames
      && detailConfig.maxBins === maxBins;
    if (
      detailMatches
      && coversTimeRange(detailAnalysis, requested)
      && detailAnalysis.hopSize <= expectedHop
    ) {
      setRefining(false);
      setRefineProgress(null);
      return undefined;
    }

    const inFlight = inFlightRef.current;
    if (
      inFlight?.kind === 'detail'
      && inFlight.maxFrames === maxFrames
      && inFlight.maxBins === maxBins
      && timeRangeCovers(inFlight.timeRange, requested)
    ) {
      const inFlightSpan = Math.max(
        1,
        Math.round((inFlight.timeRange[1] - inFlight.timeRange[0]) * sampleRate),
      );
      const inFlightHop = Math.max(
        halfHop,
        Math.ceil(inFlightSpan / Math.max(1, maxFrames - 1)),
      );
      if (inFlightHop <= expectedHop) return undefined;
    }

    setRefining(true);
    setRefineProgress(null);
    const timer = setTimeout(() => {
      requestAnalysis({ maxFrames, maxBins, timeRange: requested }, 'detail');
    }, 250);
    return () => clearTimeout(timer);
  }, [
    status,
    primaryAnalysis,
    detailAnalysis,
    timeStart,
    timeEnd,
    maxFrames,
    maxBins,
    requestAnalysis,
  ]);

  const rerenderVisible = useCallback(() => {
    if (status !== 'ready' || !workerReadyRef.current) return false;
    const { duration, sampleRate } = metaRef.current;
    if (!(duration > 0) || !(sampleRate > 0)) return false;

    const requested = clampTimeRange(
      timeRange ?? rangeRef.current.timeRange ?? [0, duration],
      duration,
      sampleRate,
    );
    const requestedFrequency = clampRange(
      frequencyRange ?? rangeRef.current.frequencyRange ?? [0, sampleRate / 2],
      0,
      sampleRate / 2,
      sampleRate / selectFftSize(sampleRate),
    );
    requestAnalysis({
      maxFrames,
      maxBins,
      timeRange: requested,
      frequencyRange: requestedFrequency,
    }, 'detail');
    return true;
  }, [status, timeRange, frequencyRange, maxFrames, maxBins, requestAnalysis]);

  const retry = useCallback(() => {
    setRetryCount((count) => count + 1);
  }, []);

  const referenceAnalysis = primaryAnalysis ?? detailAnalysis;
  const viewDuration = referenceAnalysis?.duration ?? metaRef.current.duration;
  const viewSampleRate = referenceAnalysis?.sampleRate ?? metaRef.current.sampleRate;
  let analysis = referenceAnalysis;
  if (viewDuration > 0 && viewSampleRate > 0) {
    const requested = clampTimeRange(
      timeRange ?? [0, viewDuration],
      viewDuration,
      viewSampleRate,
    );
    const requestedFrequency = clampRange(
      frequencyRange ?? [0, viewSampleRate / 2],
      0,
      viewSampleRate / 2,
      viewSampleRate / selectFftSize(viewSampleRate),
    );
    const detailConfig = detailConfigRef.current;
    const detailMatches = detailAnalysis
      && detailConfig
      && detailConfig.maxFrames === maxFrames
      && detailConfig.maxBins === maxBins;
    if (
      detailMatches
      && coversTimeRange(detailAnalysis, requested)
      && frequencyRangeCovers(detailAnalysis.frequencyRange, requestedFrequency)
    ) {
      analysis = detailAnalysis;
    } else if (primaryAnalysis && coversTimeRange(primaryAnalysis, requested)) {
      analysis = primaryAnalysis;
    } else {
      analysis = primaryAnalysis ?? detailAnalysis;
    }
  }

  return {
    status,
    progress,
    error,
    analysis,
    refining,
    refineProgress,
    rerenderVisible,
    retry,
  };
};
