import { describe, expect, it } from 'vitest';

import {
  applySpeciesToggle,
  buildWindows,
  mapReportSlices,
  windowAtTime,
  windowsEqual,
  windowsToSlices,
} from '../src/components/SoundAnalysisTools/annotation/annotationModel';
import { makeSlice, makeWindows } from './helpers/annotationFixtures';

describe('annotationModel', () => {
  it('builds contiguous ten-second windows including a partial final window', () => {
    expect(buildWindows(0)).toEqual([]);
    expect(buildWindows(9)).toEqual([{ index: 0, start: 0, end: 9 }]);
    expect(buildWindows(22.5)).toEqual([
      { index: 0, start: 0, end: 10 },
      { index: 1, start: 10, end: 20 },
      { index: 2, start: 20, end: 22.5 },
    ]);
  });

  it('maps aligned persisted slices onto the window grid', () => {
    const windows = makeWindows(20);
    const result = mapReportSlices([
      makeSlice(0, { coqui: true }),
      makeSlice(1, { gryllus: true }),
    ], windows);

    expect(result.windows[0].coqui).toBe(true);
    expect(result.windows[1].gryllus).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  it('warns about missing and unaligned persisted windows', () => {
    const windows = makeWindows(30);
    const result = mapReportSlices([
      makeSlice(0, { coqui: true }),
      makeSlice(1, { start_time: 11, end_time: 20 }),
    ], windows);

    expect(result.windows[0].coqui).toBe(true);
    expect(result.windows[1].coqui).toBe(false);
    expect(result.warnings.join(' ')).toMatch(/boundaries/);
    expect(result.warnings.join(' ')).toMatch(/no persisted report/);
  });

  it('warns about duplicate and out-of-range persisted windows', () => {
    const windows = makeWindows(10);
    const result = mapReportSlices([
      makeSlice(0),
      makeSlice(0, { coqui: true }),
      makeSlice(4),
    ], windows);

    expect(result.warnings.join(' ')).toMatch(/duplicate/);
    expect(result.warnings.join(' ')).toMatch(/outside/);
  });

  it('toggles only the selected window and species', () => {
    const windows = makeWindows(20);
    const next = applySpeciesToggle(windows, 1, 'coqui', true);

    expect(next[0].coqui).toBe(false);
    expect(next[1].coqui).toBe(true);
    expect(windows[1].coqui).toBe(false);
  });

  it('compares report state and converts windows to API slices', () => {
    const windows = makeWindows(10);
    expect(windowsEqual(windows, windows.map((window) => ({ ...window })))).toBe(true);
    expect(windowsEqual(windows, applySpeciesToggle(windows, 0, 'coqui', true))).toBe(false);

    const slices = windowsToSlices(applySpeciesToggle(windows, 0, 'coqui', true));
    expect(slices).toEqual([
      expect.objectContaining({
        window_index: 0,
        start_time: 0,
        end_time: 10,
        coqui: true,
      }),
    ]);
  });

  it('maps a time to the containing window and rejects out-of-range times', () => {
    const windows = makeWindows(22.5);
    expect(windowAtTime(windows, 0)).toBe(0);
    expect(windowAtTime(windows, 10)).toBe(1);
    expect(windowAtTime(windows, 22.5)).toBe(2);
    expect(windowAtTime(windows, 23)).toBeNull();
    expect(windowAtTime(windows, -1)).toBeNull();
  });
});
