import { buildLut, dbToLutIndex } from './spectrogramColormap';
import {
  formatDbfs,
  formatFrequency,
  formatFrequencyTick,
  formatTime,
  formatTimeTick,
} from './spectrogramFormat';
import {
  frequencyToY,
  makeTicks,
  nearestIndex,
  timeToX,
  xToTime,
  yToFrequency,
} from './spectrogramTransforms';

const DEFAULT_WIDTH = 1600;
const DEFAULT_HEIGHT = 1000;

const rgba = (lut, index) => (
  `rgba(${lut[index * 4]}, ${lut[index * 4 + 1]}, ${lut[index * 4 + 2]}, ${
    (lut[index * 4 + 3] / 255).toFixed(3)
  })`
);

const cleanFileBase = (fileName) => (
  String(fileName || 'spectrogram')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/^-+|-+$/g, '') || 'spectrogram'
);

export const spectrogramFileName = (fileName, timeRange) => {
  const start = Number(timeRange[0]).toFixed(2);
  const end = Number(timeRange[1]).toFixed(2);
  const base = cleanFileBase(fileName);
  const prefix = base.toLowerCase() === 'spectrogram' ? '' : `${base}-`;
  return `${prefix}spectrogram-${start}s-${end}s.png`;
};

/**
 * Compose a self-contained PNG of the visible frame: heat map, time and
 * frequency axes, title, and the same dBFS legend used on screen.
 */
