import { SPECIES } from '../../classifier/species.js';

export const WINDOW_SECONDS = 10;
export const SPECIES_KEYS = SPECIES.map((species) => species.key);

const EPSILON = 1e-6;

const isFiniteNumber = (value) => (
  typeof value === 'number' && Number.isFinite(value)
);

export const emptySpecies = () => (
  SPECIES_KEYS.reduce((state, key) => {
    state[key] = false;
    return state;
  }, {})
);

export const pickSpecies = (source = {}) => (
  SPECIES_KEYS.reduce((state, key) => {
    state[key] = Boolean(source[key]);
    return state;
  }, {})
);

export const emptyWindow = (window) => ({
  ...window,
  ...emptySpecies(),
});

export const buildWindows = (durationSeconds) => {
  const duration = Number(durationSeconds);
  if (!Number.isFinite(duration) || duration <= 0) return [];

  const count = Math.ceil(duration / WINDOW_SECONDS);
  return Array.from({ length: count }, (_, index) => {
    const start = index * WINDOW_SECONDS;
    return {
      index,
      start,
      end: Math.min(duration, start + WINDOW_SECONDS),
    };
  });
};

export const createEmptyWindows = (durationSeconds) => (
  buildWindows(durationSeconds).map(emptyWindow)
);

export const createEmptyReport = (windows = []) => ({
  source: 'None',
  report_id: null,
  saved_at: null,
  windows: windows.map(emptyWindow),
  warnings: [],
});

export const mapReportSlices = (slices = [], windows = []) => {
  const warnings = [];
  const mappedByIndex = new Map();
  const persisted = Array.isArray(slices) ? slices : [];

  persisted.forEach((slice, position) => {
    const start = Number(slice?.start_time);
    const end = Number(slice?.end_time);
    const rawIndex = slice?.window_index;
    const suppliedIndex = Number(rawIndex);
    const hasSuppliedIndex = (
      rawIndex !== null
      && rawIndex !== undefined
      && Number.isInteger(suppliedIndex)
      && suppliedIndex >= 0
    );
    const derivedIndex = (
      isFiniteNumber(start)
      && start >= 0
      && Math.abs(start % WINDOW_SECONDS) <= EPSILON
    )
      ? Math.round(start / WINDOW_SECONDS)
      : null;
    const index = hasSuppliedIndex ? suppliedIndex : derivedIndex;

    if (index === null) {
      warnings.push(
        `Ignored persisted slice ${position + 1}: its window index is invalid.`,
      );
      return;
    }

    const expected = windows[index];
    if (!expected) {
      warnings.push(
        `Ignored persisted slice ${index + 1}: it is outside the recording grid.`,
      );
      return;
    }

    if (
      !isFiniteNumber(start)
      || !isFiniteNumber(end)
      || Math.abs(start - expected.start) > EPSILON
      || Math.abs(end - expected.end) > EPSILON
    ) {
      warnings.push(
        `Ignored persisted slice ${index + 1}: its boundaries do not match the ten-second grid.`,
      );
      return;
    }

    if (mappedByIndex.has(index)) {
      warnings.push(`Ignored duplicate persisted slice for window ${index + 1}.`);
      return;
    }

    mappedByIndex.set(index, pickSpecies(slice));
  });

  const mappedWindows = windows.map((window) => ({
    ...window,
    ...(mappedByIndex.get(window.index) ?? emptySpecies()),
  }));

  if (persisted.length > 0) {
    const missing = windows.length - mappedByIndex.size;
    if (missing > 0) {
      warnings.push(
        `${missing} window${missing === 1 ? '' : 's'} had no persisted report and are shown as absent.`,
      );
    }
  }

  return { windows: mappedWindows, warnings };
};

export const applySpeciesToggle = (windows, index, speciesKey, value) => {
  if (!SPECIES_KEYS.includes(speciesKey)) return windows;
  if (!Number.isInteger(index) || index < 0 || index >= windows.length) {
    return windows;
  }

  return windows.map((window, windowIndex) => {
    if (windowIndex !== index) return window;
    const nextValue = typeof value === 'boolean' ? value : !window[speciesKey];
    return { ...window, [speciesKey]: nextValue };
  });
};

export const windowsEqual = (left = [], right = []) => {
  if (left.length !== right.length) return false;

  return left.every((window, index) => {
    const other = right[index];
    if (!other) return false;
    if (window.index !== other.index) return false;
    if (Math.abs(window.start - other.start) > EPSILON) return false;
    if (Math.abs(window.end - other.end) > EPSILON) return false;
    return SPECIES_KEYS.every((key) => Boolean(window[key]) === Boolean(other[key]));
  });
};

export const windowsToSlices = (windows = []) => (
  windows.map((window) => ({
    window_index: window.index,
    start_time: window.start,
    end_time: window.end,
    ...pickSpecies(window),
  }))
);

export const windowAtTime = (windows = [], time) => {
  const value = Number(time);
  if (!windows.length || !Number.isFinite(value) || value < 0) return null;
  const lastEnd = windows[windows.length - 1].end;
  if (value > lastEnd + EPSILON) return null;
  return Math.min(
    windows.length - 1,
    Math.floor(value / WINDOW_SECONDS),
  );
};

export const reportSourceLabel = (source) => {
  if (source === 'Manual' || source === 'Classifier') return source;
  return 'None';
};
