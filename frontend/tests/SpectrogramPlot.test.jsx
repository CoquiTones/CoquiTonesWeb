import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SpectrogramPlot from '../src/components/SoundAnalysisTools/render/SpectrogramPlot';
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
});
