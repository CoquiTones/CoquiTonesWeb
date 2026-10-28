import { describe, expect, it } from 'vitest';

import {
  formatDbfs,
  formatFrequency,
  formatFrequencyTick,
  formatTime,
  formatTimeTick,
} from '../src/components/SoundAnalysisTools/processing/spectrogramFormat';

describe('spectrogramFormat', () => {
  it('formats time with units', () => {
    expect(formatTime(2.04)).toBe('2.04 s');
    expect(formatTime(62.4)).toBe('1:02.40');
    expect(formatTimeTick(0)).toBe('0.0');
    expect(formatTimeTick(65)).toBe('1:05');
  });

  it('formats frequency with units', () => {
    expect(formatFrequency(940)).toBe('940 Hz');
    expect(formatFrequency(3200)).toBe('3.20 kHz');
    expect(formatFrequencyTick(1000)).toBe('1.0k');
    expect(formatFrequencyTick(22050)).toBe('22k');
  });

  it('formats intensity with one decimal and dBFS', () => {
    expect(formatDbfs(-18.44)).toBe('-18.4 dBFS');
    expect(formatDbfs(0)).toBe('0.0 dBFS');
  });
});
