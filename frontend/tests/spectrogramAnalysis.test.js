import { describe, expect, it } from 'vitest';

import {
  computeSpectrogram,
  createHannWindow,
  selectFftSize,
} from '../src/components/SoundAnalysisTools/processing/spectrogramAnalysis';
import { validateAnalysis } from '../src/components/SoundAnalysisTools/processing/spectrogramModel';
import { makeConstant, makeShortBuffer, makeSilence, makeSine } from './helpers/syntheticAudio';

const findPeak = (analysis) => {
  let best = { db: -Infinity, frame: 0, bin: 0 };
  for (let frame = 0; frame < analysis.frameCount; frame += 1) {
    for (let bin = 0; bin < analysis.binCount; bin += 1) {
      const db = analysis.db[frame * analysis.binCount + bin];
      if (db > best.db) best = { db, frame, bin };
    }
  }
  return {
    ...best,
    time: analysis.times[best.frame],
    frequency: analysis.frequencies[best.bin],
  };
};

const nearestBin = (frequencies, target) => {
  let best = 0;
  let distance = Infinity;
  frequencies.forEach((frequency, index) => {
    const nextDistance = Math.abs(frequency - target);
    if (nextDistance < distance) {
      distance = nextDistance;
      best = index;
    }
  });
  return best;
};

const directDftDb = ({ samples, sampleRate, fftSize, frequency }) => {
  const window = createHannWindow(fftSize);
  const windowSum = window.reduce((sum, value) => sum + value, 0);
  const half = Math.floor(fftSize / 2);
  let real = 0;
  let imaginary = 0;
  for (let index = 0; index < fftSize; index += 1) {
    const sampleIndex = index - half;
    const sample = sampleIndex >= 0 && sampleIndex < samples.length ? samples[sampleIndex] : 0;
    const value = sample * window[index];
    const angle = (-2 * Math.PI * frequency * index) / sampleRate;
    real += value * Math.cos(angle);
    imaginary += value * Math.sin(angle);
  }
  const bin = Math.round((frequency * fftSize) / sampleRate);
  const edge = bin === 0 || bin === fftSize / 2;
  const amplitude = Math.hypot(real, imaginary) * ((edge ? 1 : 2) / windowSum);
  return 20 * Math.log10(Math.max(amplitude, 1e-5));
};

const computeTone = async (signal, overrides = {}) =>
  computeSpectrogram({
    samples: signal.samples,
    sampleRate: signal.sampleRate,
    duration: signal.duration,
    timeRange: [0, signal.duration],
    frequencyRange: [0, signal.sampleRate / 2],
    fftSize: 1024,
    maxFrames: 256,
    maxBins: 1024,
    ...overrides,
  });

