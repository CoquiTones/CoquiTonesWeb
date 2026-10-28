import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SpectrogramStatus from '../src/components/SoundAnalysisTools/render/SpectrogramStatus';
import SpectrogramPlot from '../src/components/SoundAnalysisTools/render/SpectrogramPlot';
import { makeAnalysis, makeAnalysisError } from './helpers/spectrogramFixtures';
import { renderWithTheme } from './helpers/renderWithTheme';

describe('SpectrogramStatus', () => {
  it('shows the empty state when idle', () => {
    renderWithTheme(<SpectrogramStatus status="idle" />);
    expect(screen.getByText('No recording loaded')).toBeTruthy();
  });

  it('shows decoding feedback and progress', () => {
    renderWithTheme(<SpectrogramStatus status="decoding" fileName="fixture.wav" />);
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.getByText(/Decoding/)).toBeTruthy();
    expect(screen.getByText('fixture.wav')).toBeTruthy();
  });

  it('shows determinate analysis progress', () => {
    renderWithTheme(<SpectrogramStatus status="analyzing" fileName="fixture.wav" progress={0.5} />);
    expect(screen.getByText('50%')).toBeTruthy();
  });

  it('shows an actionable error and retries', () => {
    const onRetry = vi.fn();
    renderWithTheme(
      <SpectrogramStatus
        status="failed"
        fileName="fixture.wav"
        error={makeAnalysisError('decode-failed', 'The recording could not be read.')}
        onRetry={onRetry}
      />,
    );
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('The recording could not be read.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when ready', () => {
    const { container } = renderWithTheme(<SpectrogramStatus status="ready" />);
    expect(container.innerHTML).toBe('');
  });
});

describe('SpectrogramPlot states', () => {
  it('shows inline progress while updating an existing analysis', () => {
    renderWithTheme(
      <SpectrogramPlot
        analysis={makeAnalysis()}
        fileName="fixture.wav"
        timeRange={[0, 1]}
        frequencyRange={[0, 4000]}
        colorscale="jet"
        displayRange={[-100, 0]}
        status="analyzing"
        progress={0.25}
      />,
    );
    expect(screen.getByRole('progressbar')).toBeTruthy();
  });

  it('keeps the previous plot during a range update', () => {
    const { container } = renderWithTheme(
      <SpectrogramPlot
        analysis={makeAnalysis()}
        fileName="fixture.wav"
        timeRange={[0, 1]}
        frequencyRange={[0, 4000]}
        colorscale="jet"
        displayRange={[-100, 0]}
        status="analyzing"
        progress={null}
      />,
    );
    expect(container.querySelector('canvas')).toBeTruthy();
    expect(screen.getByRole('progressbar')).toBeTruthy();
  });
});
