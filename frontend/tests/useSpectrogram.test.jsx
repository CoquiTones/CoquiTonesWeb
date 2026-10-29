import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  estimateDecodedBytes,
  useSpectrogram,
} from '../src/components/SoundAnalysisTools/processing/useSpectrogram';
import { makeAnalysis } from './helpers/spectrogramFixtures';
import { makeSineFile } from './helpers/syntheticAudio';

class FakeWorker {
  static instances = [];
  static duration = 1;
  static sampleRate = 8000;
  static fftSize = 1024;

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
        const [start, end] = message.timeRange;
        const span = Math.max(0, end - start);
        const budgetHop = Math.ceil(
          (span * FakeWorker.sampleRate) / Math.max(1, message.maxFrames - 1),
        );
        const hopSize = Math.max(FakeWorker.fftSize / 2, budgetHop);
        this.onmessage?.({ data: { type: 'progress', requestId: message.requestId, progress: 0.5 } });
        this.onmessage?.({
          data: {
            type: 'result',
            requestId: message.requestId,
            analysis: makeAnalysis({
              analysisId: message.requestId,
              timeRange: message.timeRange,
              frequencyRange: message.frequencyRange,
              analysisStart: start,
              analysisEnd: end,
              duration: FakeWorker.duration,
              sampleRate: FakeWorker.sampleRate,
              fftSize: FakeWorker.fftSize,
              hopSize,
              timeResolution: hopSize / FakeWorker.sampleRate,
              frameCount: 3,
              binCount: 3,
              times: Float32Array.from([start, start + span / 2, end]),
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
  FakeWorker.duration = 1;
  FakeWorker.sampleRate = 8000;
  FakeWorker.fftSize = 1024;
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
      useSpectrogram({ audioFile: file }),
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
      useSpectrogram({ audioFile: file }),
    );

    await waitFor(() => expect(result.current.status).toBe('failed'));
    expect(result.current.error.code).toBe('over-budget');
  });

  it('precomputes the whole file when it fits the frame budget', async () => {
    const samples = new Float32Array(8000);
    window.AudioContext = makeAudioContext(samples);
    window.webkitAudioContext = window.AudioContext;
    vi.stubGlobal('Worker', FakeWorker);

    const file = makeSineFile({ sampleRate: 8000, duration: 1 });
    const { result } = renderHook(() =>
      useSpectrogram({ audioFile: file, timeRange: [0.25, 0.75] }),
    );

    await waitFor(() => expect(result.current.status).toBe('ready'));
    const worker = FakeWorker.instances[0];
    const analyze = worker.messages.find((message) => message.type === 'analyze');
    expect(analyze.timeRange).toEqual([0, 1]);
    expect(analyze.frequencyRange).toEqual([0, 4000]);
  });

  it('does not re-analyze when zooming inside a precomputed full file', async () => {
    const samples = new Float32Array(8000);
    window.AudioContext = makeAudioContext(samples);
    window.webkitAudioContext = window.AudioContext;
    vi.stubGlobal('Worker', FakeWorker);

    const file = makeSineFile({ sampleRate: 8000, duration: 1 });
    const { result, rerender } = renderHook(
      ({ timeRange }) => useSpectrogram({ audioFile: file, timeRange }),
      { initialProps: { timeRange: [0, 1] } },
    );

    await waitFor(() => expect(result.current.status).toBe('ready'));
    const worker = FakeWorker.instances[0];
    const analyzeCount = () => worker.messages.filter((message) => message.type === 'analyze').length;

    expect(analyzeCount()).toBe(1);

    rerender({ timeRange: [0.25, 0.75] });
    expect(result.current.status).toBe('ready');
    expect(analyzeCount()).toBe(1);
    expect(result.current.analysis.timeRange).toEqual([0, 1]);
  });

  it('treats a frequency-only change as a crop without re-analysis', async () => {
    const samples = new Float32Array(8000);
    window.AudioContext = makeAudioContext(samples);
    window.webkitAudioContext = window.AudioContext;
    vi.stubGlobal('Worker', FakeWorker);

    const file = makeSineFile({ sampleRate: 8000, duration: 1 });
    const { result, rerender } = renderHook(
      ({ frequencyRange }) => useSpectrogram({
        audioFile: file,
        timeRange: [0, 1],
        frequencyRange,
      }),
      { initialProps: { frequencyRange: [0, 4000] } },
    );

    await waitFor(() => expect(result.current.status).toBe('ready'));
    const worker = FakeWorker.instances[0];
    const analyzeCount = () => worker.messages.filter((message) => message.type === 'analyze').length;
    expect(analyzeCount()).toBe(1);

    rerender({ frequencyRange: [500, 2000] });

    expect(analyzeCount()).toBe(1);
    expect(result.current.status).toBe('ready');
    expect(result.current.analysis.frequencyRange).toEqual([0, 4000]);
  });

  it('quietly refines a zoomed full-file window at 50% overlap', async () => {
    const samples = new Float32Array(8000);
    window.AudioContext = makeAudioContext(samples, 8000, 200);
    window.webkitAudioContext = window.AudioContext;
    vi.stubGlobal('Worker', FakeWorker);
    FakeWorker.duration = 200;

    const file = makeSineFile({ sampleRate: 8000, duration: 1 });
    const { result, rerender } = renderHook(
      ({ timeRange }) => useSpectrogram({ audioFile: file, timeRange, maxFrames: 2048 }),
      { initialProps: { timeRange: [0, 15] } },
    );

    await waitFor(() => expect(result.current.status).toBe('ready'));
    const worker = FakeWorker.instances[0];
    const analyses = () => worker.messages.filter((message) => message.type === 'analyze');
    await waitFor(() => expect(analyses()).toHaveLength(2));

    // The first pass caches the whole file; the second refines only the view.
    expect(analyses()[0].timeRange).toEqual([0, 200]);
    expect(analyses()[1].timeRange).toEqual([0, 15]);

    await waitFor(() => expect(result.current.analysis.timeRange).toEqual([0, 15]));
    expect(result.current.analysis.hopSize).toBe(512);
    expect(result.current.status).toBe('ready');
    await waitFor(() => expect(result.current.refining).toBe(false));

    // Zooming inside the refined view is immediate and does not re-analyze.
    rerender({ timeRange: [5, 10] });
    expect(analyses()).toHaveLength(2);
    expect(result.current.analysis.timeRange).toEqual([0, 15]);
  });

  it('manually re-renders only the visible segment', async () => {
    const samples = new Float32Array(8000);
    window.AudioContext = makeAudioContext(samples);
    window.webkitAudioContext = window.AudioContext;
    vi.stubGlobal('Worker', FakeWorker);

    const file = makeSineFile({ sampleRate: 8000, duration: 1 });
    const { result } = renderHook(() =>
      useSpectrogram({
        audioFile: file,
        timeRange: [0.25, 0.75],
        frequencyRange: [500, 2000],
      }),
    );

    await waitFor(() => expect(result.current.status).toBe('ready'));
    const worker = FakeWorker.instances[0];
    const analyses = () => worker.messages.filter((message) => message.type === 'analyze');
    expect(analyses()).toHaveLength(1);

    act(() => {
      expect(result.current.rerenderVisible()).toBe(true);
    });

    expect(result.current.status).toBe('ready');
    await waitFor(() => expect(analyses()).toHaveLength(2));
    expect(analyses()[1].timeRange).toEqual([0.25, 0.75]);
    expect(analyses()[1].frequencyRange).toEqual([500, 2000]);
    await waitFor(() => expect(result.current.refining).toBe(false));
    expect(result.current.analysis.timeRange).toEqual([0.25, 0.75]);
  });

  it('clamps requested ranges before sending them to the worker', async () => {
    const samples = new Float32Array(8000);
    window.AudioContext = makeAudioContext(samples);
    window.webkitAudioContext = window.AudioContext;
    vi.stubGlobal('Worker', FakeWorker);

    const file = makeSineFile({ sampleRate: 8000, duration: 1 });
    const { result } = renderHook(() =>
      useSpectrogram({ audioFile: file, timeRange: [-1, 5], maxFrames: 8 }),
    );

    await waitFor(() => expect(result.current.status).toBe('ready'));
    const analyze = FakeWorker.instances[0].messages.find((message) => message.type === 'analyze');
    expect(analyze.timeRange).toEqual([0, 1]);
    expect(analyze.frequencyRange).toEqual([0, 4000]);
  });

  it('re-analyzes a new window only when the cached analysis does not cover it', async () => {
    const samples = new Float32Array(8000);
    window.AudioContext = makeAudioContext(samples);
    window.webkitAudioContext = window.AudioContext;
    vi.stubGlobal('Worker', FakeWorker);

    const file = makeSineFile({ sampleRate: 8000, duration: 1 });
    const { result, rerender } = renderHook(
      ({ timeRange }) => useSpectrogram({ audioFile: file, timeRange, maxFrames: 8 }),
      { initialProps: { timeRange: [0, 0.5] } },
    );

    await waitFor(() => expect(result.current.status).toBe('ready'));
    const worker = FakeWorker.instances[0];
    const analyzeCount = () => worker.messages.filter((message) => message.type === 'analyze').length;

    expect(analyzeCount()).toBe(1);

    // This zoom stays inside the analyzed [0, 0.5] window: no new STFT.
    rerender({ timeRange: [0.1, 0.4] });
    expect(analyzeCount()).toBe(1);
    expect(result.current.status).toBe('ready');

    // This window is outside the cached extent, so a new visible-window
    // analysis is required.
    rerender({ timeRange: [0.5, 1] });
    await waitFor(() => expect(analyzeCount()).toBe(2));
    const analyses = worker.messages.filter((message) => message.type === 'analyze');
    expect(analyses[1].timeRange).toEqual([0.5, 1]);
    expect(analyses[1].frequencyRange).toEqual([0, 4000]);
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.analysis.timeRange).toEqual([0.5, 1]);
  });

  it('regenerates with new detail without decoding the file again', async () => {
    const samples = new Float32Array(8000);
    window.AudioContext = makeAudioContext(samples);
    window.webkitAudioContext = window.AudioContext;
    vi.stubGlobal('Worker', FakeWorker);

    const file = makeSineFile({ sampleRate: 8000, duration: 1 });
    const { result, rerender } = renderHook(
      ({ maxFrames, maxBins }) => useSpectrogram({ audioFile: file, maxFrames, maxBins }),
      { initialProps: { maxFrames: 2048, maxBins: 1024 } },
    );

    await waitFor(() => expect(result.current.status).toBe('ready'));
    const initialAnalysis = result.current.analysis;
    const worker = FakeWorker.instances[0];
    const messagesOfType = (type) => worker.messages.filter((message) => message.type === type);

    expect(messagesOfType('analyze')).toHaveLength(1);
    expect(messagesOfType('init')).toHaveLength(1);

    rerender({ maxFrames: 512, maxBins: 256 });

    await waitFor(() => expect(messagesOfType('analyze')).toHaveLength(2));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    const analyses = messagesOfType('analyze');
    expect(analyses[1].maxFrames).toBe(512);
    expect(analyses[1].maxBins).toBe(256);
    // The worker is reused and keeps the decoded samples; only the STFT reruns.
    expect(FakeWorker.instances).toHaveLength(1);
    expect(messagesOfType('init')).toHaveLength(1);
    expect(result.current.analysis).not.toBe(initialAnalysis);
    expect(result.current.analysis.timeRange).toEqual([0, 1]);
  });
});
