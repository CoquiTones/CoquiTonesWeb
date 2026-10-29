import { fireEvent, screen, waitFor } from '@testing-library/react';
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

  it('dismisses the readout when the plot loses focus', () => {
    renderPlot();
    const plot = screen.getByRole('application');
    fireEvent.focus(plot);
    expect(screen.getByRole('status')).toBeTruthy();
    fireEvent.blur(plot);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('renders a visible keyboard cursor and moves it by one row', async () => {
    renderPlot();
    const plot = screen.getByRole('application');
    fireEvent.focus(plot);

    expect(screen.getByTestId('spectrogram-keyboard-cursor')).toBeTruthy();
    expect(screen.getByTestId('spectrogram-announcement').textContent).toMatch(/1\.00 kHz/);

    await new Promise((resolve) => { setTimeout(resolve, 300); });
    fireEvent.keyDown(plot, { key: 'ArrowUp' });
    await waitFor(() => {
      expect(screen.getByTestId('spectrogram-announcement').textContent).toMatch(/2\.00 kHz/);
    });

    await new Promise((resolve) => { setTimeout(resolve, 300); });
    fireEvent.keyDown(plot, { key: 'ArrowDown' });
    await waitFor(() => {
      expect(screen.getByTestId('spectrogram-announcement').textContent).toMatch(/1\.00 kHz/);
    });

    fireEvent.keyDown(plot, { key: 'Escape' });
    expect(screen.queryByTestId('spectrogram-keyboard-cursor')).toBeNull();
  });

  it('keeps the keyboard readout inside the visible time window', () => {
    renderPlot({ timeRange: [0.9, 1] });
    fireEvent.focus(screen.getByRole('application'));
    expect(screen.getByTestId('spectrogram-announcement').textContent).toMatch(/Time 1\.00 s/);
  });
});
