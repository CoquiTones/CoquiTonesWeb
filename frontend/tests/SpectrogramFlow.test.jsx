import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Spectrogram from '../src/components/SoundAnalysisTools/render/Spectrogram';
import { useSpectrogram } from '../src/components/SoundAnalysisTools/processing/useSpectrogram';
import { makeAnalysis } from './helpers/spectrogramFixtures';
import { renderWithTheme } from './helpers/renderWithTheme';

vi.mock('../src/components/SoundAnalysisTools/processing/useSpectrogram', () => ({
  useSpectrogram: vi.fn(),
}));

const file = new File([new Uint8Array(1)], 'fixture.wav', { type: 'audio/wav' });

describe('Spectrogram flow', () => {
  beforeEach(() => {
    useSpectrogram.mockReturnValue({
      status: 'ready',
      progress: null,
      error: null,
      analysis: makeAnalysis(),
      retry: vi.fn(),
    });
  });

  it('renders the plot and legend when analysis is ready', () => {
    renderWithTheme(
      <Spectrogram
        audioFile={file}
        timeRange={[0, 1]}
        frequencyRange={[0, 4000]}
        colorscale="jet"
        onProcessingChange={() => {}}
      />,
    );

    expect(screen.getByRole('application', { name: /Spectrogram of fixture.wav/ })).toBeTruthy();
    expect(screen.getByText('Intensity')).toBeTruthy();
    expect(screen.getByText('-100.0 dBFS')).toBeTruthy();
    // Viewport ranges are rendering concerns only; they must not trigger a
    // new analysis of the decoded recording.
    expect(useSpectrogram).toHaveBeenCalledWith({ audioFile: file });
  });

  it('emits the processing state to the page', async () => {
    const onProcessingChange = vi.fn();
    renderWithTheme(
      <Spectrogram
        audioFile={file}
        timeRange={[0, 1]}
        frequencyRange={[0, 4000]}
        colorscale="jet"
        onProcessingChange={onProcessingChange}
      />,
    );

    await waitFor(() => expect(onProcessingChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'ready' }),
    ));
  });
});
