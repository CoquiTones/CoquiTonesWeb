import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SpectralAnalysis from '../src/pages/SpectralAnalysis';
import { renderWithTheme } from './helpers/renderWithTheme';

vi.mock('../src/components/shared/DataManager', () => ({
  default: function MockDataManager({ setAudioFile, setStats }) {
    return (
      <button
        type="button"
        onClick={() => {
          setAudioFile(new File([new Uint8Array([1])], 'local.wav', { type: 'audio/wav' }));
          setStats({
            duration: 25,
            sampleRate: 22050,
            numberOfChannels: 1,
            bitrate: 128000,
            codec: 'WAV',
            size: 1,
          });
        }}
      >
        Load fixture
      </button>
    );
  },
}));

vi.mock('../src/components/SoundAnalysisTools/render/Spectrogram', () => ({
  default: () => <div data-testid="spectrogram-stub" />,
}));

vi.mock('../src/components/SoundAnalysisTools/render/SpectrogramControls', () => ({
  default: () => <div data-testid="controls-stub" />,
}));

vi.mock('../src/components/SoundAnalysisTools/render/SoundPlayer', () => ({
  default: () => <div data-testid="player-stub" />,
}));

describe('SpectralAnalysis annotation flow', () => {
  it('loads local audio, annotates a pinned window, and guards unsaved changes', () => {
    renderWithTheme(<SpectralAnalysis />);

    fireEvent.click(screen.getByRole('button', { name: 'Load fixture' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open spectrogram settings' }));
    expect(screen.getByText('Species annotations')).toBeTruthy();
    expect(screen.getByText('Select a ten-second window')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Next ten-second window' }));
    expect(screen.getByText('Window 1 of 3')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Editor' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next ten-second window' }));
    expect(screen.getByText('Window 2 of 3')).toBeTruthy();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Coquí' }));
    expect(screen.getByText('Unsaved changes')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Reported' }));
    expect(screen.getByText('Discard annotation changes?')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(screen.getByText('Unsaved changes')).toBeTruthy();
  }, 15000);
});
