import { reportSourceLabel, windowsToSlices } from './annotationModel';

export const EXPORT_SCHEMA_VERSION = 1;
export const EXPORT_WINDOW_SECONDS = 10;

const MAX_BASE_LENGTH = 90;

const pad = (value) => String(value).padStart(2, '0');

/**
 * Turn a recording name into a filesystem-safe base name.
 *
 * Directory components are removed, unsafe characters become dashes, and an
 * empty result falls back to "recording".
 */
export const sanitizeRecordingName = (name = '') => {
  const withoutExtension = String(name)
    .split(/[\\/]/)
    .pop()
    .replace(/\.[^.]+$/, '');
  const cleaned = withoutExtension
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, MAX_BASE_LENGTH)
    .replace(/^[-.]+|[-.]+$/g, '');

  return cleaned || 'recording';
};

export const exportTimestamp = (date = new Date()) => {
  const value = date instanceof Date ? date : new Date(date);
  return [
    value.getUTCFullYear(),
    pad(value.getUTCMonth() + 1),
    pad(value.getUTCDate()),
    '-',
    pad(value.getUTCHours()),
    pad(value.getUTCMinutes()),
    pad(value.getUTCSeconds()),
  ].join('');
};

export const exportFileName = (recordingName, date = new Date()) => (
  `${sanitizeRecordingName(recordingName)}-annotations-${exportTimestamp(date)}.json`
);

/**
 * Build the versioned JSON export of the current on-screen annotations.
 *
 * Raises when no recording or duration is available so callers never download
 * an empty or misleading file.
 */
export const buildAnnotationExport = ({
  audioFile = null,
  durationSeconds = 0,
  afid = null,
  source = 'None',
  isDraft = false,
  windows = [],
  exportedAt = new Date(),
} = {}) => {
  const duration = Number(durationSeconds);

  if (!audioFile) {
    throw new Error('Load a recording before exporting annotations.');
  }
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error('The recording duration is required to export annotations.');
  }

  return {
    schema_version: EXPORT_SCHEMA_VERSION,
    audio: {
      name: String(audioFile.name || 'recording'),
      duration_seconds: duration,
      afid: afid === null || afid === undefined ? null : Number(afid),
    },
    window_seconds: EXPORT_WINDOW_SECONDS,
    source: reportSourceLabel(source),
    is_draft: Boolean(isDraft),
    exported_at: new Date(exportedAt).toISOString(),
    slices: windowsToSlices(windows),
  };
};

/**
 * Trigger a JSON file download for an annotation export payload.
 */
export const downloadAnnotationExport = (
  payload,
  fileName,
  {
    documentRef = typeof document === 'undefined' ? null : document,
    urlRef = typeof URL === 'undefined' ? null : URL,
  } = {},
) => {
  if (!documentRef || !urlRef) {
    throw new Error('Downloads are not available in this environment.');
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const objectUrl = urlRef.createObjectURL(blob);
  const anchor = documentRef.createElement('a');

  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.style.display = 'none';
  documentRef.body.appendChild(anchor);
  anchor.click();
  documentRef.body.removeChild(anchor);
  urlRef.revokeObjectURL(objectUrl);

  return objectUrl;
};
