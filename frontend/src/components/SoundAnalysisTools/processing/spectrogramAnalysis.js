import FFT from 'fft.js';

import {
  DEFAULT_DISPLAY_MAX_DB,
  DEFAULT_DISPLAY_MIN_DB,
  MAX_BINS,
  MAX_FFT_SIZE,
  MAX_FRAMES,
  MIN_FFT_SIZE,
  clampRange,
  createAnalysis,
  createAnalysisError,
} from './spectrogramModel';

const TARGET_WINDOW_SECONDS = 0.09;
const YIELD_EVERY_FRAMES = 32;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const selectFftSize = (sampleRate) => {
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) return MIN_FFT_SIZE;
  const target = sampleRate * TARGET_WINDOW_SECONDS;
  const powerOfTwo = 2 ** Math.ceil(Math.log2(Math.max(1, target)));
  return clamp(powerOfTwo, MIN_FFT_SIZE, MAX_FFT_SIZE);
};

export const createHannWindow = (length) => {
  const window = new Float64Array(length);
  for (let index = 0; index < length; index += 1) {
    window[index] = 0.5 * (1 - Math.cos((2 * Math.PI * index) / length));
  }
  return window;
};

const detectSignalNotice = (samples) => {
  if (!samples || samples.length === 0) return null;
  const first = samples[0];
  let allZero = first === 0;
  let constant = true;
  for (let index = 1; index < samples.length; index += 1) {
    if (samples[index] !== 0) allZero = false;
    if (samples[index] !== first) constant = false;
    if (!allZero && !constant) return null;
  }
  if (allZero) return 'silent';
  return constant ? 'constant' : null;
};

const buildBinGroups = (rawBinCount, maxBins) => {
  const binCount = Math.min(rawBinCount, Math.max(1, maxBins));
  const groups = [];
  for (let groupIndex = 0; groupIndex < binCount; groupIndex += 1) {
    const start = Math.floor((groupIndex * rawBinCount) / binCount);
    const end = Math.max(start + 1, Math.floor(((groupIndex + 1) * rawBinCount) / binCount));
    groups.push([start, Math.min(end, rawBinCount)]);
  }
  return groups;
};

const buildFrameStarts = ({ startSample, endSample, fftSize, maxFrames }) => {
  const halfWindow = Math.floor(fftSize / 2);
  const firstStart = startSample - halfWindow;
  let lastStart = endSample - halfWindow;
  if (lastStart < firstStart) lastStart = firstStart;

  const span = Math.max(1, lastStart - firstStart);
  let hop = Math.max(1, Math.floor(fftSize / 2), Math.ceil(span / Math.max(1, maxFrames - 1)));
  let starts = [];
  for (let start = firstStart; start <= lastStart; start += hop) starts.push(start);
  if (starts.length === 0) starts = [firstStart];

  if (starts.length > maxFrames) {
    hop = Math.max(1, Math.ceil(span / Math.max(1, maxFrames - 1)));
    starts = [];
    for (let start = firstStart; start <= lastStart; start += hop) starts.push(start);
    if (starts.length > maxFrames) starts = starts.slice(0, maxFrames);
  }

  // Always include the frame centered on the requested end so the time axis
  // endpoint is exact, even when the hop does not land on it.
  if (starts[starts.length - 1] !== lastStart) {
    if (starts.length >= maxFrames) starts[starts.length - 1] = lastStart;
    else starts.push(lastStart);
  }

  return starts;
};

/**
 * Compute a one-sided STFT in dBFS. Frames are centered on their analysis
 * windows; edge windows are zero-padded so the first and last frame centers
 * coincide with the requested time range.
 */
