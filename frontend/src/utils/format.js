const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

// The API historically returned naive ISO timestamps (no `Z`/offset) that are
// stored as UTC. Appending `Z` avoids the browser interpreting them as local
// time, which used to shift readings by the timezone offset.
const NAIVE_ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;

export const parseApiDate = (value) => {
  if (value instanceof Date) return value;
  if (typeof value === 'string' && NAIVE_ISO_PATTERN.test(value)) {
    return new Date(`${value}Z`);
  }
  return new Date(value);
};

/**
 * Converts an epoch-ms timestamp into a short relative label ("3 hours ago").
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'Unknown';

  const deltaSeconds = Math.round((timestamp - Date.now()) / 1000);
  const thresholds = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
  ];

  for (const [unit, seconds] of thresholds) {
    if (Math.abs(deltaSeconds) >= seconds) {
      return rtf.format(Math.round(deltaSeconds / seconds), unit);
    }
  }

  return rtf.format(deltaSeconds, 'second');
};

export const formatDateTime = (value) => {
  const date = parseApiDate(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

export const formatShortDateTime = (value) => {
  const date = parseApiDate(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return '""';
  const text = String(value).replace(/"/g, '""');
  return `"${text}"`;
};

/**
 * @param {string[]} headers
 * @param {Array<Array<unknown>>} rows
 */
export const toCsv = (headers, rows) =>
  [headers.map(escapeCsvValue).join(','), ...rows.map((row) => row.map(escapeCsvValue).join(','))].join(
    '\n',
  );

export const downloadCsv = (filename, csvContent) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const clampNumber = (value, min, max) => Math.min(Math.max(value, min), max);
