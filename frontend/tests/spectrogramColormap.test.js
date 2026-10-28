import { describe, expect, it } from 'vitest';

import {
  buildGradientCss,
  buildLut,
  dbToLutIndex,
  dbToRgba,
} from '../src/components/SoundAnalysisTools/processing/spectrogramColormap';

describe('spectrogramColormap', () => {
  it('builds a 256-entry RGBA LUT', () => {
    const lut = buildLut('jet');
    expect(lut).toHaveLength(1024);
    expect(lut[3]).toBe(255);
    expect(lut[1023]).toBe(255);
  });

  it('maps the display range to LUT endpoints', () => {
    expect(dbToLutIndex(-100, -100, 0)).toBe(0);
    expect(dbToLutIndex(0, -100, 0)).toBe(255);
    expect(dbToLutIndex(-50, -100, 0)).toBe(128);
    expect(dbToLutIndex(-200, -100, 0)).toBe(0);
  });

  it('returns RGBA values and a gradient', () => {
    const lut = buildLut('jet');
    const rgba = dbToRgba(-50, lut, -100, 0);
    expect(rgba).toHaveLength(4);
    expect(buildGradientCss(lut)).toContain('linear-gradient');
    expect(buildGradientCss(lut)).toContain('100%');
  });

  it('falls back for an unknown colormap', () => {
    expect(() => buildLut('not-a-colormap')).not.toThrow();
  });
});
