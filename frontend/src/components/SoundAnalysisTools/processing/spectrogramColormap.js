import colormap from 'colormap';

const FALLBACK_COLORMAP = 'jet';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const buildLut = (colormapId = FALLBACK_COLORMAP) => {
  let colors;
  try {
    colors = colormap({
      colormap: colormapId,
      nshades: 256,
      format: 'rgba',
      alpha: 1,
    });
  } catch {
    colors = colormap({
      colormap: FALLBACK_COLORMAP,
      nshades: 256,
      format: 'rgba',
      alpha: 1,
    });
  }

  const lut = new Uint8ClampedArray(256 * 4);
  for (let index = 0; index < 256; index += 1) {
    const [red, green, blue, alpha = 255] = colors[index] ?? colors[colors.length - 1];
    lut[index * 4] = red;
    lut[index * 4 + 1] = green;
    lut[index * 4 + 2] = blue;
    lut[index * 4 + 3] = Math.round((alpha <= 1 ? alpha * 255 : alpha));
  }
  return lut;
};

export const dbToLutIndex = (dbfs, displayMinDb = -100, displayMaxDb = 0) => {
  if (!Number.isFinite(dbfs) || displayMaxDb <= displayMinDb) return 0;
  const normalized = (dbfs - displayMinDb) / (displayMaxDb - displayMinDb);
  return clamp(Math.round(normalized * 255), 0, 255);
};

export const dbToRgba = (dbfs, lut, displayMinDb = -100, displayMaxDb = 0) => {
  const index = dbToLutIndex(dbfs, displayMinDb, displayMaxDb) * 4;
  return [lut[index], lut[index + 1], lut[index + 2], lut[index + 3]];
};

const cssColor = (lut, index) =>
  `rgba(${lut[index * 4]}, ${lut[index * 4 + 1]}, ${lut[index * 4 + 2]}, ${(
    lut[index * 4 + 3] / 255
  ).toFixed(3)})`;

/**
 * The heat map maps displayMinDb to the bottom of the plot and displayMaxDb to
 * the top. The legend gradient uses the same orientation so it cannot drift.
 */
export const buildGradientCss = (lut, direction = 'to top') => {
  const stops = [];
  for (let index = 0; index < 256; index += 16) {
    stops.push(`${cssColor(lut, index)} ${((index / 255) * 100).toFixed(1)}%`);
  }
  stops.push(`${cssColor(lut, 255)} 100%`);
  return `linear-gradient(${direction}, ${stops.join(', ')})`;
};
