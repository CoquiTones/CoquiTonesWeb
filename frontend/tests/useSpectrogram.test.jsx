import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  estimateDecodedBytes,
  useSpectrogram,
} from '../src/components/SoundAnalysisTools/processing/useSpectrogram';
import { makeAnalysis } from './helpers/spectrogramFixtures';
import { makeSineFile } from './helpers/syntheticAudio';

class FakeWorker {
  static instances = [];

  constructor() {
    this.messages = [];
    this.onmessage = null;
    FakeWorker.instances.push(this);
  }

  postMessage(message) {
    this.messages.push(message);
    if (message.type === 'init') {
      queueMicrotask(() => this.onmessage?.({ data: { type: 'ready', fileId: message.fileId } }));
    }
    if (message.type === 'analyze') {
      queueMicrotask(() => {
        this.onmessage?.({ data: { type: 'progress', requestId: message.requestId, progress: 0.5 } });
        this.onmessage?.({
          data: {
            type: 'result',
            requestId: message.requestId,
            analysis: makeAnalysis({
              analysisId: message.requestId,
              timeRange: message.timeRange,
              frequencyRange: message.frequencyRange,
              analysisStart: message.timeRange[0],
              analysisEnd: message.timeRange[1],
            }),
          },
        });
      });
    }
  }

  terminate() {}
}

const makeAudioContext = (samples, sampleRate = 8000, duration = 1) =>
  class FakeAudioContext {
    async decodeAudioData() {
      return {
        length: samples.length,
        duration,
        sampleRate,
        numberOfChannels: 1,
        getChannelData: () => samples,
      };
    }

    async close() {}
  };

afterEach(() => {
  vi.unstubAllGlobals();
  FakeWorker.instances = [];
});

describe('estimateDecodedBytes', () => {
  it('estimates decoded Float32 bytes for a WAV file', async () => {
    const file = makeSineFile({ sampleRate: 8000, duration: 1 });
    const bytes = await estimateDecodedBytes(file);
    expect(bytes).toBeGreaterThan(0);
    expect(bytes).toBeLessThan(250 * 1024 * 1024);
  });

  it('uses a conservative factor for compressed files', async () => {
    const file = new File([new Uint8Array(1024)], 'recording.mp3', { type: 'audio/mpeg' });
    await expect(estimateDecodedBytes(file)).resolves.toBe(1024 * 20);
  });
});

describe('useSpectrogram', () => {
  it('decodes once and reaches ready with an analysis', async () => {
    const samples = new Float32Array(8000);
    window.AudioContext = makeAudioContext(samples);
    window.webkitAudioContext = window.AudioContext;
    vi.stubGlobal('Worker', FakeWorker);

    const file = makeSineFile({ sampleRate: 8000, duration: 1 });
    const { result } = renderHook(() =>
      useSpectrogram({ audioFile: file, timeRange: [0, 1], frequencyRange: [0, 4000] }),
    );

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.analysis).toBeTruthy();
    expect(result.current.analysis.analysisId).toBe(1);
    expect(FakeWorker.instances).toHaveLength(1);
  });

  it('rejects an over-budget file before decoding', async () => {
    const file = new File([new Uint8Array(1)], 'huge.mp3', { type: 'audio/mpeg' });
    Object.defineProperty(file, 'size', { value: 20 * 1024 * 1024 });

    const { result } = renderHook(() =>
      useSpectrogram({ audioFile: file, timeRange: [0, 1], frequencyRange: [0, 4000] }),
    );

    await waitFor(() => expect(result.current.status).toBe('failed'));
    expect(result.current.error.code).toBe('over-budget');
  });

  it('crops a time range that is inside the cached analysis', async () => {
    const samples = new Float32Array(8000);
    window.AudioContext = makeAudioContext(samples);
    window.webkitAudioContext = window.AudioContext;
    vi.stubGlobal('Worker', FakeWorker);

    const file = makeSineFile({ sampleRate: 8000, duration: 1 });
    const { result, rerender } = renderHook(
      ({ timeRange }) =>
        useSpectrogram({ audioFile: file, timeRange, frequencyRange: [0, 4000] }),
      { initialProps: { timeRange: [0, 1] } },
    );

    await waitFor(() => expect(result.current.status).toBe('ready'));
    rerender({ timeRange: [0.5, 1] });
    await waitFor(() => expect(result.current.analysis.analysisStart).toBe(0.5));
  });
});
