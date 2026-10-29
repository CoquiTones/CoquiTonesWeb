import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useWaveformPeaks } from '../src/components/classifier/useWaveformPeaks';

const makeFile = (name = 'sample.mp3', size = 8) =>
  new File([new Uint8Array(size)], name, { type: 'audio/mpeg', lastModified: 0 });

/**
 * A tiny WAV header that advertises a huge data chunk. The decoder guard reads
 * the header before touching audio data, so this exercises the over-budget
 * branch without allocating a large buffer in the test.
 */
const makeOversizedWavFile = () => {
  const bytes = new Uint8Array(44);
  const view = new DataView(bytes.buffer);
  view.setUint16(34, 16, true);
  view.setUint32(40, 0xffffffff, true);
  return new File([bytes], 'large.wav', { type: 'audio/wav', lastModified: 0 });
};

const makeAudioContext = (channels, { duration = 1, fail = false } = {}) =>
  class FakeAudioContext {
    async decodeAudioData() {
      if (fail) throw new Error('decode failed');
      return {
        length: channels[0]?.length ?? 0,
        duration,
        sampleRate: 8000,
        numberOfChannels: channels.length,
        getChannelData: (index) => channels[index],
      };
    }

    async close() {}
  };

const originalAudioContext = window.AudioContext;
const originalWebkitAudioContext = window.webkitAudioContext;

afterEach(() => {
  window.AudioContext = originalAudioContext;
  window.webkitAudioContext = originalWebkitAudioContext;
});

describe('useWaveformPeaks', () => {
  it('stays idle without a file', () => {
    const { result } = renderHook(() => useWaveformPeaks(null));
    expect(result.current.status).toBe('idle');
    expect(result.current.peaks).toBeNull();
  });

  it('decodes channels and returns a normalized envelope', async () => {
    window.AudioContext = makeAudioContext(
      [
        Float32Array.from([0, 1, 0, -1]),
        Float32Array.from([0.5, 0.5, 0.5, 0.5]),
      ],
      { duration: 0.5 },
    );

    const file = makeFile();
    const { result } = renderHook(() => useWaveformPeaks(file));

    await waitFor(() => expect(result.current.status).toBe('ready'));

    expect(result.current.duration).toBe(0.5);
    expect(result.current.peaks).toHaveLength(4);
    expect(Math.max(...result.current.peaks)).toBeCloseTo(1);
  });

  it('skips the preview when the decoded size would exceed the budget', async () => {
    window.AudioContext = class ShouldNotBeUsed {
      constructor() {
        throw new Error('decode should not start');
      }
    };

    const file = makeOversizedWavFile();
    const { result } = renderHook(() => useWaveformPeaks(file));

    await waitFor(() => expect(result.current.status).toBe('skipped'));
    expect(result.current.peaks).toBeNull();
    expect(result.current.skippedReason).toMatch(/too large/i);
  });

  it('reports a failed decode without throwing', async () => {
    window.AudioContext = makeAudioContext([Float32Array.from([0.1, 0.2])], { fail: true });

    const file = makeFile();
    const { result } = renderHook(() => useWaveformPeaks(file));

    await waitFor(() => expect(result.current.status).toBe('failed'));
    expect(result.current.error).toMatch(/decode failed/i);
    expect(result.current.peaks).toBeNull();
  });

  it('fails cleanly when the browser has no AudioContext', async () => {
    window.AudioContext = undefined;
    window.webkitAudioContext = undefined;

    const file = makeFile();
    const { result } = renderHook(() => useWaveformPeaks(file));

    await waitFor(() => expect(result.current.status).toBe('failed'));
    expect(result.current.error).toMatch(/unavailable/i);
  });
});
