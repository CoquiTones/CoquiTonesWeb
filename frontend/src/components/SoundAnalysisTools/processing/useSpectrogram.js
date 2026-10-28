import { useCallback, useEffect, useRef, useState } from 'react';

import {
  DEFAULT_DISPLAY_MAX_DB,
  DEFAULT_DISPLAY_MIN_DB,
  DEFAULT_MAX_BINS,
  DEFAULT_MAX_FRAMES,
  MAX_DECODED_BYTES,
  createAnalysisError,
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

/**
 * Decode a recording once and analyze the whole file in the worker. The result
 * is a full-file time/frequency matrix; viewport changes only select which
 * slice is drawn. Changing the generation detail reuses the decoded samples
 * already held by the worker, so it never decodes the file again.
 */
export const useSpectrogram = ({
  audioFile,
  maxFrames = DEFAULT_MAX_FRAMES,
  maxBins = DEFAULT_MAX_BINS,
  displayMinDb = DEFAULT_DISPLAY_MIN_DB,
  displayMaxDb = DEFAULT_DISPLAY_MAX_DB,
} = {}) => {
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const workerRef = useRef(null);
  const workerReadyRef = useRef(false);
  const fileTokenRef = useRef(0);
  const requestIdRef = useRef(0);
  const metaRef = useRef({ duration: 0, sampleRate: 0 });
  const configRef = useRef({ maxFrames, maxBins });
  const displayRef = useRef({ displayMinDb, displayMaxDb });

  useEffect(() => {
    displayRef.current = { displayMinDb, displayMaxDb };
  }, [displayMinDb, displayMaxDb]);

  const terminateWorker = useCallback(() => {
    workerReadyRef.current = false;
    const worker = workerRef.current;
    if (worker) {
      worker.postMessage?.({ type: 'dispose' });
      worker.terminate?.();
    }
    workerRef.current = null;
  }, []);

  const requestAnalysis = useCallback((config) => {
    const worker = workerRef.current;
    const { duration, sampleRate } = metaRef.current;
    if (!worker || !workerReadyRef.current || !(duration > 0) || !(sampleRate > 0)) {
      return false;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setStatus('analyzing');
    setProgress(null);
    setError(null);
    worker.postMessage({
      type: 'analyze',
      requestId,
      timeRange: [0, duration],
      frequencyRange: [0, sampleRate / 2],
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
      setAnalysis(null);
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
          workerReadyRef.current = false;
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

        // Generate the full-file matrix once. Later detail changes reuse the
        // samples already inside the worker.
        requestAnalysis(configRef.current);
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

  // Generation detail changes re-run the STFT, but never the audio decode.
  useEffect(() => {
    configRef.current = { maxFrames, maxBins };
    if (!workerReadyRef.current) return;
    requestAnalysis(configRef.current);
  }, [maxFrames, maxBins, requestAnalysis]);

  const retry = useCallback(() => {
    setRetryCount((count) => count + 1);
  }, []);

  return {
    status,
    progress,
    error,
    analysis,
    retry,
  };
};
