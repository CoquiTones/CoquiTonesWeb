import { createRef } from 'react';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Spectrogram from '../src/components/SoundAnalysisTools/render/Spectrogram';
import { useSpectrogram } from '../src/components/SoundAnalysisTools/processing/useSpectrogram';
import {
  createSpectrogramImage,
  downloadSpectrogramImage,
} from '../src/components/SoundAnalysisTools/processing/spectrogramExport';
import { makeAnalysis } from './helpers/spectrogramFixtures';
import { renderWithTheme } from './helpers/renderWithTheme';

vi.mock('../src/components/SoundAnalysisTools/processing/useSpectrogram', () => ({
  useSpectrogram: vi.fn(),
}));

vi.mock('../src/components/SoundAnalysisTools/processing/spectrogramExport', () => ({
  createSpectrogramImage: vi.fn(() => ({ fakeCanvas: true })),
  downloadSpectrogramImage: vi.fn(() => true),
  spectrogramFileName: vi.fn(() => 'fixture-spectrogram.png'),
}));

const file = new File([new Uint8Array(1)], 'fixture.wav', { type: 'audio/wav' });

describe('Spectrogram flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSpectrogram.mockReturnValue({
      status: 'ready',
      progress: null,
      error: null,
      analysis: makeAnalysis(),
      rerenderVisible: vi.fn(),
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
    expect(useSpectrogram).toHaveBeenCalledWith(expect.objectContaining({
      audioFile: file,
      timeRange: [0, 1],
      frequencyRange: [0, 4000],
    }));
  });

  it('exports the visible frame through the imperative screenshot handle', () => {
    const ref = createRef();
    renderWithTheme(
      <Spectrogram
        ref={ref}
        audioFile={file}
        timeRange={[0, 1]}
        frequencyRange={[0, 4000]}
        colorscale="jet"
        onProcessingChange={() => {}}
      />,
    );

    expect(ref.current.exportScreenshot).toBeTypeOf('function');
    expect(ref.current.exportScreenshot()).toBe(true);
    expect(createSpectrogramImage).toHaveBeenCalledWith(expect.objectContaining({
      timeRange: [0, 1],
      frequencyRange: [0, 4000],
      colorscale: 'jet',
      displayRange: [-100, 0],
      fileName: 'fixture.wav',
    }));
    expect(downloadSpectrogramImage).toHaveBeenCalledWith(
      { fakeCanvas: true },
      'fixture-spectrogram.png',
    );
  });

  it('exposes the visible-segment re-render through the imperative handle', () => {
    const ref = createRef();
    renderWithTheme(
      <Spectrogram
        ref={ref}
        audioFile={file}
        timeRange={[0, 1]}
        frequencyRange={[0, 4000]}
        colorscale="jet"
        onProcessingChange={() => {}}
      />,
    );

    const handle = useSpectrogram.mock.results.at(-1).value;
    ref.current.rerenderVisibleSegment();
    expect(handle.rerenderVisible).toHaveBeenCalledTimes(1);
  });

  it('keeps the analysis time range stable while frequency zoom crops the matrix', () => {
    const { rerenderWithTheme } = renderWithTheme(
      <Spectrogram
        audioFile={file}
        timeRange={[0, 1]}
        frequencyRange={[0, 4000]}
        colorscale="jet"
        onProcessingChange={() => {}}
      />,
    );

    rerenderWithTheme(
      <Spectrogram
        audioFile={file}
        timeRange={[0, 1]}
        frequencyRange={[500, 2000]}
        colorscale="jet"
        onProcessingChange={() => {}}
      />,
    );

    expect(screen.getByRole('application', { name: /500 to 2000 hertz/ })).toBeTruthy();
    const lastHookProps = useSpectrogram.mock.calls.at(-1)[0];
    expect(lastHookProps.frequencyRange).toEqual([500, 2000]);
    expect(lastHookProps.timeRange).toEqual([0, 1]);
  });

  it('clamps the displayed ranges to the analysis extent', () => {
    renderWithTheme(
      <Spectrogram
        audioFile={file}
        timeRange={[-2, 4]}
        frequencyRange={[1000, 9000]}
        colorscale="jet"
        onProcessingChange={() => {}}
      />,
    );

    expect(screen.getByRole('application', { name: /showing 0 to 1 seconds and 1000 to 4000 hertz/ }))
      .toBeTruthy();
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
