import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useWaveformPeaks } from '../src/components/classifier/useWaveformPeaks';
import { estimateDecodedBytes } from '../src/components/SoundAnalysisTools/processing/useSpectrogram';
import { MAX_DECODED_BYTES } from '../src/components/SoundAnalysisTools/processing/spectrogramModel';

vi.mock('../src/components/SoundAnalysisTools/processing/useSpectrogram', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    estimateDecodedBytes: vi.fn(actual.estimateDecodedBytes),
  };
});

const makeFile = (name = 'sample.mp3', size = 8) =>
  new File([new Uint8Array(size)], name, { type: 'audio/mpeg', lastModified: 0 });

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

beforeEach(() => {
  vi.mocked(estimateDecodedBytes).mockResolvedValue(1024);
});

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

    const { result } = renderHook(() => useWaveformPeaks(makeFile()));

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
    vi.mocked(estimateDecodedBytes).mockResolvedValue(MAX_DECODED_BYTES + 1);

    const { result } = renderHook(() => useWaveformPeaks(makeFile()));

    await waitFor(() => expect(result.current.status).toBe('skipped'));
    expect(result.current.peaks).toBeNull();
    expect(result.current.skippedReason).toMatch(/too large/i);
  });

  it('reports a failed decode without throwing', async () => {
    window.AudioContext = makeAudioContext([Float32Array.from([0.1, 0.2])], { fail: true });

    const { result } = renderHook(() => useWaveformPeaks(makeFile()));

    await waitFor(() => expect(result.current.status).toBe('failed'));
    expect(result.current.error).toMatch(/decode failed/i);
    expect(result.current.peaks).toBeNull();
  });

  it('fails cleanly when the browser has no AudioContext', async () => {
    window.AudioContext = undefined;
    window.webkitAudioContext = undefined;

    const { result } = renderHook(() => useWaveformPeaks(makeFile()));

    await waitFor(() => expect(result.current.status).toBe('failed'));
    expect(result.current.error).toMatch(/unavailable/i);
  });
});
