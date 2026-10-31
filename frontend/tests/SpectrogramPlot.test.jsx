import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SpectrogramPlot from '../src/components/SoundAnalysisTools/render/SpectrogramPlot';
import {
  createPlotRect,
  frequencyToY,
  timeToX,
} from '../src/components/SoundAnalysisTools/processing/spectrogramTransforms';
import { formatDbfs, formatFrequency, formatTime } from '../src/components/SoundAnalysisTools/processing/spectrogramFormat';
import { makeAnalysis } from './helpers/spectrogramFixtures';
import { renderWithTheme } from './helpers/renderWithTheme';

const renderPlot = (props = {}) =>
  renderWithTheme(
    <SpectrogramPlot
      analysis={makeAnalysis()}
      fileName="fixture.wav"
      timeRange={[0, 1]}
      frequencyRange={[0, 4000]}
      colorscale="jet"
      displayRange={[-100, 0]}
      status="ready"
      progress={null}
      error={null}
      onRetry={() => {}}
      {...props}
    />,
  );

describe('SpectrogramPlot', () => {
  it('renders the canvas, axes, and accessible plot label', () => {
    const { container } = renderPlot();
    expect(screen.getByRole('application', { name: /Spectrogram of fixture.wav/ })).toBeTruthy();
    expect(container.querySelector('canvas')).toBeTruthy();
    expect(screen.getByText('Time (s)')).toBeTruthy();
    expect(screen.getByText('Frequency (Hz)')).toBeTruthy();
  });

  it('updates axis labels when the visible ranges change', () => {
    const { rerenderWithTheme } = renderPlot();
    rerenderWithTheme(
      <SpectrogramPlot
        analysis={makeAnalysis()}
        fileName="fixture.wav"
        timeRange={[0.5, 1]}
        frequencyRange={[0, 2000]}
        colorscale="jet"
        displayRange={[-100, 0]}
        status="ready"
        progress={null}
        error={null}
        onRetry={() => {}}
      />,
    );
    expect(screen.getByText('0.5')).toBeTruthy();
    expect(screen.getByText('2.0k')).toBeTruthy();
  });

  it('shows the empty state when no recording is loaded', () => {
    renderPlot({ analysis: null, fileName: '', status: 'idle' });
    expect(screen.getByText('No recording loaded')).toBeTruthy();
  });

  it('shows a hover readout for a pointer position', () => {
    const { container } = renderPlot();
    const plot = screen.getByRole('application');
    fireEvent.pointerMove(plot, { clientX: 300, clientY: 180 });
    expect(container.querySelector('[role="status"]')).toBeTruthy();
  });

  it('shows non-blocking silent and constant notices without replacing the plot', () => {
    const { container, rerenderWithTheme } = renderPlot({
      analysis: makeAnalysis({ signalNotice: 'silent' }),
    });

    expect(screen.getByTestId('spectrogram-signal-notice').textContent).toMatch(/-100 dBFS floor/);
    expect(container.querySelector('canvas')).toBeTruthy();

    rerenderWithTheme(
      <SpectrogramPlot
        analysis={makeAnalysis({ signalNotice: 'constant' })}
        fileName="fixture.wav"
        timeRange={[0, 1]}
        frequencyRange={[0, 4000]}
        colorscale="jet"
        displayRange={[-100, 0]}
        status="ready"
        progress={null}
        error={null}
        onRetry={() => {}}
      />,
    );
    expect(screen.getByTestId('spectrogram-signal-notice').textContent).toMatch(/constant/i);
    expect(container.querySelector('canvas')).toBeTruthy();
  });

  it('shows a quiet refinement indicator while keeping the ready plot', () => {
    renderPlot({ refining: true, refineProgress: 0.5 });
    expect(screen.getByRole('progressbar')).toBeTruthy();
    expect(screen.getByRole('application')).toBeTruthy();
  });

  it('renders the audio playhead when an audio element ref is supplied', () => {
    renderPlot({ audioRef: { current: { currentTime: 0.5 } } });
    expect(screen.getByTestId('spectrogram-playhead')).toBeTruthy();
  });

  it('pins a touch readout and dismisses it on an outside tap', () => {
    renderPlot();
    const plot = screen.getByRole('application');
    fireEvent.pointerDown(plot, { clientX: 300, clientY: 180, pointerType: 'touch' });
    expect(screen.getByRole('status')).toBeTruthy();

    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('maps all 100 sampled cells to the readout within one row, one frame, and 1 dB', () => {
    const frameCount = 10;
    const binCount = 10;
    const times = Float32Array.from({ length: frameCount }, (_, index) => index / (frameCount - 1));
    const frequencies = Float32Array.from(
      { length: binCount },
      (_, index) => (index * 4000) / (binCount - 1),
    );
    const db = Float32Array.from(
      { length: frameCount * binCount },
      (_, index) => -100 + index,
    );
    const analysis = makeAnalysis({
      frameCount,
      binCount,
      times,
      frequencies,
      db,
      timeResolution: 1 / (frameCount - 1),
      frequencyResolution: 4000 / (binCount - 1),
      maxDb: -1,
    });

    renderPlot({ analysis });
    const plot = screen.getByRole('application');
    const plotRect = createPlotRect({ width: 800, height: 400 });

    for (let frame = 0; frame < frameCount; frame += 1) {
      for (let bin = 0; bin < binCount; bin += 1) {
        const x = timeToX(times[frame], [0, 1], plotRect);
        const y = frequencyToY(frequencies[bin], [0, 4000], plotRect);
        fireEvent.pointerMove(plot, { clientX: x, clientY: y });
        const text = screen.getByRole('status').textContent;
        expect(text).toContain(formatTime(times[frame]));
        expect(text).toContain(formatFrequency(frequencies[bin]));
        expect(text).toContain(formatDbfs(db[frame * binCount + bin]));
      }
    }
  }, 15000);
});
