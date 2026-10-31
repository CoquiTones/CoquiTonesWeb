import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Spectrogram from '../src/components/SoundAnalysisTools/render/Spectrogram';
import SpectrogramPlot from '../src/components/SoundAnalysisTools/render/SpectrogramPlot';
import { useSpectrogram } from '../src/components/SoundAnalysisTools/processing/useSpectrogram';
import { makeAnalysis } from './helpers/spectrogramFixtures';
import { makeWindows } from './helpers/annotationFixtures';
import { renderWithTheme } from './helpers/renderWithTheme';

vi.mock('../src/components/SoundAnalysisTools/processing/useSpectrogram', () => ({
  useSpectrogram: vi.fn(),
}));

const audioFile = new File([new Uint8Array([1])], 'fixture.wav', { type: 'audio/wav' });

const renderPlot = (overrides = {}) => {
  const onPinWindow = vi.fn();
  const audioRef = { current: { currentTime: 4 } };
  const result = renderWithTheme(
    <SpectrogramPlot
      analysis={makeAnalysis({ duration: 10, timeRange: [0, 10] })}
      fileName="fixture.wav"
      timeRange={[0, 10]}
      frequencyRange={[0, 4000]}
      colorscale="jet"
      displayRange={[-100, 0]}
      status="ready"
      progress={null}
      error={null}
      onRetry={() => {}}
      annotationWindows={makeWindows(10)}
      pinnedWindowIndex={null}
      onPinWindow={onPinWindow}
      audioRef={audioRef}
      {...overrides}
    />,
  );
  return { ...result, onPinWindow, audioRef };
};

describe('Spectrogram annotation interaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a preview overlay while hovering a ten-second window', () => {
    renderPlot();
    const plot = screen.getByRole('application');

    fireEvent.pointerMove(plot, { clientX: 300, clientY: 180 });

    expect(screen.getByTestId('spectrogram-annotation-preview')).toBeTruthy();
  });

  it('pins the window under a pointer down without touching audio playback', () => {
    const { onPinWindow, rerenderWithTheme, audioRef } = renderPlot();
    const plot = screen.getByRole('application');

    fireEvent.pointerDown(plot, { clientX: 300, clientY: 180, pointerType: 'mouse' });
    expect(onPinWindow).toHaveBeenCalledWith(0);
    expect(audioRef.current.currentTime).toBe(4);

    rerenderWithTheme(
      <SpectrogramPlot
        analysis={makeAnalysis({ duration: 10, timeRange: [0, 10] })}
        fileName="fixture.wav"
        timeRange={[0, 10]}
        frequencyRange={[0, 4000]}
        colorscale="jet"
        displayRange={[-100, 0]}
        status="ready"
        progress={null}
        error={null}
        onRetry={() => {}}
        annotationWindows={makeWindows(10)}
        pinnedWindowIndex={0}
        onPinWindow={onPinWindow}
        audioRef={audioRef}
      />,
    );
    expect(screen.getByTestId('spectrogram-annotation-pinned')).toBeTruthy();
  });

  it('pins the focused window with Enter', () => {
    const { onPinWindow } = renderPlot();
    const plot = screen.getByRole('application');

    fireEvent.focus(plot);
    fireEvent.keyDown(plot, { key: 'Enter' });

    expect(onPinWindow).toHaveBeenCalledWith(0);
  });

  it('does not change the spectrogram analysis inputs when the pinned window changes', () => {
    useSpectrogram.mockReturnValue({
      status: 'ready',
      progress: null,
      error: null,
      analysis: makeAnalysis({ duration: 10, timeRange: [0, 10] }),
      rerenderVisible: vi.fn(),
      retry: vi.fn(),
    });

    const { rerenderWithTheme } = renderWithTheme(
      <Spectrogram
        audioFile={audioFile}
        timeRange={[0, 10]}
        frequencyRange={[0, 4000]}
        colorscale="jet"
        annotationWindows={makeWindows(10)}
        pinnedWindowIndex={0}
        onPinWindow={() => {}}
        onProcessingChange={() => {}}
      />,
    );

    rerenderWithTheme(
      <Spectrogram
        audioFile={audioFile}
        timeRange={[0, 10]}
        frequencyRange={[0, 4000]}
        colorscale="jet"
        annotationWindows={makeWindows(10)}
        pinnedWindowIndex={1}
        onPinWindow={() => {}}
        onProcessingChange={() => {}}
      />,
    );

    const lastProps = useSpectrogram.mock.calls.at(-1)[0];
    expect(lastProps).toEqual(expect.objectContaining({
      audioFile,
      timeRange: [0, 10],
      frequencyRange: [0, 4000],
    }));
    expect(lastProps).not.toHaveProperty('annotationWindows');
    expect(lastProps).not.toHaveProperty('pinnedWindowIndex');
  });
});
