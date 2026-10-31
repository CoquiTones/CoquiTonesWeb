import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AnnotationPanel from '../src/components/SoundAnalysisTools/annotation/AnnotationPanel';
import { makeWindow } from './helpers/annotationFixtures';
import { renderWithTheme } from './helpers/renderWithTheme';

const makeProps = (overrides = {}) => ({
  mode: 'readOnly',
  onModeChange: vi.fn(),
  source: 'None',
  pinnedWindow: null,
  pinnedWindowIndex: null,
  windowCount: 0,
  onPinWindow: vi.fn(),
  onToggleSpecies: vi.fn(),
  dirty: false,
  warnings: [],
  status: 'ready',
  error: null,
  ...overrides,
});

describe('AnnotationPanel report states', () => {
  it('labels a manual report source', () => {
    renderWithTheme(
      <AnnotationPanel
        {...makeProps({
          source: 'Manual',
          pinnedWindow: makeWindow(0, { coqui: true }),
          pinnedWindowIndex: 0,
          windowCount: 3,
        })}
      />,
    );

    expect(screen.getByText('Source: Manual')).toBeTruthy();
    expect(screen.getByText('Read-only report')).toBeTruthy();
    expect(screen.getByText('Present')).toBeTruthy();
    expect(screen.queryByRole('checkbox', { name: 'Coquí' })).toBeNull();
  });

  it('labels a classifier fallback source', () => {
    renderWithTheme(
      <AnnotationPanel
        {...makeProps({
          source: 'Classifier',
          pinnedWindow: makeWindow(0),
          pinnedWindowIndex: 0,
          windowCount: 2,
        })}
      />,
    );

    expect(screen.getByText('Source: Classifier')).toBeTruthy();
  });

  it('shows a loading indicator while the report loads', () => {
    renderWithTheme(
      <AnnotationPanel
        {...makeProps({ status: 'loading', windowCount: 3 })}
      />,
    );

    expect(screen.getByLabelText('Loading annotation report')).toBeTruthy();
  });

  it('explains missing ten-second windows only in Editor mode', () => {
    const { rerenderWithTheme } = renderWithTheme(
      <AnnotationPanel {...makeProps({ mode: 'editor' })} />,
    );

    expect(
      screen.getByText('No ten-second windows are available for this recording.'),
    ).toBeTruthy();

    rerenderWithTheme(<AnnotationPanel {...makeProps()} />);

    expect(
      screen.queryByText('No ten-second windows are available for this recording.'),
    ).toBeNull();
  });

  it('shows the report error without hiding the window grid', () => {
    renderWithTheme(
      <AnnotationPanel
        {...makeProps({
          status: 'error',
          error: { message: 'The annotation report could not be loaded.' },
          pinnedWindow: makeWindow(0),
          pinnedWindowIndex: 0,
          windowCount: 3,
        })}
      />,
    );

    expect(screen.getByText('The annotation report could not be loaded.')).toBeTruthy();
    expect(screen.getByText('Window 1 of 3')).toBeTruthy();
    expect(screen.queryByText('Source: None')).toBeNull();
  });
});
