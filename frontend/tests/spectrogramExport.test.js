import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createSpectrogramImage,
  spectrogramFileName,
} from '../src/components/SoundAnalysisTools/processing/spectrogramExport';
import theme from '../src/theme/theme';
import { makeAnalysis } from './helpers/spectrogramFixtures';

const makeFakeContext = () => {
  const gradient = { addColorStop: vi.fn() };
  return {
    fillStyle: '',
    strokeStyle: '',
    font: '',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    lineWidth: 1,
    fillRect: vi.fn(),
    fillText: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    drawImage: vi.fn(),
    putImageData: vi.fn(),
    createImageData: vi.fn((width, height) => ({
      data: new Uint8ClampedArray(width * height * 4),
    })),
    createLinearGradient: vi.fn(() => gradient),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
  };
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('spectrogram export', () => {
  it('builds a safe PNG name from the file and visible frame', () => {
    expect(spectrogramFileName('My Call 01.wav', [0, 15])).toBe(
      'My-Call-01-spectrogram-0.00s-15.00s.png',
    );
    expect(spectrogramFileName('spectrogram', [2.5, 7.25])).toBe(
      'spectrogram-2.50s-7.25s.png',
    );
  });

  it('returns nothing when there is no analysis to draw', () => {
    expect(createSpectrogramImage({
      analysis: null,
      timeRange: [0, 1],
      frequencyRange: [0, 4000],
      colorscale: 'jet',
      displayRange: [-100, 0],
    })).toBeNull();
  });

  it('draws the heat map, axes, title, and legend', () => {
    const context = makeFakeContext();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);

    const canvas = createSpectrogramImage({
      analysis: makeAnalysis(),
      timeRange: [0, 1],
      frequencyRange: [0, 4000],
      colorscale: 'jet',
      displayRange: [-100, 0],
      fileName: 'tone.wav',
      theme,
      width: 800,
      height: 600,
    });

    expect(canvas).toBeTruthy();
    expect(context.putImageData).toHaveBeenCalled();
    expect(context.drawImage).toHaveBeenCalled();
    expect(context.fillText).toHaveBeenCalledWith('tone', expect.any(Number), expect.any(Number));
    expect(context.fillText).toHaveBeenCalledWith(
      expect.stringContaining('Time (s)'),
      expect.any(Number),
      expect.any(Number),
    );
    expect(context.createLinearGradient).toHaveBeenCalled();
  });
});
