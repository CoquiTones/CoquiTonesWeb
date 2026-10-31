import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAnnotationReport } from '../src/components/SoundAnalysisTools/annotation/useAnnotationReport';
import { hasSessionToken } from '../src/services/Authentication/sessionToken';
import { makeReport, makeSlice } from './helpers/annotationFixtures';

const { getReport } = vi.hoisted(() => ({
  getReport: vi.fn(),
}));

vi.mock('../src/services/rest/APIHandler/APIHandlerAnnotations', () => ({
  APIHandlerAnnotations: vi.fn(function MockAnnotationsHandler() {
    return { getReport };
  }),
  default: vi.fn(function MockAnnotationsHandler() {
    return { getReport };
  }),
}));

vi.mock('../src/services/Authentication/sessionToken', () => ({
  hasSessionToken: vi.fn(() => true),
  getSessionToken: vi.fn(() => 'session-token'),
}));

const makeFile = (name = 'fixture.wav') => (
  new File([new Uint8Array([1])], name, { type: 'audio/wav' })
);

const renderRemoteHook = (recording = { afid: 42, nid: 1 }) => {
  const file = makeFile();
  return renderHook(
    () => useAnnotationReport({
      audioFile: file,
      durationSeconds: 25,
      recording,
    }),
  );
};

describe('useAnnotationReport remote loading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasSessionToken.mockReturnValue(true);
  });

  it('loads the authoritative manual report and maps slices onto the grid', async () => {
    getReport.mockResolvedValue(makeReport({
      afid: 42,
      source: 'Manual',
      report_id: 9,
      saved_at: '2026-10-31T12:00:00Z',
      slices: [
        makeSlice(0, { coqui: true }),
        makeSlice(1, { gryllus: true }),
        makeSlice(2, { end_time: 25 }),
      ],
    }));

    const { result } = renderRemoteHook();

    await waitFor(() => expect(result.current.status).toBe('ready'));

    expect(getReport).toHaveBeenCalledWith(42);
    expect(result.current.source).toBe('Manual');
    expect(result.current.reportId).toBe(9);
    expect(result.current.savedAt).toBe('2026-10-31T12:00:00Z');
    expect(result.current.windows).toHaveLength(3);
    expect(result.current.windows[0]).toMatchObject({ coqui: true, gryllus: false });
    expect(result.current.windows[1]).toMatchObject({ gryllus: true });
    expect(result.current.windows[2]).toMatchObject({ start: 20, end: 25 });
    expect(result.current.dirty).toBe(false);
  });

  it('falls back to classifier values with compatibility warnings', async () => {
    getReport.mockResolvedValue(makeReport({
      afid: 42,
      source: 'Classifier',
      warnings: ['Skipped classifier slice 1 because it does not align.'],
      slices: [makeSlice(0, { wightmanae: true })],
    }));

    const { result } = renderRemoteHook();

    await waitFor(() => expect(result.current.status).toBe('ready'));

    expect(result.current.source).toBe('Classifier');
    expect(result.current.reportId).toBeNull();
    expect(result.current.windows[0].wightmanae).toBe(true);
    expect(result.current.warnings).toContain(
      'Skipped classifier slice 1 because it does not align.',
    );
  });

  it('does not call the API without an authenticated session', async () => {
    hasSessionToken.mockReturnValue(false);

    const { result } = renderRemoteHook();

    await waitFor(() => expect(result.current.status).toBe('ready'));

    expect(getReport).not.toHaveBeenCalled();
    expect(result.current.source).toBe('None');
    expect(result.current.windows.every((window) => window.coqui === false)).toBe(true);
  });

  it('exposes an error state when the report request fails', async () => {
    getReport.mockRejectedValue(new Error('Annotation report unavailable'));

    const { result } = renderRemoteHook();

    await waitFor(() => expect(result.current.status).toBe('error'));

    expect(result.current.error?.message).toBe('Annotation report unavailable');
    expect(result.current.source).toBe('None');
    expect(result.current.windows).toHaveLength(3);
  });

  it('does not fetch when the recording has no database identifier', async () => {
    const { result } = renderRemoteHook(null);

    await waitFor(() => expect(result.current.status).toBe('ready'));

    expect(getReport).not.toHaveBeenCalled();
    expect(result.current.source).toBe('None');
  });
});
