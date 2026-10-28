import { describe, expect, it } from 'vitest';

import {
  MAX_FRAMES,
  clampRange,
  validateAnalysis,
} from '../src/components/SoundAnalysisTools/processing/spectrogramModel';
import { makeAnalysis } from './helpers/spectrogramFixtures';

describe('spectrogramModel', () => {
  it('accepts a valid analysis', () => {
    expect(validateAnalysis(makeAnalysis())).toEqual([]);
  });

  it('rejects mismatched db dimensions', () => {
    const analysis = makeAnalysis({ db: new Float32Array(3) });
    expect(validateAnalysis(analysis)).toContain('db length must equal frameCount * binCount');
  });

  it('rejects non-monotonic times', () => {
    const analysis = makeAnalysis({ times: new Float32Array([0, 0.5, 0.4]) });
    expect(validateAnalysis(analysis)).toContain('times must be strictly increasing');
  });

  it('rejects db values below the display floor', () => {
    const db = new Float32Array(makeAnalysis().db);
    db[0] = -120;
    const analysis = makeAnalysis({ db });
    expect(validateAnalysis(analysis)).toContain('db values must be finite and at or above displayMinDb');
  });

  it('rejects a non-power-of-two FFT size and oversized matrices', () => {
    expect(validateAnalysis(makeAnalysis({ fftSize: 1000 }))).toContain('fftSize must be a power of two in [1024, 4096]');
    expect(validateAnalysis(makeAnalysis({ frameCount: MAX_FRAMES + 1, times: new Float32Array(MAX_FRAMES + 1), db: new Float32Array((MAX_FRAMES + 1) * 3) })))
      .toContain(`frameCount must not exceed ${MAX_FRAMES}`);
  });

  it('clamps ranges and enforces a minimum span', () => {
    expect(clampRange([-1, 2], 0, 1)).toEqual([0, 1]);
    expect(clampRange([0.8, 0.9], 0, 1, 0.2)).toEqual([0.8, 1]);
    expect(clampRange([2, 3], 0, 1, 0.2)).toEqual([0.8, 1]);
  });
});
