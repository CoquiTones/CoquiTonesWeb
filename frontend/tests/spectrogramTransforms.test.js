import { describe, expect, it } from 'vitest';

import {
  binIndexAtY,
  cellFromPoint,
  createPlotRect,
  frequencyCellBoundaries,
  frequencyToY,
  frameIndexAtX,
  isInsidePlot,
  makeTicks,
  timeCellBoundaries,
  timeToX,
  xToTime,
  yToFrequency,
} from '../src/components/SoundAnalysisTools/processing/spectrogramTransforms';
import { makeAnalysis } from './helpers/spectrogramFixtures';

const plotRect = createPlotRect({ width: 800, height: 400 });

describe('spectrogramTransforms', () => {
  it('creates the shared plot rectangle', () => {
    expect(plotRect).toEqual({ left: 64, top: 16, width: 720, height: 340 });
  });

  it('round-trips time and frequency coordinates', () => {
    const timeRange = [0, 10];
    const frequencyRange = [0, 8000];
    const time = 2.5;
    const frequency = 3200;
    expect(xToTime(timeToX(time, timeRange, plotRect), timeRange, plotRect)).toBeCloseTo(time, 8);
    expect(yToFrequency(frequencyToY(frequency, frequencyRange, plotRect), frequencyRange, plotRect))
      .toBeCloseTo(frequency, 8);
  });

  it('maps pointer positions to cell indices', () => {
    expect(frameIndexAtX(plotRect.left, 5, plotRect)).toBe(0);
    expect(frameIndexAtX(plotRect.left + plotRect.width, 5, plotRect)).toBe(4);
    expect(binIndexAtY(plotRect.top, 4, plotRect)).toBe(3);
    expect(binIndexAtY(plotRect.top + plotRect.height, 4, plotRect)).toBe(0);
  });

  it('generates endpoint ticks', () => {
    const ticks = makeTicks(0, 1000, 6);
    expect(ticks).toHaveLength(6);
    expect(ticks[0].value).toBe(0);
    expect(ticks[5].value).toBe(1000);
  });

  it('maps a point to a cell from the analysis matrix', () => {
    const analysis = makeAnalysis();
    const timeRange = [0, 1];
    const frequencyRange = [0, 4000];
    const point = {
      x: timeToX(0.5, timeRange, plotRect),
      y: frequencyToY(1000, frequencyRange, plotRect),
    };
    const cell = cellFromPoint(analysis, point, timeRange, frequencyRange, plotRect);
    expect(cell).toMatchObject({ frameIndex: 1, binIndex: 1, time: 0.5, frequency: 1000, dbfs: -30 });
  });

  it('computes cell boundaries and plot containment', () => {
    const [timeStart, timeEnd] = timeCellBoundaries(0.5, 0.5, [0, 1], plotRect);
    expect(timeEnd).toBeGreaterThan(timeStart);
    const [freqTop, freqBottom] = frequencyCellBoundaries(1000, 1000, [0, 4000], plotRect);
    expect(freqBottom).toBeGreaterThan(freqTop);
    expect(isInsidePlot(plotRect.left + 1, plotRect.top + 1, plotRect)).toBe(true);
    expect(isInsidePlot(0, 0, plotRect)).toBe(false);
  });
});
