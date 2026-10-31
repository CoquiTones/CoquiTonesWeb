import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AnnotationPanel from '../src/components/SoundAnalysisTools/annotation/AnnotationPanel';
import { makeWindow } from './helpers/annotationFixtures';
import { renderWithTheme } from './helpers/renderWithTheme';

const makeProps = (overrides = {}) => ({
  mode: 'reported',
  onModeChange: vi.fn(),
  source: 'None',
  pinnedWindow: makeWindow(1, { coqui: true }),
  pinnedWindowIndex: 1,
  windowCount: 3,
  onPinWindow: vi.fn(),
  onToggleSpecies: vi.fn(),
  readOnly: true,
  dirty: false,
  warnings: [],
  status: 'ready',
  error: null,
  ...overrides,
});

describe('AnnotationPanel', () => {
  it('shows the reported source and disables species editing', () => {
    const props = makeProps();
    renderWithTheme(<AnnotationPanel {...props} />);

    expect(screen.getByText('Source: None')).toBeTruthy();
    expect(screen.getByText('Window 2 of 3')).toBeTruthy();
    const coqui = screen.getByRole('checkbox', { name: 'Coquí' });
    expect(coqui.checked).toBe(true);
    expect(coqui.disabled).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Editor' }));
    expect(props.onModeChange).toHaveBeenCalledWith('editor');
  });

  it('allows species editing in Editor mode', () => {
    const props = makeProps({ mode: 'editor', readOnly: false });
    renderWithTheme(<AnnotationPanel {...props} />);

    const wightmanae = screen.getByRole('checkbox', { name: 'Wightmanae' });
    expect(wightmanae.disabled).toBe(false);
    fireEvent.click(wightmanae);

    expect(props.onToggleSpecies).toHaveBeenCalledWith(1, 'wightmanae', true);
  });

  it('moves between windows', () => {
    const props = makeProps();
    renderWithTheme(<AnnotationPanel {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Next ten-second window' }));
    expect(props.onPinWindow).toHaveBeenCalledWith(2);
  });

  it('shows unsaved changes and warnings', () => {
    renderWithTheme(
      <AnnotationPanel
        {...makeProps({ dirty: true, warnings: ['One window is not aligned.'] })}
      />,
    );

    expect(screen.getByText('Unsaved changes')).toBeTruthy();
    expect(screen.getByText('One window is not aligned.')).toBeTruthy();
  });
});
