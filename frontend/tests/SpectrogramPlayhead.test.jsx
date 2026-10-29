import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SpectrogramPlayhead from '../src/components/SoundAnalysisTools/render/SpectrogramPlayhead';
import { renderWithTheme } from './helpers/renderWithTheme';

const plotRect = { left: 64, top: 16, width: 720, height: 340 };

describe('SpectrogramPlayhead', () => {
  it('positions the line at the current audio time', () => {
    renderWithTheme(
      <SpectrogramPlayhead
        audioRef={{ current: { currentTime: 0.5 } }}
        timeRange={[0, 1]}
        plotRect={plotRect}
      />,
    );

    const line = screen.getByTestId('spectrogram-playhead');
    expect(line.style.opacity).toBe('1');
    expect(line.style.transform).toBe('translate3d(424px, 0, 0)');
  });

  it('hides the line when audio time is outside the visible window', () => {
    renderWithTheme(
      <SpectrogramPlayhead
        audioRef={{ current: { currentTime: 2 } }}
        timeRange={[0, 1]}
        plotRect={plotRect}
      />,
    );

    const line = screen.getByTestId('spectrogram-playhead');
    expect(line.style.opacity).toBe('0');
  });

  it('hides the line until an audio element exists', () => {
    renderWithTheme(
      <SpectrogramPlayhead
        audioRef={{ current: null }}
        timeRange={[0, 1]}
        plotRect={plotRect}
      />,
    );

    expect(screen.getByTestId('spectrogram-playhead').style.opacity).toBe('0');
  });
});
