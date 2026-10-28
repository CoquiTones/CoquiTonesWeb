export const makeAnalysis = (overrides = {}) => {
  const frameCount = 3;
  const binCount = 3;
  return {
    analysisId: 1,
    fileId: 'fixture',
    sampleRate: 8000,
    duration: 1,
    fftSize: 1024,
    hopSize: 512,
    windowFunction: 'hann-periodic',
    windowSum: 512,
    analysisStart: 0,
    analysisEnd: 1,
    timeRange: [0, 1],
    frequencyRange: [0, 4000],
    nyquist: 4000,
    frameCount,
    binCount,
    times: new Float32Array([0, 0.5, 1]),
    frequencies: new Float32Array([0, 1000, 2000]),
    db: new Float32Array([
      -100, -20, -10,
      -90, -30, -15,
      -80, -40, -20,
    ]),
    minDb: -100,
    maxDb: -10,
    signalNotice: null,
    displayMinDb: -100,
    displayMaxDb: 0,
    frequencyPooling: 1,
    timeResolution: 0.5,
    frequencyResolution: 1000,
    createdAt: 0,
    ...overrides,
  };
};

export const makeAnalysisError = (code = 'decode-failed', message = 'The recording could not be read.') => ({
  code,
  message,
  fileName: 'fixture.wav',
  cause: null,
});

export const makeWorkerStub = () => {
  const listeners = new Set();
  const messages = [];
  const worker = {
    messages,
    onmessage: null,
    onerror: null,
    postMessage(message) {
      messages.push(message);
    },
    terminate() {},
    addEventListener(type, listener) {
      if (type === 'message') listeners.add(listener);
    },
    removeEventListener(type, listener) {
      if (type === 'message') listeners.delete(listener);
    },
    emit(message) {
      const event = { data: message };
      if (worker.onmessage) worker.onmessage(event);
      listeners.forEach((listener) => listener(event));
    },
  };
  return worker;
};
