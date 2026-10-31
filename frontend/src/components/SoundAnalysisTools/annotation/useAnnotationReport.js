import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { hasSessionToken } from '../../../services/Authentication/sessionToken';
import { APIHandlerAnnotations } from '../../../services/rest/APIHandler/APIHandlerAnnotations';
import SaveAnnotationReportRequest from '../../../services/rest/RequestORM/Annotations/SaveAnnotationReportRequest';
import {
  applySpeciesToggle,
  buildWindows,
  createEmptyWindows,
  emptySpecies,
  mapReportSlices,
  reportSourceLabel,
  windowsEqual,
  windowsToSlices,
} from './annotationModel';

export const ANNOTATION_MODES = Object.freeze({
  readOnly: 'readOnly',
  editor: 'editor',
});

const cloneWindows = (windows) => windows.map((window) => ({ ...window }));

/**
 * Shared report state for the Spectral Analysis annotation workflow.
 *
 * Owns the authoritative read-only report, the editable draft, remote loading,
 * save/conflict handling, and the pinned ten-second window.
 */
export const useAnnotationReport = ({
  audioFile = null,
  durationSeconds = 0,
  recording = null,
} = {}) => {
  const duration = Number(durationSeconds);
  const windows = useMemo(() => buildWindows(duration), [duration]);
  const afid = recording?.afid ?? null;

  const [mode, setMode] = useState(ANNOTATION_MODES.readOnly);
  const [authoritativeWindows, setAuthoritativeWindows] = useState([]);
  const [draftWindows, setDraftWindows] = useState([]);
  const [pinnedWindowIndex, setPinnedWindowIndex] = useState(null);
  const [source, setSource] = useState('None');
  const [warnings, setWarnings] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [reportId, setReportId] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);
  const [conflict, setConflict] = useState(null);

  const reset = useCallback(() => {
    const empty = createEmptyWindows(duration);
    setAuthoritativeWindows(empty);
    setDraftWindows(empty);
    setMode(ANNOTATION_MODES.readOnly);
    setPinnedWindowIndex(null);
    setSource('None');
    setWarnings([]);
    setError(null);
    setReportId(null);
    setSavedAt(null);
    setSaving(false);
    setSaveError(null);
    setSaveMessage(null);
    setConflict(null);
    setStatus(!audioFile ? 'idle' : duration > 0 ? 'ready' : 'loading');
  }, [audioFile, duration]);

  useEffect(() => {
    reset();
  }, [reset]);

  const loadAuthoritativeReport = useCallback((report = {}) => {
    const nextWindows = Array.isArray(report.windows)
      ? report.windows.map((window) => ({ ...emptySpecies(), ...window }))
      : windows.map((window) => ({ ...emptySpecies(), ...window }));

    setAuthoritativeWindows(nextWindows);
    setDraftWindows(cloneWindows(nextWindows));
    setSource(report.source ?? 'None');
    setWarnings(Array.isArray(report.warnings) ? [...report.warnings] : []);
    setReportId(report.reportId ?? report.report_id ?? null);
    setSavedAt(report.savedAt ?? report.saved_at ?? null);
    setStatus(report.status ?? 'ready');
    setError(report.error ?? null);
    setPinnedWindowIndex(null);
  }, [windows]);

  const applyReport = useCallback((report) => {
    const mapped = mapReportSlices(report?.slices ?? [], windows);
    loadAuthoritativeReport({
      windows: mapped.windows,
      source: reportSourceLabel(report?.source),
      warnings: [
        ...(Array.isArray(report?.warnings) ? report.warnings : []),
        ...mapped.warnings,
      ],
      reportId: report?.report_id ?? null,
      savedAt: report?.saved_at ?? null,
      status: 'ready',
    });
  }, [loadAuthoritativeReport, windows]);

  const previousRecordingRef = useRef({ audioFile: null, afid: null });

  useEffect(() => {
    const previous = previousRecordingRef.current;
    const gainedAfid = (
      previous.audioFile === audioFile
      && previous.afid === null
      && afid !== null
    );
    previousRecordingRef.current = { audioFile, afid };

    // Saving a local recording to the database gives it an afid without
    // changing the audio, so the in-progress draft must be preserved instead
    // of being replaced by a fresh server report.
    if (gainedAfid) return undefined;

    if (!audioFile || !afid || duration <= 0 || !hasSessionToken()) {
      return undefined;
    }

    let cancelled = false;
    const empty = createEmptyWindows(duration);

    setMode(ANNOTATION_MODES.readOnly);
    setAuthoritativeWindows(empty);
    setDraftWindows(empty);
    setPinnedWindowIndex(null);
    setSource('None');
    setWarnings([]);
    setReportId(null);
    setSavedAt(null);
    setError(null);
    setSaving(false);
    setSaveError(null);
    setSaveMessage(null);
    setConflict(null);
    setStatus('loading');

    const load = async () => {
      try {
        const handler = new APIHandlerAnnotations();
        const report = await handler.getReport(afid);
        if (cancelled) return;
        applyReport(report);
      } catch (loadError) {
        if (cancelled) return;
        setStatus('error');
        setError(loadError);
        setSource('None');
        setWarnings([]);
        setReportId(null);
        setSavedAt(null);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [afid, applyReport, audioFile, duration]);

  const saveDraft = useCallback(async ({ overwrite = false } = {}) => {
    if (!afid || !hasSessionToken()) return false;

    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const handler = new APIHandlerAnnotations();
      const response = await handler.saveReport(
        new SaveAnnotationReportRequest({
          afid,
          baseReportId: overwrite
            ? (conflict?.latestReportId ?? reportId)
            : reportId,
          overwrite,
          slices: windowsToSlices(draftWindows),
        }),
      );

      setAuthoritativeWindows(cloneWindows(draftWindows));
      setReportId(response?.report_id ?? null);
      setSavedAt(response?.saved_at ?? null);
      setSource('Manual');
      setWarnings([]);
      setConflict(null);
      setStatus('ready');
      setError(null);
      setSaveMessage('Annotations saved.');
      return true;
    } catch (error) {
      if (error?.status === 409) {
        setConflict({
          latestReportId: error?.detail?.latest_report_id
            ?? error?.payload?.detail?.latest_report_id
            ?? null,
        });
      } else {
        setSaveError(error);
      }
      return false;
    } finally {
      setSaving(false);
    }
  }, [afid, conflict, draftWindows, reportId]);

  const save = useCallback(() => saveDraft(), [saveDraft]);

  const reloadConflict = useCallback(async () => {
    if (!afid) return false;

    setConflict(null);
    setSaveError(null);
    setStatus('loading');

    try {
      const handler = new APIHandlerAnnotations();
      const report = await handler.getReport(afid);
      applyReport(report);
      setSaveMessage('Loaded the latest saved report.');
      return true;
    } catch (reloadError) {
      setStatus('error');
      setError(reloadError);
      return false;
    }
  }, [afid, applyReport]);

  const overwriteConflict = useCallback(
    () => saveDraft({ overwrite: true }),
    [saveDraft],
  );

  const cancelConflict = useCallback(() => setConflict(null), []);

  const dismissSaveFeedback = useCallback(() => {
    setSaveError(null);
    setSaveMessage(null);
  }, []);

  const activeWindows = mode === ANNOTATION_MODES.editor
    ? draftWindows
    : authoritativeWindows;

  const dirty = useMemo(
    () => !windowsEqual(draftWindows, authoritativeWindows),
    [authoritativeWindows, draftWindows],
  );

  const canSave = Boolean(
    audioFile
    && afid
    && hasSessionToken()
    && dirty
    && !saving,
  );

  const pinnedWindow = pinnedWindowIndex === null
    ? null
    : activeWindows[pinnedWindowIndex] ?? null;

  useEffect(() => {
    if (pinnedWindowIndex !== null && pinnedWindowIndex >= activeWindows.length) {
      setPinnedWindowIndex(null);
    }
  }, [activeWindows.length, pinnedWindowIndex]);

  const enterEditor = useCallback(() => {
    setDraftWindows(cloneWindows(authoritativeWindows));
    setMode(ANNOTATION_MODES.editor);
  }, [authoritativeWindows]);

  const showReadOnly = useCallback(() => {
    setMode(ANNOTATION_MODES.readOnly);
  }, []);

  const discardDraft = useCallback(() => {
    setDraftWindows(cloneWindows(authoritativeWindows));
    setMode(ANNOTATION_MODES.readOnly);
  }, [authoritativeWindows]);

  const pinWindow = useCallback((index) => {
    if (index === null || index === undefined) {
      setPinnedWindowIndex(null);
      return;
    }
    if (!Number.isInteger(index) || index < 0 || index >= activeWindows.length) {
      return;
    }
    setPinnedWindowIndex(index);
  }, [activeWindows.length]);

  const toggleSpecies = useCallback((index, speciesKey, value) => {
    if (mode !== ANNOTATION_MODES.editor) return;
    setDraftWindows((current) => applySpeciesToggle(current, index, speciesKey, value));
  }, [mode]);

  return {
    mode,
    isReadOnly: mode === ANNOTATION_MODES.readOnly,
    isEditor: mode === ANNOTATION_MODES.editor,
    windows: activeWindows,
    readOnlyWindows: authoritativeWindows,
    draftWindows,
    windowCount: activeWindows.length,
    pinnedWindowIndex,
    pinnedWindow,
    source,
    warnings,
    status,
    error,
    reportId,
    savedAt,
    dirty,
    saving,
    saveError,
    saveMessage,
    conflict,
    canSave,
    save,
    overwriteConflict,
    reloadConflict,
    cancelConflict,
    dismissSaveFeedback,
    canEdit: mode === ANNOTATION_MODES.editor && activeWindows.length > 0,
    enterEditor,
    showReadOnly,
    discardDraft,
    setMode,
    pinWindow,
    toggleSpecies,
    loadAuthoritativeReport,
  };
};

export default useAnnotationReport;
