const pad = (value, length = 2) => String(value).padStart(length, '0');

export const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) return '—';
  const sign = seconds < 0 ? '-' : '';
  const absolute = Math.abs(seconds);
  if (absolute < 60) return `${sign}${absolute.toFixed(2)} s`;

  const totalMinutes = Math.floor(absolute / 60);
  const remainingSeconds = absolute - totalMinutes * 60;
  return `${sign}${totalMinutes}:${remainingSeconds.toFixed(2).padStart(5, '0')}`;
};

export const formatTimeTick = (seconds) => {
  if (!Number.isFinite(seconds)) return '—';
  if (Math.abs(seconds) < 60) return seconds.toFixed(seconds < 10 ? 1 : 0);
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${pad(Math.round(seconds % 60))}`;
};

export const formatFrequency = (hertz) => {
  if (!Number.isFinite(hertz)) return '—';
  if (Math.abs(hertz) < 1000) return `${Math.round(hertz)} Hz`;
  return `${(hertz / 1000).toFixed(2)} kHz`;
};

export const formatFrequencyTick = (hertz) => {
  if (!Number.isFinite(hertz)) return '—';
  if (Math.abs(hertz) < 1000) return `${Math.round(hertz)}`;
  return `${(hertz / 1000).toFixed(hertz >= 10000 ? 0 : 1)}k`;
};

export const formatDbfs = (dbfs) => {
  if (!Number.isFinite(dbfs)) return '—';
  return `${dbfs.toFixed(1)} dBFS`;
};
