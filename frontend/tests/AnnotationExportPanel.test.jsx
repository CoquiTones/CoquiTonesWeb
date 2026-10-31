import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import AnnotationPanel from '../src/components/SoundAnalysisTools/annotation/AnnotationPanel';
import { makeWindow } from './helpers/annotationFixtures';
import { renderWithTheme } from './helpers/renderWithTheme';

const makeProps = (overrides = {}) => ({
  mode: 'reported',
  onModeChange: vi.fn(),
  source: 'None',
  pinnedWindow: makeWindow(0),
  pinnedWindowIndex: 0,
  windowCount: 2,
  onPinWindow: vi.fn(),
  onToggleSpecies: vi.fn(),
  readOnly: true,
  dirty: false,
  warnings: [],
  status: 'ready',
  error: null,
  canExport: true,
  onExport: vi.fn(),
  exportDisabledReason: null,
  exporting: false,
  exportError: null,
  ...overrides,
});

describe('AnnotationPanel export controls', () => {
  it('disables export and explains why when no recording is loaded', () => {
    renderWithTheme(
      <AnnotationPanel
        {...makeProps({
          canExport: false,
          windowCount: 0,
          pinnedWindow: null,
          pinnedWindowIndex: null,
          exportDisabledReason: 'Load a recording to export annotations.',
        })}
      />,
    );

    expect(screen.getByRole('button', { name: 'Export annotations' }).disabled).toBe(true);
    expect(screen.getByText('Load a recording to export annotations.')).toBeTruthy();
  });

  it('exports the current annotations from the toolbar button', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    renderWithTheme(<AnnotationPanel {...props} />);

    await user.click(screen.getByRole('button', { name: 'Export annotations' }));

    expect(props.onExport).toHaveBeenCalledTimes(1);
  });

  it('exports with the keyboard only', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    renderWithTheme(<AnnotationPanel {...props} />);

    const exportButton = screen.getByRole('button', { name: 'Export annotations' });
    exportButton.focus();
    await user.keyboard('{Enter}');

    expect(props.onExport).toHaveBeenCalledTimes(1);
  });

  it('shows an export error without hiding the report', () => {
    renderWithTheme(
      <AnnotationPanel
        {...makeProps({
          exportError: { message: 'The annotations could not be exported.' },
        })}
      />,
    );

    expect(screen.getByText('The annotations could not be exported.')).toBeTruthy();
    expect(screen.getByText('Window 1 of 2')).toBeTruthy();
  });
});