export const computeSpectrogram = async ({
  samples,
  sampleRate,
  duration,
  timeRange,
  frequencyRange,
  maxFrames = MAX_FRAMES,
  maxBins = MAX_BINS,
  displayMinDb = DEFAULT_DISPLAY_MIN_DB,
  displayMaxDb = DEFAULT_DISPLAY_MAX_DB,
  analysisId = 0,
  fileId = '',
  fftSize: requestedFftSize,
  onProgress,
  shouldCancel,
} = {}) => {
  if (!samples || samples.length === 0 || !Number.isFinite(duration) || duration <= 0) {
    throw createAnalysisError('no-frames', 'This recording is too short to analyze.');
  }
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) {
    throw createAnalysisError('decode-failed', 'The recording has an invalid sample rate.');
  }

  const safeDuration = duration;
  const [start, end] = clampRange(timeRange, 0, safeDuration, 1 / sampleRate);
  const [freqStart, freqEnd] = clampRange(
    frequencyRange,
    0,
    sampleRate / 2,
    sampleRate / Math.max(1, requestedFftSize ?? MIN_FFT_SIZE),
  );
  const fftSize = requestedFftSize ?? selectFftSize(sampleRate);
  const window = createHannWindow(fftSize);
  const windowSum = window.reduce((sum, value) => sum + value, 0);
  const halfWindow = fftSize / 2;
  const rawBinCount = Math.floor(fftSize / 2) + 1;
  const groups = buildBinGroups(rawBinCount, maxBins);
  const binCount = groups.length;
  const frequencies = new Float32Array(binCount);
  for (let groupIndex = 0; groupIndex < binCount; groupIndex += 1) {
    const [binStart, binEnd] = groups[groupIndex];
    frequencies[groupIndex] = ((binStart + binEnd - 1) / 2) * (sampleRate / fftSize);
  }

  const startSample = Math.round(start * sampleRate);
  const endSample = Math.round(end * sampleRate);
  const starts = buildFrameStarts({ startSample, endSample, fftSize, maxFrames });
  const frameCount = starts.length;
  if (frameCount === 0) {
    throw createAnalysisError('no-frames', 'This recording is too short to analyze.');
  }

  const fft = new FFT(fftSize);
  const complex = fft.createComplexArray();
  const frame = new Float64Array(fftSize);
  const db = new Float32Array(frameCount * binCount);
  const minAmp = 10 ** (displayMinDb / 20);
  let minDb = Infinity;
  let maxDb = -Infinity;

  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    if (shouldCancel?.()) {
      throw createAnalysisError('cancelled', 'Analysis cancelled.');
    }

    const frameStart = starts[frameIndex];
    for (let index = 0; index < fftSize; index += 1) {
      const sampleIndex = frameStart + index;
      const sample = sampleIndex >= 0 && sampleIndex < samples.length ? samples[sampleIndex] : 0;
      frame[index] = sample * window[index];
    }

    fft.realTransform(complex, frame);
    fft.completeSpectrum(complex);

    for (let groupIndex = 0; groupIndex < binCount; groupIndex += 1) {
      const [binStart, binEnd] = groups[groupIndex];
      let groupDb = displayMinDb;
      for (let bin = binStart; bin < binEnd; bin += 1) {
        const real = complex[2 * bin];
        const imaginary = complex[2 * bin + 1];
        const magnitude = Math.hypot(real, imaginary);
        const isEdgeBin = bin === 0 || bin === fftSize / 2;
        const amplitude = magnitude * ((isEdgeBin ? 1 : 2) / windowSum);
        const rawDb = amplitude > 0 ? 20 * Math.log10(Math.max(amplitude, minAmp)) : displayMinDb;
        groupDb = Math.max(groupDb, Math.max(displayMinDb, rawDb));
      }
      const matrixIndex = frameIndex * binCount + groupIndex;
      db[matrixIndex] = groupDb;
      if (groupDb < minDb) minDb = groupDb;
      if (groupDb > maxDb) maxDb = groupDb;
    }

    if (frameIndex % YIELD_EVERY_FRAMES === 0) {
      onProgress?.((frameIndex + 1) / frameCount);
      // Yield so the worker can process a cancel message.
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (shouldCancel?.()) {
        throw createAnalysisError('cancelled', 'Analysis cancelled.');
      }
    }
  }

  onProgress?.(1);
  const times = new Float32Array(frameCount);
  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    times[frameIndex] = (starts[frameIndex] + halfWindow) / sampleRate;
  }

  const timeResolution = frameCount > 1 ? (times[frameCount - 1] - times[0]) / (frameCount - 1) : fftSize / sampleRate;
  const frequencyResolution = binCount > 1
    ? (frequencies[binCount - 1] - frequencies[0]) / (binCount - 1)
    : sampleRate / fftSize;

  return createAnalysis({
    analysisId,
    fileId,
    sampleRate,
    duration: safeDuration,
    fftSize,
    hopSize: frameCount > 1 ? Math.round((starts[1] - starts[0])) : fftSize / 2,
    windowFunction: 'hann-periodic',
    windowSum,
    analysisStart: Math.min(times[0], start),
    analysisEnd: Math.max(times[frameCount - 1], end),
    timeRange: [start, end],
    frequencyRange: [freqStart, freqEnd],
    nyquist: sampleRate / 2,
    frameCount,
    binCount,
    times,
    frequencies,
    db,
    minDb,
    maxDb,
    signalNotice: detectSignalNotice(samples),
    displayMinDb,
    displayMaxDb,
    frequencyPooling: rawBinCount / binCount,
    timeResolution,
    frequencyResolution,
    createdAt: Date.now(),
  });
};
