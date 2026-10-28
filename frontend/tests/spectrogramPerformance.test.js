import { describe, expect, it } from 'vitest';

import { computeSpectrogram } from '../src/components/SoundAnalysisTools/processing/spectrogramAnalysis';
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
      maxFrames: 256,
      maxBins: 256,
    });
    const elapsed = performance.now() - started;

    expect(analysis.frameCount).toBeLessThanOrEqual(256);
    expect(analysis.binCount).toBeLessThanOrEqual(256);
    expect(analysis.db.length).toBe(analysis.frameCount * analysis.binCount);
    expect(elapsed).toBeLessThan(10000);
  }, 20000);
});
