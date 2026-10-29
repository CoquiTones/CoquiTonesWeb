import { describe, expect, it } from 'vitest';

import { computeSpectrogram } from '../src/components/SoundAnalysisTools/processing/spectrogramAnalysis';
import {
  createPlotRect,
  frequencyCellBoundaries,
  frequencyToY,
  makeTicks,
  timeCellBoundaries,
  timeToX,
} from '../src/components/SoundAnalysisTools/processing/spectrogramTransforms';
import { makeSine } from './helpers/syntheticAudio';

const nearestIndex = (values, target) => {
  let best = 0;
  let distance = Infinity;
  values.forEach((value, index) => {
    const nextDistance = Math.abs(value - target);
    if (nextDistance < distance) {
      distance = nextDistance;
      best = index;
    }
  });
  return best;
};

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

      const plotRect = createPlotRect({ width: 800, height: 400 });
      const timeRange = [0, testCase.duration];
      const frequencyRange = [0, nyquist];

      const alignmentTimeTicks = makeTicks(0, testCase.duration, 3);
      const alignmentFrequencyTicks = makeTicks(0, nyquist, 3);
      expect(timeToX(alignmentTimeTicks[0].value, timeRange, plotRect)).toBeCloseTo(
        plotRect.left,
        8,
      );
      expect(timeToX(alignmentTimeTicks[1].value, timeRange, plotRect)).toBeCloseTo(
        plotRect.left + plotRect.width / 2,
        8,
      );
      expect(timeToX(timeTicks[timeTicks.length - 1].value, timeRange, plotRect)).toBeCloseTo(
        plotRect.left + plotRect.width,
        8,
      );
      expect(frequencyToY(frequencyTicks[0].value, frequencyRange, plotRect)).toBeCloseTo(
        plotRect.top + plotRect.height,
        8,
      );
      expect(frequencyToY(frequencyTicks[frequencyTicks.length - 1].value, frequencyRange, plotRect))
        .toBeCloseTo(plotRect.top, 8);

      const [firstLeft] = timeCellBoundaries(
        analysis.times[0],
        analysis.timeResolution,
        timeRange,
        plotRect,
      );
      const [, lastRight] = timeCellBoundaries(
        analysis.times[analysis.frameCount - 1],
        analysis.timeResolution,
        timeRange,
        plotRect,
      );
      expect(firstLeft).toBeCloseTo(plotRect.left, 8);
      expect(lastRight).toBeCloseTo(plotRect.left + plotRect.width, 8);

      const [, firstBottom] = frequencyCellBoundaries(
        analysis.frequencies[0],
        analysis.frequencyResolution,
        frequencyRange,
        plotRect,
      );
      const [lastTop] = frequencyCellBoundaries(
        analysis.frequencies[analysis.binCount - 1],
        analysis.frequencyResolution,
        frequencyRange,
        plotRect,
      );
      expect(firstBottom).toBeCloseTo(plotRect.top + plotRect.height, 8);
      expect(lastTop).toBeCloseTo(plotRect.top, 8);

      const middleTime = alignmentTimeTicks[1].value;
      const middleFrame = nearestIndex(analysis.times, middleTime);
      const timeLeftEdge = middleFrame === 0
        ? plotRect.left
        : timeToX(
          (analysis.times[middleFrame - 1] + analysis.times[middleFrame]) / 2,
          timeRange,
          plotRect,
        );
      const timeRightEdge = middleFrame === analysis.frameCount - 1
        ? plotRect.left + plotRect.width
        : timeToX(
          (analysis.times[middleFrame] + analysis.times[middleFrame + 1]) / 2,
          timeRange,
          plotRect,
        );
      const middleX = timeToX(middleTime, timeRange, plotRect);
      expect(middleX).toBeGreaterThanOrEqual(timeLeftEdge - 1e-6);
      expect(middleX).toBeLessThanOrEqual(timeRightEdge + 1e-6);

      const middleFrequency = alignmentFrequencyTicks[1].value;
      const middleBin = nearestIndex(analysis.frequencies, middleFrequency);
      const binTopEdge = middleBin === analysis.binCount - 1
        ? plotRect.top
        : frequencyToY(
          (analysis.frequencies[middleBin] + analysis.frequencies[middleBin + 1]) / 2,
          frequencyRange,
          plotRect,
        );
      const binBottomEdge = middleBin === 0
        ? plotRect.top + plotRect.height
        : frequencyToY(
          (analysis.frequencies[middleBin - 1] + analysis.frequencies[middleBin]) / 2,
          frequencyRange,
          plotRect,
        );
      const middleY = frequencyToY(middleFrequency, frequencyRange, plotRect);
      expect(middleY).toBeGreaterThanOrEqual(binTopEdge - 1e-6);
      expect(middleY).toBeLessThanOrEqual(binBottomEdge + 1e-6);
    }
  }, 30000);
});