describe('spectrogramAnalysis', () => {
  it('selects an FFT size that targets a 90 ms window', () => {
    expect(selectFftSize(8000)).toBe(1024);
    expect(selectFftSize(44100)).toBe(4096);
    expect(selectFftSize(96000)).toBe(4096);
  });

  it('normalizes a full-scale bin-centered tone to approximately 0 dBFS', async () => {
    const signal = makeSine({ sampleRate: 8000, duration: 1, frequency: 1000, amplitude: 1 });
    const analysis = await computeTone(signal);
    const peak = findPeak(analysis);

    expect(peak.frequency).toBeCloseTo(1000, 0);
    expect(peak.db).toBeGreaterThan(-1);
    expect(peak.db).toBeLessThan(1);
    expect(validateAnalysis(analysis)).toEqual([]);
  });

  it('matches an independent direct DFT for the first frame', async () => {
    const signal = makeSine({ sampleRate: 8000, duration: 1, frequency: 1000, amplitude: 1 });
    const analysis = await computeTone(signal);
    const bin = nearestBin(analysis.frequencies, 1000);
    const direct = directDftDb({
      samples: signal.samples,
      sampleRate: signal.sampleRate,
      fftSize: 1024,
      frequency: analysis.frequencies[bin],
    });
    expect(analysis.db[bin]).toBeCloseTo(direct, 1);
  });

  it('locates a tone onset within one analysis window', async () => {
    const signal = makeSine({
      sampleRate: 8000,
      duration: 1,
      frequency: 1000,
      amplitude: 0.9,
      startTime: 0.5,
      endTime: 1,
    });
    const analysis = await computeTone(signal);
    const bin = nearestBin(analysis.frequencies, 1000);
    let firstFrame = null;
    for (let frame = 0; frame < analysis.frameCount; frame += 1) {
      if (analysis.db[frame * analysis.binCount + bin] > -30) {
        firstFrame = frame;
        break;
      }
    }
    expect(firstFrame).not.toBeNull();
    const windowSeconds = analysis.fftSize / analysis.sampleRate;
    expect(Math.abs(analysis.times[firstFrame] - 0.5))
      .toBeLessThanOrEqual(Math.max(analysis.timeResolution, windowSeconds / 2) + 0.02);
  });

  it('renders silence at the floor and constant input at DC', async () => {
    const silence = await computeTone(makeSilence({ sampleRate: 8000, duration: 1 }));
    expect(silence.signalNotice).toBe('silent');
    expect(silence.maxDb).toBeLessThanOrEqual(-99);

    const constant = await computeTone(makeConstant({ sampleRate: 8000, duration: 1, value: 0.5 }));
    expect(constant.signalNotice).toBe('constant');
    const dcBin = nearestBin(constant.frequencies, 0);
    const middleFrame = Math.floor(constant.frameCount / 2);
    expect(constant.db[middleFrame * constant.binCount + dcBin]).toBeGreaterThan(-10);
    expect(Number.isFinite(constant.db[middleFrame * constant.binCount + dcBin])).toBe(true);
  });

  it('produces at least one frame for a very short input', async () => {
    const short = makeShortBuffer({ sampleRate: 44100, samples: 100 });
    const analysis = await computeSpectrogram({
      samples: short.samples,
      sampleRate: short.sampleRate,
      duration: short.duration,
      timeRange: [0, short.duration],
      frequencyRange: [0, short.sampleRate / 2],
      fftSize: 1024,
      maxFrames: 8,
      maxBins: 16,
    });
    expect(analysis.frameCount).toBeGreaterThanOrEqual(1);
    expect(validateAnalysis(analysis)).toEqual([]);
  });

  it('caps pooled output dimensions', async () => {
    const signal = makeSine({ sampleRate: 8000, duration: 1, frequency: 1000 });
    const analysis = await computeTone(signal, { maxFrames: 16, maxBins: 16 });
    expect(analysis.frameCount).toBeLessThanOrEqual(16);
    expect(analysis.binCount).toBeLessThanOrEqual(16);
    expect(analysis.frequencyPooling).toBeGreaterThan(1);
    expect(validateAnalysis(analysis)).toEqual([]);
  });

  it('honours the requested frame and bin budgets for longer recordings', async () => {
    const signal = makeSine({ sampleRate: 8000, duration: 20, frequency: 1000 });
    const detailed = await computeTone(signal, { maxFrames: 512, maxBins: 256 });
    const sparse = await computeTone(signal, { maxFrames: 64, maxBins: 256 });

    expect(detailed.frameCount).toBeGreaterThan(sparse.frameCount);
    expect(detailed.frameCount).toBeLessThanOrEqual(512);
    expect(sparse.frameCount).toBeLessThanOrEqual(64);
    expect(detailed.binCount).toBe(256);
    expect(sparse.binCount).toBe(256);
    expect(validateAnalysis(detailed)).toEqual([]);
    expect(validateAnalysis(sparse)).toEqual([]);
  });

  it('uses 50% overlap for normal windows and widens the hop only for the frame cap', async () => {
    const normal = makeSine({ sampleRate: 8000, duration: 10, frequency: 1000 });
    const analysis = await computeSpectrogram({
      samples: normal.samples,
      sampleRate: normal.sampleRate,
      duration: normal.duration,
      timeRange: [0, normal.duration],
      frequencyRange: [0, normal.sampleRate / 2],
      fftSize: 1024,
      maxFrames: 2048,
      maxBins: 64,
    });
    expect(analysis.hopSize).toBe(512);
    expect(analysis.frameCount).toBeLessThanOrEqual(2048);

    const long = makeSine({ sampleRate: 8000, duration: 300, frequency: 1000 });
    const capped = await computeSpectrogram({
      samples: long.samples,
      sampleRate: long.sampleRate,
      duration: long.duration,
      timeRange: [0, long.duration],
      frequencyRange: [0, long.sampleRate / 2],
      fftSize: 1024,
      maxFrames: 2048,
      maxBins: 64,
    });
    expect(capped.frameCount).toBeLessThanOrEqual(2048);
    expect(capped.hopSize).toBeGreaterThan(512);
  }, 20000);

  it('limits a visible-band analysis to the selected frequency range', async () => {
    const signal = makeSine({ sampleRate: 8000, duration: 1, frequency: 1000 });
    const analysis = await computeSpectrogram({
      samples: signal.samples,
      sampleRate: signal.sampleRate,
      duration: signal.duration,
      timeRange: [0, signal.duration],
      frequencyRange: [500, 1500],
      fftSize: 1024,
      maxFrames: 64,
      maxBins: 128,
    });

    expect(analysis.frequencyRange).toEqual([500, 1500]);
    expect(analysis.frequencies[0]).toBeGreaterThanOrEqual(500 - 1e-6);
    expect(analysis.frequencies[analysis.binCount - 1]).toBeLessThanOrEqual(1500 + 1e-6);
    expect(analysis.binCount).toBeLessThanOrEqual(128);
    expect(validateAnalysis(analysis)).toEqual([]);
  });

  it('supports the maximum frequency detail within the plan bound', async () => {
    const signal = makeSine({ sampleRate: 44100, duration: 1, frequency: 1000 });
    const analysis = await computeSpectrogram({
      samples: signal.samples,
      sampleRate: signal.sampleRate,
      duration: signal.duration,
      timeRange: [0, signal.duration],
      frequencyRange: [0, signal.sampleRate / 2],
      fftSize: 4096,
      maxFrames: 64,
      maxBins: 1024,
    });

    expect(analysis.binCount).toBe(1024);
    expect(validateAnalysis(analysis)).toEqual([]);
  });
});
