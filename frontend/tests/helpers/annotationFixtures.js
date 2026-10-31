import { SPECIES } from '../../src/components/classifier/species';

export const speciesState = (overrides = {}) => (
  SPECIES.reduce((state, species) => {
    state[species.key] = Boolean(overrides[species.key]);
    return state;
  }, {})
);

export const makeWindow = (index = 0, overrides = {}) => ({
  index,
  start: index * 10,
  end: (index + 1) * 10,
  ...speciesState(overrides),
  ...overrides,
});

export const makeWindows = (duration = 30) => {
  const count = Math.max(0, Math.ceil(duration / 10));
  return Array.from({ length: count }, (_, index) => makeWindow(index, {
    end: Math.min(duration, (index + 1) * 10),
  }));
};

export const makeSlice = (index = 0, overrides = {}) => ({
  window_index: index,
  start_time: index * 10,
  end_time: (index + 1) * 10,
  ...speciesState(overrides),
  ...overrides,
});

export const makeReport = (overrides = {}) => ({
  afid: 1,
  source: 'None',
  report_id: null,
  saved_at: null,
  slices: [],
  warnings: [],
  ...overrides,
});
