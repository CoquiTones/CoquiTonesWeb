import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useAnnotationReport } from '../src/components/SoundAnalysisTools/annotation/useAnnotationReport';

const makeFile = (name = 'fixture.wav') => (
  new File([new Uint8Array([1])], name, { type: 'audio/wav' })
);

describe('useAnnotationReport local state', () => {
  it('builds the window grid and starts clean in Read Only mode', () => {
    const file = makeFile();
    const { result } = renderHook(() => useAnnotationReport({
      audioFile: file,
      durationSeconds: 25,
    }));

    expect(result.current.windows).toHaveLength(3);
    expect(result.current.windows[2]).toMatchObject({ start: 20, end: 25 });
    expect(result.current.isReadOnly).toBe(true);
    expect(result.current.source).toBe('None');
    expect(result.current.dirty).toBe(false);
  });

  it('pins a window, enters Editor, and tracks only the edited species', () => {
    const file = makeFile();
    const { result } = renderHook(() => useAnnotationReport({
      audioFile: file,
      durationSeconds: 30,
    }));

    act(() => result.current.pinWindow(1));
    act(() => result.current.enterEditor());
    act(() => result.current.toggleSpecies(1, 'coqui', true));

    expect(result.current.pinnedWindowIndex).toBe(1);
    expect(result.current.windows[1].coqui).toBe(true);
    expect(result.current.windows[0].coqui).toBe(false);
    expect(result.current.windows[2].coqui).toBe(false);
    expect(result.current.dirty).toBe(true);
  });

  it('resets the draft when the recording changes', () => {
    const { result, rerender } = renderHook(
      ({ file }) => useAnnotationReport({ audioFile: file, durationSeconds: 20 }),
      { initialProps: { file: makeFile('first.wav') } },
    );

    act(() => result.current.enterEditor());
    act(() => result.current.toggleSpecies(0, 'gryllus', true));
    expect(result.current.dirty).toBe(true);

    rerender({ file: makeFile('second.wav') });

    expect(result.current.dirty).toBe(false);
    expect(result.current.windows.every((window) => window.gryllus === false)).toBe(true);
  });
});
