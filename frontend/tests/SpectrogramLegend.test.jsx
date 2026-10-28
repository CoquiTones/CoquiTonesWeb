import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SpectrogramLegend from '../src/components/SoundAnalysisTools/render/SpectrogramLegend';
import { renderWithTheme } from './helpers/renderWithTheme';

describe('SpectrogramLegend', () => {
  it('renders a dBFS legend with endpoints and intermediate labels', () => {
    const { container } = renderWithTheme(
      <SpectrogramLegend colorscale="jet" displayRange={[-100, 0]} />,
    );
    expect(screen.getByText('Intensity')).toBeTruthy();
    expect(screen.getByLabelText('Intensity scale from -100 to 0 dBFS')).toBeTruthy();
    expect(screen.getByText('-100.0 dBFS')).toBeTruthy();
    expect(screen.getByText('0.0 dBFS')).toBeTruthy();
    expect(screen.getAllByText(/dBFS$/)).toHaveLength(5);
    expect(container.querySelector('[data-testid="spectrogram-legend-gradient"]')).toBeTruthy();
  });

  it('keeps the values when the colormap changes', () => {
    const { rerenderWithTheme } = renderWithTheme(
      <SpectrogramLegend colorscale="jet" displayRange={[-100, 0]} />,
    );
    expect(screen.getByText('-100.0 dBFS')).toBeTruthy();
    rerenderWithTheme(
      <SpectrogramLegend colorscale="hot" displayRange={[-100, 0]} />,
    );
    expect(screen.getByText('-100.0 dBFS')).toBeTruthy();
    expect(screen.getByText('0.0 dBFS')).toBeTruthy();
  });

  it('supports a horizontal orientation', () => {
    renderWithTheme(
      <SpectrogramLegend colorscale="jet" displayRange={[-100, 0]} orientation="horizontal" />,
    );
    expect(screen.getAllByText(/dBFS$/)).toHaveLength(5);
  });
});
