/**
 * Species supported by the Random Forest classifier. `key` matches the JSON
 * field returned for each time slice. Colors follow the chart palette used on
 * the dashboard so a species keeps the same identity across the app.
 */
export const SPECIES = [
  { key: 'coqui', label: 'Coquí', color: '#FFC857' },
  { key: 'wightmanae', label: 'Wightmanae', color: '#7FC4FF' },
  { key: 'gryllus', label: 'Gryllus', color: '#6FD98A' },
  { key: 'portoricensis', label: 'Portoricensis', color: '#FFB020' },
  { key: 'unicolor', label: 'Unicolor', color: '#F2B880' },
  { key: 'hedricki', label: 'Hedricki', color: '#C4A7FF' },
  { key: 'locustus', label: 'Locustus', color: '#FF7A7A' },
  { key: 'richmondi', label: 'Richmondi', color: '#8FE3D0' },
];

/**
 * Returns the species flagged as detected on a single classification slice.
 * The API sends one boolean per species, and a slice can match several.
 */
export const getDetectedSpecies = (slice) =>
  SPECIES.filter((species) => Boolean(slice?.[species.key]));
