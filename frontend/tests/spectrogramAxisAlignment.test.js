import { describe, expect, it } from 'vitest';

import { computeSpectrogram } from '../src/components/SoundAnalysisTools/processing/spectrogramAnalysis';
import { makeTicks } from '../src/components/SoundAnalysisTools/processing/spectrogramTransforms';
import { makeSine } from './helpers/syntheticAudio';

const rates = [8000, 11025, 16000, 22050, 32000, 44100, 48000, 88200, 96000];
const cases = [];
rates.forEach((sampleRate) => {
  cases.push({ sampleRate, duration: 0.1 });
  cases.push({ sampleRate, duration: 0.2 });
});
cases.push({ sampleRate: 8000, duration: 0.3 });
cases.push({ sampleRate: 96000, duration: 0.3 });

describe('spectrogram axis alignment', () => {
  it('matches Nyquist and duration endpoints across 20 recordings and 8-96 kHz', async () => {
    expect(cases).toHaveLength(20);

    for (const testCase of cases) {
      const signal = makeSine({
        sampleRate: testCase.sampleRate,
        duration: testCase.duration,
        frequency: 1000,
        amplitude: 0.5,
      });
      const analysis = await computeSpectrogram({
        samples: signal.samples,
        sampleRate: signal.sampleRate,
        duration: signal.duration,
        timeRange: [0, signal.duration],
        frequencyRange: [0, signal.sampleRate / 2],
        fftSize: 1024,
        maxFrames: 16,
        maxBins: 1024,
      });

      const nyquist = testCase.sampleRate / 2;
      expect(analysis.nyquist).toBeCloseTo(nyquist, 8);
      expect(Math.abs(analysis.frequencies[analysis.binCount - 1] - nyquist) / nyquist)
        .toBeLessThan(0.005);
      expect(Math.abs(analysis.times[analysis.frameCount - 1] - testCase.duration) / testCase.duration)
        .toBeLessThan(0.005);

      const frequencyTicks = makeTicks(0, nyquist, 6);
      expect(frequencyTicks[frequencyTicks.length - 1].value).toBeCloseTo(nyquist, 8);
      const timeTicks = makeTicks(0, testCase.duration, 6);
      expect(timeTicks[timeTicks.length - 1].value).toBeCloseTo(testCase.duration, 8);
    }
  }, 30000);
});
