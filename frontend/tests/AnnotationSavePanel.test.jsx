import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import AnnotationPanel from '../src/components/SoundAnalysisTools/annotation/AnnotationPanel';
import { makeWindow } from './helpers/annotationFixtures';
import { renderWithTheme } from './helpers/renderWithTheme';

const makeProps = (overrides = {}) => ({
  mode: 'editor',
  onModeChange: vi.fn(),
  source: 'None',
  pinnedWindow: makeWindow(0, { coqui: true }),
  pinnedWindowIndex: 0,
  windowCount: 2,
  onPinWindow: vi.fn(),
  onToggleSpecies: vi.fn(),
  readOnly: false,
  dirty: true,
  warnings: [],
  status: 'ready',
  error: null,
  canSave: true,
  onSave: vi.fn(),
  saving: false,
  saveError: null,
  saveMessage: null,
  saveDisabledReason: null,
  conflict: null,
  onReloadConflict: vi.fn(),
  onOverwriteConflict: vi.fn(),
  onCancelConflict: vi.fn(),
  onDismissSaveFeedback: vi.fn(),
  ...overrides,
});

describe('AnnotationPanel save controls', () => {
  it('disables saving and explains why when changes cannot be saved', () => {
    renderWithTheme(
      <AnnotationPanel
        {...makeProps({
          canSave: false,
          dirty: false,
          saveDisabledReason: 'No unsaved changes.',
        })}
      />,
    );

    const saveButton = screen.getByRole('button', { name: 'Save annotations' });
    expect(saveButton.disabled).toBe(true);
    expect(screen.getByText('No unsaved changes.')).toBeTruthy();
  });

  it('saves from the toolbar button', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    renderWithTheme(<AnnotationPanel {...props} />);

    await user.click(screen.getByRole('button', { name: 'Save annotations' }));

    expect(props.onSave).toHaveBeenCalledTimes(1);
  });

  it('saves with the keyboard only', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    renderWithTheme(<AnnotationPanel {...props} />);

    const saveButton = screen.getByRole('button', { name: 'Save annotations' });
    saveButton.focus();
    expect(document.activeElement).toBe(saveButton);

    await user.keyboard('{Enter}');

    expect(props.onSave).toHaveBeenCalledTimes(1);
  });

  it('shows the saving state on the action', () => {
    renderWithTheme(<AnnotationPanel {...makeProps({ saving: true })} />);

    expect(screen.getByRole('button', { name: 'Saving annotations' }).disabled).toBe(true);
  });

  it('shows save success and failure feedback', () => {
    const { rerenderWithTheme } = renderWithTheme(
      <AnnotationPanel {...makeProps({ saveMessage: 'Annotations saved.' })} />,
    );

    expect(screen.getByText('Annotations saved.')).toBeTruthy();

    rerenderWithTheme(
      <AnnotationPanel
        {...makeProps({ saveError: { message: 'The annotations could not be saved.' } })}
      />,
    );

    expect(screen.getByText('The annotations could not be saved.')).toBeTruthy();
  });

  it('offers reload, overwrite, and cancel when a conflict is detected', async () => {
    const user = userEvent.setup();
    const props = makeProps({ conflict: { latestReportId: 33 } });
    renderWithTheme(<AnnotationPanel {...props} />);

    expect(screen.getByText('Annotation save conflict')).toBeTruthy();
    expect(screen.getByText(/report 33/)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Reload latest' }));
    expect(props.onReloadConflict).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Overwrite' }));
    expect(props.onOverwriteConflict).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(props.onCancelConflict).toHaveBeenCalledTimes(1);
  });
});
