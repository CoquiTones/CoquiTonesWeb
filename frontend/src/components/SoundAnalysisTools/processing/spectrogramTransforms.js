export const PLOT_MARGIN = Object.freeze({
  left: 64,
  top: 16,
  right: 16,
  bottom: 44,
});

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const createPlotRect = ({
  width,
  height,
  left = PLOT_MARGIN.left,
  top = PLOT_MARGIN.top,
  right = PLOT_MARGIN.right,
  bottom = PLOT_MARGIN.bottom,
} = {}) => ({
  left,
  top,
  width: Math.max(1, width - left - right),
  height: Math.max(1, height - top - bottom),
});

export const timeToX = (time, timeRange, plotRect) => {
  const span = timeRange[1] - timeRange[0];
  if (!span) return plotRect.left;
  return plotRect.left + ((time - timeRange[0]) / span) * plotRect.width;
};

export const xToTime = (x, timeRange, plotRect) => {
  const span = timeRange[1] - timeRange[0];
  if (!span) return timeRange[0];
  return timeRange[0] + ((x - plotRect.left) / plotRect.width) * span;
};

export const frequencyToY = (frequency, frequencyRange, plotRect) => {
  const span = frequencyRange[1] - frequencyRange[0];
  if (!span) return plotRect.top + plotRect.height;
  return plotRect.top + plotRect.height - ((frequency - frequencyRange[0]) / span) * plotRect.height;
};

export const yToFrequency = (y, frequencyRange, plotRect) => {
  const span = frequencyRange[1] - frequencyRange[0];
  if (!span) return frequencyRange[0];
  return frequencyRange[0] + ((plotRect.top + plotRect.height - y) / plotRect.height) * span;
};

export const frameIndexAtX = (x, frameCount, plotRect) => {
  if (frameCount <= 0) return 0;
  const fraction = (x - plotRect.left) / plotRect.width;
  return clamp(Math.floor(fraction * frameCount), 0, frameCount - 1);
};

export const binIndexAtY = (y, binCount, plotRect) => {
  if (binCount <= 0) return 0;
  const fraction = (plotRect.top + plotRect.height - y) / plotRect.height;
  return clamp(Math.floor(fraction * binCount), 0, binCount - 1);
};

export const makeTicks = (min, max, count = 6) => {
  const safeCount = Math.max(2, count);
  return Array.from({ length: safeCount }, (_, index) => {
    const fraction = index / (safeCount - 1);
    return {
      fraction,
      value: min + fraction * (max - min),
    };
  });
};

const nearestIndex = (values, target) => {
  if (!values || values.length === 0) return 0;
  let bestIndex = 0;
  let bestDistance = Infinity;
  for (let index = 0; index < values.length; index += 1) {
    const distance = Math.abs(values[index] - target);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }
  return bestIndex;
};

export const cellFromPoint = (analysis, point, timeRange, frequencyRange, plotRect) => {
  if (!analysis || analysis.frameCount < 1 || analysis.binCount < 1) return null;
  const requestedTime = xToTime(point.x, timeRange, plotRect);
  const requestedFrequency = yToFrequency(point.y, frequencyRange, plotRect);
  const frameIndex = nearestIndex(analysis.times, requestedTime);
  const binIndex = nearestIndex(analysis.frequencies, requestedFrequency);
  const time = analysis.times[frameIndex];
  const frequency = analysis.frequencies[binIndex];
  if (time < timeRange[0] || time > timeRange[1]) return null;
  if (frequency < frequencyRange[0] || frequency > frequencyRange[1]) return null;
  return {
    frameIndex,
    binIndex,
    time,
    frequency,
    dbfs: analysis.db[frameIndex * analysis.binCount + binIndex],
  };
};

export const timeCellBoundaries = (time, timeResolution, timeRange, plotRect) => {
  const half = Math.max(0, timeResolution / 2);
  return [
    Math.max(plotRect.left, timeToX(time - half, timeRange, plotRect)),
    Math.min(plotRect.left + plotRect.width, timeToX(time + half, timeRange, plotRect)),
  ];
};

export const frequencyCellBoundaries = (frequency, frequencyResolution, frequencyRange, plotRect) => {
  const half = Math.max(0, frequencyResolution / 2);
  return [
    Math.max(plotRect.top, frequencyToY(frequency + half, frequencyRange, plotRect)),
    Math.min(plotRect.top + plotRect.height, frequencyToY(frequency - half, frequencyRange, plotRect)),
  ];
};

export const isInsidePlot = (x, y, plotRect) =>
  x >= plotRect.left &&
  x <= plotRect.left + plotRect.width &&
  y >= plotRect.top &&
  y <= plotRect.top + plotRect.height;
