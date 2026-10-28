import { useCallback, useEffect, useRef, useState } from 'react';

import {
  DEFAULT_DISPLAY_MAX_DB,
  DEFAULT_DISPLAY_MIN_DB,
  MAX_BINS,
  MAX_DECODED_BYTES,
  MAX_FRAMES,
  createAnalysis,
  createAnalysisError,
} from './spectrogramModel';

const DEBOUNCE_MS = 150;

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

const cropAnalysisToTime = (analysis, timeRange) => {
  const { times, binCount, db } = analysis;
  let startIndex = 0;
  while (startIndex < times.length && times[startIndex] < timeRange[0] - 1e-6) startIndex += 1;
  let endIndex = times.length - 1;
  while (endIndex >= 0 && times[endIndex] > timeRange[1] + 1e-6) endIndex -= 1;
  if (startIndex > endIndex) return null;

  const frameCount = endIndex - startIndex + 1;
  const croppedDb = new Float32Array(frameCount * binCount);
  croppedDb.set(db.subarray(startIndex * binCount, (endIndex + 1) * binCount));
  const croppedTimes = times.slice(startIndex, endIndex + 1);

  let minDb = Infinity;
  let maxDb = -Infinity;
  for (let index = 0; index < croppedDb.length; index += 1) {
    if (croppedDb[index] < minDb) minDb = croppedDb[index];
    if (croppedDb[index] > maxDb) maxDb = croppedDb[index];
  }

  return createAnalysis({
    ...analysis,
    frameCount,
    times: croppedTimes,
    db: croppedDb,
    analysisStart: croppedTimes[0],
    analysisEnd: croppedTimes[frameCount - 1],
    timeRange,
    minDb,
    maxDb,
  });
};

export const useSpectrogram = ({
  audioFile,
  timeRange,
  frequencyRange,
  displayMinDb = DEFAULT_DISPLAY_MIN_DB,
  displayMaxDb = DEFAULT_DISPLAY_MAX_DB,
  maxFrames = MAX_FRAMES,
  maxBins = MAX_BINS,
  debounceMs = DEBOUNCE_MS,
} = {}) => {
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const workerRef = useRef(null);
  const fileTokenRef = useRef(0);
  const requestIdRef = useRef(0);
  const analysisRef = useRef(null);
  const decodedRef = useRef(null);
  const latestRangeRef = useRef({ timeRange, frequencyRange });
  const debounceRef = useRef(null);
  const [timeStart, timeEnd] = timeRange ?? [0, 0];
  const [frequencyStart, frequencyEnd] = frequencyRange ?? [0, 0];

  useEffect(() => {
    latestRangeRef.current = { timeRange, frequencyRange };
  }, [timeStart, timeEnd, frequencyStart, frequencyEnd]);

  const terminateWorker = useCallback(() => {
    const worker = workerRef.current;
    if (worker) {
      worker.postMessage?.({ type: 'dispose' });
      worker.terminate?.();
    }
    workerRef.current = null;
  }, []);

  const requestAnalysis = useCallback(
    (nextTimeRange, nextFrequencyRange) => {
      const worker = workerRef.current;
      if (!worker) return;
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setStatus('analyzing');
      setProgress(null);
      setError(null);
      worker.postMessage({
        type: 'analyze',
        requestId,
        timeRange: nextTimeRange,
        frequencyRange: nextFrequencyRange,
        maxFrames,
        maxBins,
        displayMinDb,
        displayMaxDb,
      });
    },
    [displayMaxDb, displayMinDb, maxBins, maxFrames],
  );

  useEffect(() => {
    if (!audioFile) {
      terminateWorker();
      analysisRef.current = null;
      decodedRef.current = null;
      setStatus('idle');
      setProgress(null);
      setError(null);
      setAnalysis(null);
      return undefined;
    }

    const token = fileTokenRef.current + 1;
    fileTokenRef.current = token;
    requestIdRef.current = 0;
    analysisRef.current = null;
    decodedRef.current = null;
    let cancelled = false;

    terminateWorker();
    setStatus('decoding');
    setProgress(null);
    setError(null);
    setAnalysis(null);

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
        decodedRef.current = decoded;

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
            analysisRef.current = message.analysis;
            setAnalysis(message.analysis);
            setProgress(null);
            setError(null);
            setStatus('ready');
            return;
          }
          if (message.type === 'progress') {
            if (message.requestId !== requestIdRef.current) return;
            setProgress(message.progress);
            setStatus('analyzing');
            return;
          }
          if (message.type === 'error') {
            if (message.requestId !== requestIdRef.current) return;
            setError(normalizeError(message.error, audioFile.name));
            setProgress(null);
            setStatus('failed');
          }
        };

        worker.onerror = () => {
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

        const { timeRange: tr, frequencyRange: fr } = latestRangeRef.current;
        setStatus('analyzing');
        requestAnalysis(tr, fr);
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

  useEffect(() => {
    if (status !== 'ready' || !analysisRef.current) return undefined;
    const current = analysisRef.current;
    const nextTimeRange = latestRangeRef.current.timeRange;
    const inside =
      nextTimeRange[0] >= current.analysisStart - 1e-6 &&
      nextTimeRange[1] <= current.analysisEnd + 1e-6;

    if (inside) {
      const cropped = cropAnalysisToTime(current, nextTimeRange);
      if (cropped) {
        analysisRef.current = cropped;
        setAnalysis(cropped);
        setStatus('ready');
        return undefined;
      }
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      requestAnalysis(nextTimeRange, latestRangeRef.current.frequencyRange);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [timeStart, timeEnd, frequencyStart, frequencyEnd, status, debounceMs, requestAnalysis]);

  const retry = useCallback(() => {
    setRetryCount((count) => count + 1);
  }, []);

  return {
    status,
    progress,
    error,
    analysis,
    retry,
    decoded: decodedRef.current,
  };
};
