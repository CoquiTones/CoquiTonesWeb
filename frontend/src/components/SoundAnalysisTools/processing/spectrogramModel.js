export const DEFAULT_DISPLAY_MIN_DB = -100;
export const DEFAULT_DISPLAY_MAX_DB = 0;

export const DEFAULT_DETAIL_PROFILE = 'medium';
export const DETAIL_PROFILES = Object.freeze({
  low: Object.freeze({ label: 'Low', maxFrames: 1024, maxBins: 512 }),
  medium: Object.freeze({ label: 'Medium', maxFrames: 1536, maxBins: 768 }),
  high: Object.freeze({ label: 'High', maxFrames: 2048, maxBins: 1024 }),
});

const PROFILE_VALUES = Object.values(DETAIL_PROFILES);
export const DEFAULT_MAX_FRAMES = DETAIL_PROFILES[DEFAULT_DETAIL_PROFILE].maxFrames;
export const DEFAULT_MAX_BINS = DETAIL_PROFILES[DEFAULT_DETAIL_PROFILE].maxBins;
export const MAX_FRAMES = Math.max(...PROFILE_VALUES.map((profile) => profile.maxFrames));
export const MAX_BINS = Math.max(...PROFILE_VALUES.map((profile) => profile.maxBins));

export const MIN_FFT_SIZE = 1024;
export const MAX_FFT_SIZE = 4096;
export const MAX_DECODED_BYTES = 250 * 1024 * 1024;

const TARGET_WINDOW_SECONDS = 0.09;

const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);

export const getDetailProfile = (name) => (
  DETAIL_PROFILES[name] ?? DETAIL_PROFILES[DEFAULT_DETAIL_PROFILE]
);

export const selectFftSize = (sampleRate) => {
  if (!isFiniteNumber(sampleRate) || sampleRate <= 0) return MIN_FFT_SIZE;
  const target = sampleRate * TARGET_WINDOW_SECONDS;
  const powerOfTwo = 2 ** Math.ceil(Math.log2(Math.max(1, target)));
  return Math.min(Math.max(powerOfTwo, MIN_FFT_SIZE), MAX_FFT_SIZE);
};

const isStrictlyIncreasing = (values) => {
  for (let index = 1; index < values.length; index += 1) {
    if (!(values[index] > values[index - 1])) return false;
  }
  return true;
};

const isPowerOfTwo = (value) => value > 0 && (value & (value - 1)) === 0;

export const createAnalysisError = (code, message, fileName = '', cause = null) => ({
  code,
  message,
  fileName,
  cause,
});

export const clampRange = (range, min, max, minSpan = 0) => {
  if (!isFiniteNumber(min) || !isFiniteNumber(max) || max <= min) {
    return [min, max];
  }

  let start = Array.isArray(range) && isFiniteNumber(Number(range[0])) ? Number(range[0]) : min;
  let end = Array.isArray(range) && isFiniteNumber(Number(range[1])) ? Number(range[1]) : max;

  start = Math.min(Math.max(start, min), max);
  end = Math.min(Math.max(end, min), max);
  if (end < start) [start, end] = [end, start];

  const span = Math.max(0, minSpan);
  if (max - min <= span) return [min, max];

  if (end - start < span) {
    if (start + span <= max) {
      end = start + span;
    } else {
      end = max;
      start = Math.max(min, max - span);
    }
  }

  return [start, end];
};

export const createAnalysis = (overrides = {}) => {
  const times = overrides.times instanceof Float32Array
    ? overrides.times
    : new Float32Array(overrides.times ?? []);
  const frequencies = overrides.frequencies instanceof Float32Array
    ? overrides.frequencies
    : new Float32Array(overrides.frequencies ?? []);
  const db = overrides.db instanceof Float32Array
    ? overrides.db
    : new Float32Array(overrides.db ?? []);
  const frameCount = overrides.frameCount ?? times.length;
  const binCount = overrides.binCount ?? frequencies.length;
  const sampleRate = overrides.sampleRate ?? 0;
  const hopSize = overrides.hopSize ?? 0;
  const fftSize = overrides.fftSize ?? MIN_FFT_SIZE;
  const frequencyPooling = overrides.frequencyPooling ?? 1;

  return {
    analysisId: overrides.analysisId ?? 0,
    fileId: overrides.fileId ?? '',
    sampleRate,
    duration: overrides.duration ?? 0,
    fftSize,
    hopSize,
    windowFunction: overrides.windowFunction ?? 'hann-periodic',
    windowSum: overrides.windowSum ?? 0,
    analysisStart: overrides.analysisStart ?? (times[0] ?? 0),
    analysisEnd: overrides.analysisEnd ?? (times[times.length - 1] ?? 0),
    timeRange: overrides.timeRange ?? [0, overrides.duration ?? 0],
    frequencyRange: overrides.frequencyRange ?? [0, overrides.nyquist ?? sampleRate / 2],
    nyquist: overrides.nyquist ?? sampleRate / 2,
    frameCount,
    binCount,
    times,
    frequencies,
    db,
    minDb: overrides.minDb ?? DEFAULT_DISPLAY_MIN_DB,
    maxDb: overrides.maxDb ?? DEFAULT_DISPLAY_MIN_DB,
    signalNotice: overrides.signalNotice ?? null,
    displayMinDb: overrides.displayMinDb ?? DEFAULT_DISPLAY_MIN_DB,
    displayMaxDb: overrides.displayMaxDb ?? DEFAULT_DISPLAY_MAX_DB,
    frequencyPooling,
    timeResolution: overrides.timeResolution ?? (sampleRate > 0 ? hopSize / sampleRate : 0),
    frequencyResolution: overrides.frequencyResolution
      ?? (binCount > 1 ? (frequencies[binCount - 1] - frequencies[0]) / (binCount - 1) : sampleRate / fftSize),
    createdAt: overrides.createdAt ?? Date.now(),
  };
};

