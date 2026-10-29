import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ClassificationWaveformTooltip from '../src/components/classifier/ClassificationWaveformTooltip';
import { SPECIES } from '../src/components/classifier/species';
import { renderWithTheme } from './helpers/renderWithTheme';

const plotRect = { width: 720, height: 168 };
const species = [SPECIES[0], SPECIES[3]];

const segmentReadout = (overrides = {}) => ({
  kind: 'segment',
  segment: { start: 0, end: 10, species, ...overrides.segment },
  pointer: { x: 120, y: 84 },
  keyboardMode: false,
  ...overrides,
});

describe('ClassificationWaveformTooltip', () => {
  it('lists the time range and every detected species', () => {
    renderWithTheme(
      <ClassificationWaveformTooltip plotRect={plotRect} readout={segmentReadout()} />,
    );

    expect(screen.getByRole('tooltip')).toBeTruthy();
    expect(screen.getByText('0s – 10s')).toBeTruthy();
    expect(screen.getByText('Species detected')).toBeTruthy();
    expect(screen.getByText('Coquí')).toBeTruthy();
    expect(screen.getByText('Portoricensis')).toBeTruthy();
  });

  it('shows an empty state when nothing was detected', () => {
    renderWithTheme(
      <ClassificationWaveformTooltip
        plotRect={plotRect}
        readout={segmentReadout({ segment: { start: 10, end: 20, species: [] } })}
      />,
    );

    expect(screen.getByText('10s – 20s')).toBeTruthy();
    expect(screen.getByText('No species detected')).toBeTruthy();
  });

  it('explains the unclassified tail of the recording', () => {
    renderWithTheme(
      <ClassificationWaveformTooltip
        plotRect={plotRect}
        readout={{
          kind: 'unclassified',
          start: 60,
          end: 64.5,
          pointer: { x: 600, y: 84 },
          keyboardMode: false,
        }}
      />,
    );

    expect(screen.getByText('Unclassified audio')).toBeTruthy();
    expect(screen.getByText('60s – 64.5s')).toBeTruthy();
    expect(
      screen.getByText(/only analyses complete 10-second windows/i),
    ).toBeTruthy();
  });

  it('stays inside the plot near the right edge', () => {
    renderWithTheme(
      <ClassificationWaveformTooltip
        plotRect={plotRect}
        readout={segmentReadout({ pointer: { x: plotRect.width - 2, y: 2 } })}
      />,
    );

    const tooltip = screen.getByRole('tooltip');
    const left = Number.parseFloat(tooltip.style.left);
    const top = Number.parseFloat(tooltip.style.top);
    expect(left).toBeLessThanOrEqual(plotRect.width);
    expect(top).toBeGreaterThanOrEqual(0);
  });

  it('renders nothing without a readout', () => {
    renderWithTheme(<ClassificationWaveformTooltip plotRect={plotRect} readout={null} />);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
