import { describe, expect, it, vi } from 'vitest';

import { createWorkerHandler } from '../src/components/SoundAnalysisTools/processing/spectrogram.worker';
import { makeSilence, makeSine } from './helpers/syntheticAudio';

const makeScope = () => {
  const messages = [];
  const scope = {
    messages,
    postMessage: vi.fn((message) => {
      messages.push(message);
    }),
    close: vi.fn(),
  };
  return { scope, handler: createWorkerHandler(scope) };
};

const transfer = (samples) => samples.buffer;

describe('spectrogram worker protocol', () => {
  it('accepts init and replies ready', async () => {
    const { scope, handler } = makeScope();
    const signal = makeSine({ sampleRate: 8000, duration: 0.2, frequency: 1000 });
    await handler.handleMessage({
      data: {
        type: 'init',
        fileId: 'tone',
        sampleRate: signal.sampleRate,
        duration: signal.duration,
        samples: signal.samples,
      },
    });
    expect(scope.messages[0]).toEqual({ type: 'ready', fileId: 'tone' });
  });

  it('returns an analysis result with progress', async () => {
    const { scope, handler } = makeScope();
    const signal = makeSine({ sampleRate: 8000, duration: 0.5, frequency: 1000 });
    await handler.handleMessage({
      data: {
        type: 'init',
        fileId: 'tone',
        sampleRate: signal.sampleRate,
        duration: signal.duration,
        samples: signal.samples,
      },
    });
    await handler.handleMessage({
      data: {
        type: 'analyze',
        requestId: 7,
        timeRange: [0, signal.duration],
        frequencyRange: [0, signal.sampleRate / 2],
        maxFrames: 8,
        maxBins: 16,
        displayMinDb: -100,
        displayMaxDb: 0,
      },
    });

    const result = scope.messages.find((message) => message.type === 'result');
    expect(result).toBeDefined();
    expect(result.requestId).toBe(7);
    expect(result.analysis.analysisId).toBe(7);
    expect(scope.messages.some((message) => message.type === 'progress')).toBe(true);
    expect(scope.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'result' }),
      expect.any(Array),
    );
  });

  it('reports no-frames for an empty recording', async () => {
    const { scope, handler } = makeScope();
    await handler.handleMessage({
      data: {
        type: 'init',
        fileId: 'empty',
        sampleRate: 8000,
        duration: 0,
        samples: new Float32Array(0),
      },
    });
    await handler.handleMessage({
      data: {
        type: 'analyze',
        requestId: 2,
        timeRange: [0, 0],
        frequencyRange: [0, 4000],
        maxFrames: 8,
        maxBins: 8,
      },
    });
    const error = scope.messages.find((message) => message.type === 'error');
    expect(error.error.code).toBe('no-frames');
  });

  it('reports silent input as a notice, not an error', async () => {
    const { scope, handler } = makeScope();
    const signal = makeSilence({ sampleRate: 8000, duration: 0.2 });
    await handler.handleMessage({
      data: {
        type: 'init',
        fileId: 'silence',
        sampleRate: signal.sampleRate,
        duration: signal.duration,
        samples: signal.samples,
      },
    });
    await handler.handleMessage({
      data: {
        type: 'analyze',
        requestId: 3,
        timeRange: [0, signal.duration],
        frequencyRange: [0, signal.sampleRate / 2],
        maxFrames: 8,
        maxBins: 8,
      },
    });
    const result = scope.messages.find((message) => message.type === 'result');
    expect(result.analysis.signalNotice).toBe('silent');
    expect(scope.messages.some((message) => message.type === 'error')).toBe(false);
  });

  it('disposes the worker scope', async () => {
    const { scope, handler } = makeScope();
    await handler.handleMessage({ data: { type: 'dispose' } });
    expect(scope.close).toHaveBeenCalledTimes(1);
  });

  it('keeps transfer buffers available for the result', () => {
    const signal = makeSine({ sampleRate: 8000, duration: 0.1 });
    expect(transfer(signal.samples)).toBe(signal.samples.buffer);
  });
});
