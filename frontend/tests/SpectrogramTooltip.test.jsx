import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SpectrogramTooltip from '../src/components/SoundAnalysisTools/render/SpectrogramTooltip';
import { renderWithTheme } from './helpers/renderWithTheme';

const plotRect = { left: 64, top: 16, width: 720, height: 340 };
const cell = { time: 2.04, frequency: 1000, dbfs: -18.4 };

describe('SpectrogramTooltip', () => {
  it('shows time, frequency, and intensity with units', () => {
    renderWithTheme(
      <SpectrogramTooltip cell={cell} pointer={{ x: 200, y: 100 }} plotRect={plotRect} />,
    );
    expect(screen.getByText('2.04 s')).toBeTruthy();
    expect(screen.getByText('1.00 kHz')).toBeTruthy();
    expect(screen.getByText('-18.4 dBFS')).toBeTruthy();
  });

  it('clamps the readout inside the plot near an edge', () => {
    renderWithTheme(
      <SpectrogramTooltip
        cell={cell}
        pointer={{ x: plotRect.left + plotRect.width - 2, y: plotRect.top + 2 }}
        plotRect={plotRect}
      />,
    );
    const tooltip = screen.getByRole('status');
    expect(Number.parseFloat(tooltip.style.left)).toBeLessThanOrEqual(plotRect.left + plotRect.width);
    expect(Number.parseFloat(tooltip.style.top)).toBeGreaterThanOrEqual(plotRect.top);
  });

  it('renders nothing without a cell', () => {
    renderWithTheme(<SpectrogramTooltip cell={null} pointer={null} plotRect={plotRect} />);
    expect(screen.queryByRole('status')).toBeNull();
  });
});
