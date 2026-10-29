import { describe, expect, it } from 'vitest';

import { computeSpectrogram } from '../src/components/SoundAnalysisTools/processing/spectrogramAnalysis';
import {
  DEFAULT_MAX_BINS,
  DEFAULT_MAX_FRAMES,
  MAX_BINS,
  MAX_FRAMES,
} from '../src/components/SoundAnalysisTools/processing/spectrogramModel';
import { makeSine } from './helpers/syntheticAudio';

describe('spectrogram performance', () => {
  it('renders a 10-second 44.1 kHz recording with bounded dimensions', async () => {
    const signal = makeSine({ sampleRate: 44100, duration: 10, frequency: 1000 });
    const started = performance.now();
    const analysis = await computeSpectrogram({
      samples: signal.samples,
      sampleRate: signal.sampleRate,
      duration: signal.duration,
      timeRange: [0, signal.duration],
      frequencyRange: [0, signal.sampleRate / 2],
      maxFrames: DEFAULT_MAX_FRAMES,
      maxBins: DEFAULT_MAX_BINS,
    });
    const elapsed = performance.now() - started;

    // The default profile is Medium; the plan still caps the matrix at
    // 2048 time frames by 1024 frequency rows.
    expect(DEFAULT_MAX_FRAMES).toBe(1536);
    expect(DEFAULT_MAX_BINS).toBe(768);
    expect(MAX_FRAMES).toBe(2048);
    expect(MAX_BINS).toBe(1024);
    expect(analysis.frameCount).toBeLessThanOrEqual(DEFAULT_MAX_FRAMES);
    expect(analysis.binCount).toBeLessThanOrEqual(DEFAULT_MAX_BINS);
    expect(analysis.db.length).toBe(analysis.frameCount * analysis.binCount);
    expect(elapsed).toBeLessThan(10000);
  }, 20000);
});
