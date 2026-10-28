import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SpectrogramPlot from '../src/components/SoundAnalysisTools/render/SpectrogramPlot';
import { makeAnalysis } from './helpers/spectrogramFixtures';
import { renderWithTheme } from './helpers/renderWithTheme';

const renderPlot = () =>
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
    />,
  );

describe('Spectrogram keyboard readout', () => {
  it('focuses the plot and moves the readout by one cell', () => {
    renderPlot();
    const plot = screen.getByRole('application');
    fireEvent.focus(plot);

    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.getByTestId('spectrogram-announcement').textContent).toMatch(/Time 0\.50 s/);

    fireEvent.keyDown(plot, { key: 'ArrowRight' });
    expect(screen.getByText('1.00 s')).toBeTruthy();

    fireEvent.keyDown(plot, { key: 'Home' });
    expect(screen.getByText('0.00 s')).toBeTruthy();

    fireEvent.keyDown(plot, { key: 'End' });
    expect(screen.getByText('1.00 s')).toBeTruthy();
  });

  it('dismisses the readout with Escape', () => {
    renderPlot();
    const plot = screen.getByRole('application');
    fireEvent.focus(plot);
    expect(screen.getByRole('status')).toBeTruthy();
    fireEvent.keyDown(plot, { key: 'Escape' });
    expect(screen.queryByRole('status')).toBeNull();
  });
});