export const validateAnalysis = (analysis) => {
  const errors = [];
  if (!analysis || typeof analysis !== 'object') return ['analysis must be an object'];

  const {
    sampleRate, duration, fftSize, hopSize, frameCount, binCount, times, frequencies, db,
    minDb, maxDb, displayMinDb, displayMaxDb, analysisStart, analysisEnd, timeRange,
    frequencyRange, nyquist, signalNotice, frequencyPooling,
  } = analysis;

  if (!isFiniteNumber(sampleRate) || sampleRate <= 0) errors.push('sampleRate must be positive');
  if (!isFiniteNumber(duration) || duration <= 0) errors.push('duration must be positive');
  if (!Number.isInteger(fftSize) || !isPowerOfTwo(fftSize) || fftSize < MIN_FFT_SIZE || fftSize > MAX_FFT_SIZE) {
    errors.push(`fftSize must be a power of two in [${MIN_FFT_SIZE}, ${MAX_FFT_SIZE}]`);
  }
  if (!Number.isInteger(hopSize) || hopSize < 1) errors.push('hopSize must be a positive integer');
  if (!Number.isInteger(frameCount) || frameCount < 1) errors.push('frameCount must be at least 1');
  if (!Number.isInteger(binCount) || binCount < 1) errors.push('binCount must be at least 1');
  if (frameCount > MAX_FRAMES) errors.push(`frameCount must not exceed ${MAX_FRAMES}`);
  if (binCount > MAX_BINS) errors.push(`binCount must not exceed ${MAX_BINS}`);
  if (!(times instanceof Float32Array) || times.length !== frameCount) errors.push('times length must equal frameCount');
  if (!(frequencies instanceof Float32Array) || frequencies.length !== binCount) errors.push('frequencies length must equal binCount');
  if (!(db instanceof Float32Array) || db.length !== frameCount * binCount) errors.push('db length must equal frameCount * binCount');
  if (times instanceof Float32Array && !isStrictlyIncreasing(times)) errors.push('times must be strictly increasing');
  if (frequencies instanceof Float32Array && !isStrictlyIncreasing(frequencies)) errors.push('frequencies must be strictly increasing');
  if (times instanceof Float32Array && (times[0] < 0 || times[times.length - 1] > duration + 1e-9)) errors.push('times must be inside the recording');
  if (frequencies instanceof Float32Array && (frequencies[0] < 0 || frequencies[binCount - 1] > nyquist + 1e-9)) errors.push('frequencies must be inside 0..nyquist');
  if (!isFiniteNumber(minDb) || !isFiniteNumber(maxDb) || maxDb < minDb) errors.push('minDb/maxDb are invalid');
  if (!isFiniteNumber(displayMinDb) || !isFiniteNumber(displayMaxDb) || displayMinDb >= displayMaxDb) errors.push('display range is invalid');
  if (db instanceof Float32Array) {
    for (let index = 0; index < db.length; index += 1) {
      if (!Number.isFinite(db[index]) || db[index] < displayMinDb - 1e-9) {
        errors.push('db values must be finite and at or above displayMinDb');
        break;
      }
    }
  }
  if (!isFiniteNumber(analysisStart) || !isFiniteNumber(analysisEnd) || analysisEnd < analysisStart) errors.push('analysis extent is invalid');
  if (!Array.isArray(timeRange) || timeRange.length !== 2 || !isFiniteNumber(timeRange[0]) || !isFiniteNumber(timeRange[1]) || timeRange[0] >= timeRange[1]) errors.push('timeRange is invalid');
  if (timeRange && (timeRange[0] < analysisStart - 1e-9 || timeRange[1] > analysisEnd + 1e-9)) errors.push('timeRange must be inside the analysis extent');
  if (!Array.isArray(frequencyRange) || frequencyRange.length !== 2 || !isFiniteNumber(frequencyRange[0]) || !isFiniteNumber(frequencyRange[1]) || frequencyRange[0] >= frequencyRange[1]) errors.push('frequencyRange is invalid');
  if (frequencyRange && (frequencyRange[0] < 0 || frequencyRange[1] > nyquist + 1e-9)) errors.push('frequencyRange must be inside 0..nyquist');
  if (signalNotice !== null && !['silent', 'constant'].includes(signalNotice)) errors.push('signalNotice is invalid');
  if (!isFiniteNumber(frequencyPooling) || frequencyPooling < 1) errors.push('frequencyPooling must be at least 1');
  if (isFiniteNumber(frequencyPooling) && binCount * frequencyPooling > fftSize / 2 + 1 + 1e-9) errors.push('pooled bins exceed the FFT spectrum');

  return errors;
};
