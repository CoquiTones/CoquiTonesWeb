import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAnnotationReport } from '../src/components/SoundAnalysisTools/annotation/useAnnotationReport';
import { BackendError } from '../src/services/rest/APIHandler/Errors';
import { makeReport, makeSlice } from './helpers/annotationFixtures';

const { getReport, saveReport } = vi.hoisted(() => ({
  getReport: vi.fn(),
  saveReport: vi.fn(),
}));

vi.mock('../src/services/rest/APIHandler/APIHandlerAnnotations', () => ({
  APIHandlerAnnotations: vi.fn(function MockAnnotationsHandler() {
    return { getReport, saveReport };
  }),
  default: vi.fn(function MockAnnotationsHandler() {
    return { getReport, saveReport };
  }),
}));

vi.mock('../src/services/Authentication/sessionToken', () => ({
  hasSessionToken: vi.fn(() => true),
  getSessionToken: vi.fn(() => 'session-token'),
}));

const makeFile = (name = 'fixture.wav') => (
  new File([new Uint8Array([1])], name, { type: 'audio/wav' })
);

const renderSaveHook = () => {
  const file = makeFile();
  return renderHook(() => useAnnotationReport({
    audioFile: file,
    durationSeconds: 20,
    recording: { afid: 42, nid: 1 },
  }));
};

const waitForLoaded = async (result) => {
  await waitFor(() => expect(result.current.status).toBe('ready'));
};

const enterEditorAndEdit = (result) => {
  act(() => result.current.enterEditor());
  act(() => result.current.toggleSpecies(0, 'coqui', true));
};

describe('useAnnotationReport save workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getReport.mockResolvedValue(makeReport({
      afid: 42,
      source: 'None',
      slices: [makeSlice(0), makeSlice(1)],
    }));
  });

  it('saves the complete draft and clears the unsaved indicator', async () => {
    saveReport.mockResolvedValue({
      report_id: 21,
      saved_at: '2026-10-31T13:00:00Z',
      source: 'Manual',
    });

    const { result } = renderSaveHook();
    await waitForLoaded(result);
    enterEditorAndEdit(result);

    expect(result.current.canSave).toBe(true);
    await act(async () => {
      await result.current.save();
    });

    const request = saveReport.mock.calls[0][0].toJSON();
    expect(request.afid).toBe(42);
    expect(request.base_report_id).toBeNull();
    expect(request.overwrite).toBe(false);
    expect(request.slices).toHaveLength(2);
    expect(request.slices[0].coqui).toBe(true);

    expect(result.current.dirty).toBe(false);
    expect(result.current.source).toBe('Manual');
    expect(result.current.reportId).toBe(21);
    expect(result.current.savedAt).toBe('2026-10-31T13:00:00Z');
    expect(result.current.saveMessage).toBeTruthy();
  });

  it('keeps the draft and exposes a conflict with the latest report id', async () => {
    saveReport.mockRejectedValue(new BackendError('Conflict', {
      status: 409,
      detail: {
        message: 'A newer manual report exists for this recording.',
        latest_report_id: 33,
      },
    }));

    const { result } = renderSaveHook();
    await waitForLoaded(result);
    enterEditorAndEdit(result);

    await act(async () => {
      await result.current.save();
    });

    expect(result.current.conflict?.latestReportId).toBe(33);
    expect(result.current.dirty).toBe(true);
    expect(result.current.windows[0].coqui).toBe(true);
  });

  it('retries with explicit overwrite after the user confirms', async () => {
    saveReport
      .mockRejectedValueOnce(new BackendError('Conflict', {
        status: 409,
        detail: { message: 'Conflict', latest_report_id: 33 },
      }))
      .mockResolvedValueOnce({
        report_id: 34,
        saved_at: '2026-10-31T13:05:00Z',
        source: 'Manual',
      });

    const { result } = renderSaveHook();
    await waitForLoaded(result);
    enterEditorAndEdit(result);

    await act(async () => {
      await result.current.save();
    });
    await act(async () => {
      await result.current.overwriteConflict();
    });

    const request = saveReport.mock.calls[1][0].toJSON();
    expect(request.overwrite).toBe(true);
    expect(request.base_report_id).toBe(33);
    expect(result.current.conflict).toBeNull();
    expect(result.current.reportId).toBe(34);
    expect(result.current.dirty).toBe(false);
  });

  it('reloads the latest report after a conflict and discards the draft', async () => {
    saveReport.mockRejectedValue(new BackendError('Conflict', {
      status: 409,
      detail: { message: 'Conflict', latest_report_id: 33 },
    }));
    getReport
      .mockResolvedValueOnce(makeReport({
        afid: 42,
        source: 'None',
        slices: [makeSlice(0), makeSlice(1)],
      }))
      .mockResolvedValueOnce(makeReport({
        afid: 42,
        source: 'Manual',
        report_id: 33,
        slices: [makeSlice(0), makeSlice(1, { gryllus: true })],
      }));

    const { result } = renderSaveHook();
    await waitForLoaded(result);
    enterEditorAndEdit(result);

    await act(async () => {
      await result.current.save();
    });
    await act(async () => {
      await result.current.reloadConflict();
    });

    expect(result.current.conflict).toBeNull();
    expect(result.current.source).toBe('Manual');
    expect(result.current.reportId).toBe(33);
    expect(result.current.windows[1].gryllus).toBe(true);
    expect(result.current.dirty).toBe(false);
  });

  it('retains the draft and reports an error when saving fails', async () => {
    saveReport.mockRejectedValue(new Error('Network unavailable'));

    const { result } = renderSaveHook();
    await waitForLoaded(result);
    enterEditorAndEdit(result);

    await act(async () => {
      await result.current.save();
    });

    expect(result.current.saveError?.message).toBe('Network unavailable');
    expect(result.current.dirty).toBe(true);
    expect(result.current.windows[0].coqui).toBe(true);
    expect(result.current.reportId).toBeNull();
  });
});
