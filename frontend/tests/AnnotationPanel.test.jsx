import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AnnotationPanel from '../src/components/SoundAnalysisTools/annotation/AnnotationPanel';
import { makeWindow } from './helpers/annotationFixtures';
import { renderWithTheme } from './helpers/renderWithTheme';

const makeProps = (overrides = {}) => ({
  mode: 'readOnly',
  onModeChange: vi.fn(),
  source: 'None',
  pinnedWindow: makeWindow(1, { coqui: true }),
  pinnedWindowIndex: 1,
  windowCount: 3,
  onPinWindow: vi.fn(),
  onToggleSpecies: vi.fn(),
  dirty: false,
  warnings: [],
  status: 'ready',
  error: null,
  canExport: true,
  ...overrides,
});

describe('AnnotationPanel', () => {
  it('shows read-only values without editor controls', () => {
    const props = makeProps();
    renderWithTheme(<AnnotationPanel {...props} />);

    expect(screen.queryByText('Source: None')).toBeNull();
    expect(screen.getByText('Window 2 of 3')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Read Only' })).toBeTruthy();
    expect(screen.getByText('Present')).toBeTruthy();
    expect(screen.getAllByText('Absent').length).toBeGreaterThan(0);
    expect(screen.queryByRole('checkbox', { name: 'Coquí' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Save annotations' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Export annotations' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Editor' }));
    expect(props.onModeChange).toHaveBeenCalledWith('editor');
  });

  it('shows the empty source in Editor mode', () => {
    renderWithTheme(<AnnotationPanel {...makeProps({ mode: 'editor' })} />);

    expect(screen.getByText('Source: None')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save annotations' })).toBeTruthy();
  });

  it('allows species editing in Editor mode', () => {
    const props = makeProps({ mode: 'editor' });
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
