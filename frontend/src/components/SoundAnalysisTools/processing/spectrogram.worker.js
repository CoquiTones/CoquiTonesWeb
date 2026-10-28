import { computeSpectrogram } from './spectrogramAnalysis';
import { createAnalysisError } from './spectrogramModel';

const normalizeError = (error, fileName) => {
  if (error?.code) {
    return {
      code: error.code,
      message: error.message,
      fileName: error.fileName || fileName,
      cause: error.cause ?? null,
    };
  }
  return createAnalysisError(
    'unknown',
    'The spectrogram could not be created. Try another file.',
    fileName,
    error instanceof Error ? error.message : String(error),
  );
};

export const createWorkerHandler = (scope) => {
  const state = {
    samples: null,
    sampleRate: 0,
    duration: 0,
    fileId: '',
    currentRequestId: -1,
    cancelledRequestId: -1,
  };

  const isCancelled = (requestId) =>
    state.currentRequestId !== requestId || state.cancelledRequestId >= requestId;

  const handleMessage = async (event) => {
    const message = event?.data;
    if (!message || typeof message !== 'object') return;

    if (message.type === 'init') {
      state.samples = message.samples;
      state.sampleRate = message.sampleRate;
      state.duration = message.duration;
      state.fileId = message.fileId ?? '';
      state.currentRequestId = -1;
      state.cancelledRequestId = -1;
      scope.postMessage({ type: 'ready', fileId: state.fileId });
      return;
    }

    if (message.type === 'cancel') {
      state.cancelledRequestId = Math.max(state.cancelledRequestId, message.requestId ?? -1);
      return;
    }

    if (message.type === 'dispose') {
      state.samples = null;
      state.currentRequestId = -1;
      state.cancelledRequestId = -1;
      scope.close?.();
      return;
    }

    if (message.type !== 'analyze') return;

    const requestId = message.requestId;
    state.currentRequestId = requestId;

    try {
      const analysis = await computeSpectrogram({
        samples: state.samples,
        sampleRate: state.sampleRate,
        duration: state.duration,
        timeRange: message.timeRange,
        frequencyRange: message.frequencyRange,
        maxFrames: message.maxFrames,
        maxBins: message.maxBins,
        displayMinDb: message.displayMinDb,
        displayMaxDb: message.displayMaxDb,
        analysisId: requestId,
        fileId: state.fileId,
        onProgress: (progress) => {
          if (!isCancelled(requestId)) {
            scope.postMessage({
              type: 'progress',
              requestId,
              progress,
              stage: 'analyzing',
            });
          }
        },
        shouldCancel: () => isCancelled(requestId),
      });

      if (isCancelled(requestId)) return;

      scope.postMessage(
        { type: 'result', requestId, analysis },
        [analysis.db.buffer, analysis.times.buffer, analysis.frequencies.buffer],
      );
    } catch (error) {
      if (error?.code === 'cancelled' || isCancelled(requestId)) return;
      scope.postMessage({
        type: 'error',
        requestId,
        error: normalizeError(error, state.fileId),
      });
    }
  };

  return { handleMessage, state };
};

const workerScope =
  typeof WorkerGlobalScope !== 'undefined' &&
  typeof self !== 'undefined' &&
  self instanceof WorkerGlobalScope &&
  typeof self.postMessage === 'function'
    ? self
    : null;

if (workerScope) {
  const handler = createWorkerHandler(workerScope);
  workerScope.onmessage = handler.handleMessage;
}