export const createSpectrogramImage = ({
  analysis,
  timeRange,
  frequencyRange,
  colorscale,
  displayRange,
  fileName = 'spectrogram',
  theme = null,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
}) => {
  if (!analysis || !analysis.db || !analysis.times || !analysis.frequencies) return null;
  if (typeof document === 'undefined') return null;

  const palette = {
    background: theme?.palette?.background?.paper ?? '#14120F',
    text: theme?.palette?.text?.primary ?? '#F5F1E8',
    muted: theme?.palette?.text?.secondary ?? '#CFC7B8',
    divider: theme?.palette?.divider ?? 'rgba(245, 241, 232, 0.14)',
    accent: theme?.palette?.primary?.main ?? '#FFC857',
    font: theme?.typography?.fontFamily ?? '"Segoe UI", system-ui, sans-serif',
  };

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return null;

  const plot = {
    left: 110,
    top: 110,
    width: width - 110 - 250,
    height: height - 110 - 90,
  };
  const lut = buildLut(colorscale);
  const [displayMinDb, displayMaxDb] = displayRange;

  context.fillStyle = palette.background;
  context.fillRect(0, 0, width, height);

  context.fillStyle = palette.text;
  context.font = `600 30px ${palette.font}`;
  context.textBaseline = 'top';
  context.fillText(cleanFileBase(fileName), plot.left, 34);

  context.fillStyle = palette.muted;
  context.font = `16px ${palette.font}`;
  context.fillText(
    `${formatTime(timeRange[0])} – ${formatTime(timeRange[1])}  ·  ${
      formatFrequency(frequencyRange[0])
    } – ${formatFrequency(frequencyRange[1])}`,
    plot.left,
    74,
  );

  const heatCanvas = document.createElement('canvas');
  heatCanvas.width = plot.width;
  heatCanvas.height = plot.height;
  const heatContext = heatCanvas.getContext('2d');
  if (!heatContext) return null;

  const frameAtColumn = new Int32Array(plot.width);
  for (let column = 0; column < plot.width; column += 1) {
    frameAtColumn[column] = nearestIndex(
      analysis.times,
      xToTime(plot.left + column + 0.5, timeRange, plot),
    );
  }
  const binAtRow = new Int32Array(plot.height);
  for (let row = 0; row < plot.height; row += 1) {
    binAtRow[row] = nearestIndex(
      analysis.frequencies,
      yToFrequency(plot.top + row + 0.5, frequencyRange, plot),
    );
  }

  const image = heatContext.createImageData(plot.width, plot.height);
  for (let row = 0; row < plot.height; row += 1) {
    const bin = binAtRow[row];
    let pixel = row * plot.width * 4;
    for (let column = 0; column < plot.width; column += 1) {
      const frame = frameAtColumn[column];
      const dbfs = analysis.db[frame * analysis.binCount + bin];
      const lutIndex = dbToLutIndex(dbfs, displayMinDb, displayMaxDb) * 4;
      image.data[pixel] = lut[lutIndex];
      image.data[pixel + 1] = lut[lutIndex + 1];
      image.data[pixel + 2] = lut[lutIndex + 2];
      image.data[pixel + 3] = lut[lutIndex + 3];
      pixel += 4;
    }
  }
  heatContext.putImageData(image, 0, 0);
  context.drawImage(heatCanvas, plot.left, plot.top);

  context.strokeStyle = palette.divider;
  context.lineWidth = 1;
  context.strokeRect(plot.left - 0.5, plot.top - 0.5, plot.width + 1, plot.height + 1);

  const timeTicks = makeTicks(timeRange[0], timeRange[1], 6);
  const frequencyTicks = makeTicks(frequencyRange[0], frequencyRange[1], 6);
  const axisY = plot.top + plot.height;
  const axisX = plot.left;

  context.fillStyle = palette.muted;
  context.font = `14px ${palette.font}`;
  context.textAlign = 'center';
  context.textBaseline = 'top';
  timeTicks.forEach((tick) => {
    const x = timeToX(tick.value, timeRange, plot);
    context.strokeStyle = palette.divider;
    context.beginPath();
    context.moveTo(x, axisY);
    context.lineTo(x, axisY + 6);
    context.stroke();
    context.fillText(formatTimeTick(tick.value), x, axisY + 12);
  });

  context.textAlign = 'right';
  context.textBaseline = 'middle';
  frequencyTicks.forEach((tick) => {
    const y = frequencyToY(tick.value, frequencyRange, plot);
    context.strokeStyle = palette.divider;
    context.beginPath();
    context.moveTo(axisX - 6, y);
    context.lineTo(axisX, y);
    context.stroke();
    context.fillText(formatFrequencyTick(tick.value), axisX - 10, y);
  });

  context.fillStyle = palette.text;
  context.font = `600 16px ${palette.font}`;
  context.textAlign = 'center';
  context.textBaseline = 'top';
  context.fillText('Time (s)', axisX + plot.width / 2, axisY + 48);

  context.save();
  context.translate(28, plot.top + plot.height / 2);
  context.rotate(-Math.PI / 2);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('Frequency (Hz)', 0, 0);
  context.restore();

  const legend = {
    left: plot.left + plot.width + 42,
    top: plot.top + 50,
    width: 18,
    height: Math.min(plot.height - 80, 520),
  };
  context.fillStyle = palette.text;
  context.font = `600 18px ${palette.font}`;
  context.textAlign = 'left';
  context.textBaseline = 'top';
  context.fillText('Intensity', legend.left, legend.top - 30);

  const gradient = context.createLinearGradient(
    legend.left,
    legend.top,
    legend.left,
    legend.top + legend.height,
  );
  for (let index = 0; index <= 255; index += 8) {
    gradient.addColorStop(1 - index / 255, rgba(lut, index));
  }
  gradient.addColorStop(0, rgba(lut, 255));
  context.fillStyle = gradient;
  context.fillRect(legend.left, legend.top, legend.width, legend.height);
  context.strokeStyle = palette.divider;
  context.strokeRect(
    legend.left - 0.5,
    legend.top - 0.5,
    legend.width + 1,
    legend.height + 1,
  );

  const legendTicks = makeTicks(displayMinDb, displayMaxDb, 5);
  context.font = `14px ${palette.font}`;
  context.textAlign = 'left';
  context.textBaseline = 'middle';
  context.fillStyle = palette.muted;
  legendTicks.forEach((tick) => {
    const fraction = (tick.value - displayMinDb) / (displayMaxDb - displayMinDb);
    const y = legend.top + legend.height - fraction * legend.height;
    context.fillText(formatDbfs(tick.value), legend.left + legend.width + 10, y);
  });

  context.fillStyle = palette.accent;
  context.font = `600 14px ${palette.font}`;
  context.textBaseline = 'top';
  context.fillText(`Colour scale: ${colorscale}`, legend.left, legend.top + legend.height + 24);

  context.fillStyle = palette.muted;
  context.font = `12px ${palette.font}`;
  context.textAlign = 'right';
  context.textBaseline = 'bottom';
  context.fillText('CoquiTones · Spectral analysis', width - 36, height - 26);

  return canvas;
};

export const downloadSpectrogramImage = (canvas, fileName) => {
  if (!canvas || typeof document === 'undefined') return false;

  const triggerDownload = (url) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    if (url.startsWith('blob:')) {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  if (typeof canvas.toBlob === 'function') {
    canvas.toBlob((blob) => {
      if (!blob) return;
      triggerDownload(URL.createObjectURL(blob));
    }, 'image/png');
    return true;
  }

  if (typeof canvas.toDataURL === 'function') {
    triggerDownload(canvas.toDataURL('image/png'));
    return true;
  }

  return false;
};
