import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useUnsavedChangesGuard } from '../src/components/SoundAnalysisTools/annotation/useUnsavedChangesGuard';

describe('useUnsavedChangesGuard', () => {
  it('runs an action immediately when no changes are pending', () => {
    const { result } = renderHook(() => useUnsavedChangesGuard({ when: false }));
    const action = vi.fn();

    let executed;
    act(() => {
      executed = result.current.requestLeave(action);
    });

    expect(executed).toBe(true);
    expect(action).toHaveBeenCalledTimes(1);
    expect(result.current.isPromptOpen).toBe(false);
  });

  it('opens a prompt and confirms the pending action', () => {
    const { result } = renderHook(() => useUnsavedChangesGuard({ when: true }));
    const action = vi.fn();

    act(() => {
      result.current.requestLeave(action);
    });
    expect(result.current.isPromptOpen).toBe(true);
    expect(action).not.toHaveBeenCalled();

    act(() => result.current.confirmLeave());

    expect(action).toHaveBeenCalledTimes(1);
    expect(result.current.isPromptOpen).toBe(false);
  });

  it('cancels the pending action', () => {
    const { result } = renderHook(() => useUnsavedChangesGuard({ when: true }));
    const action = vi.fn();

    act(() => {
      result.current.requestLeave(action);
      result.current.cancelLeave();
    });

    expect(action).not.toHaveBeenCalled();
    expect(result.current.isPromptOpen).toBe(false);
  });

  it('registers a beforeunload warning while changes are pending', () => {
    renderHook(() => useUnsavedChangesGuard({ when: true }));
    const event = new Event('beforeunload', { cancelable: true });

    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it('intercepts same-origin internal links while changes are pending', () => {
    const { result } = renderHook(() => useUnsavedChangesGuard({ when: true }));
    const anchor = document.createElement('a');
    anchor.href = '/another-page';
    document.body.appendChild(anchor);

    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    let allowed;
    act(() => {
      allowed = anchor.dispatchEvent(click);
    });

    expect(allowed).toBe(false);
    expect(click.defaultPrevented).toBe(true);
    expect(result.current.isPromptOpen).toBe(true);

    anchor.remove();
  });
});
