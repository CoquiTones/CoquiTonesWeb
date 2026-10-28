import { useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';

import { buildLut, dbToLutIndex } from '../processing/spectrogramColormap';

const findFrameWindow = (times, timeRange) => {
  let start = 0;
  while (start < times.length && times[start] < timeRange[0] - 1e-6) start += 1;
  let end = times.length - 1;
  while (end >= 0 && times[end] > timeRange[1] + 1e-6) end -= 1;
  return [start, end];
};

const findBinWindow = (frequencies, frequencyRange) => {
  let start = 0;
  while (start < frequencies.length && frequencies[start] < frequencyRange[0] - 1e-6) start += 1;
  let end = frequencies.length - 1;
  while (end >= 0 && frequencies[end] > frequencyRange[1] + 1e-6) end -= 1;
  return [start, end];
};

export default function SpectrogramCanvas({
  analysis = null,
  timeRange,
  frequencyRange,
  colorscale,
  displayRange,
  plotRect,
}) {
  const canvasRef = useRef(null);
  const lut = useMemo(() => buildLut(colorscale), [colorscale]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (!analysis || analysis.frameCount < 1 || analysis.binCount < 1) return;

    const [frameStart, frameEnd] = findFrameWindow(analysis.times, timeRange);
    const [binStart, binEnd] = findBinWindow(analysis.frequencies, frequencyRange);
    if (frameStart > frameEnd || binStart > binEnd) return;

    const frameCount = frameEnd - frameStart + 1;
    const binCount = binEnd - binStart + 1;
    const [displayMinDb, displayMaxDb] = displayRange;

    const offscreen = document.createElement('canvas');
    offscreen.width = frameCount;
    offscreen.height = binCount;
    const offscreenContext = offscreen.getContext('2d');
    if (!offscreenContext) return;

    const image = offscreenContext.createImageData(frameCount, binCount);
    for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
      for (let binIndex = 0; binIndex < binCount; binIndex += 1) {
        const sourceFrame = frameStart + frameIndex;
        const sourceBin = binStart + binIndex;
        const dbfs = analysis.db[sourceFrame * analysis.binCount + sourceBin];
        const lutIndex = dbToLutIndex(dbfs, displayMinDb, displayMaxDb) * 4;
        const pixel = ((binCount - 1 - binIndex) * frameCount + frameIndex) * 4;
        image.data[pixel] = lut[lutIndex];
        image.data[pixel + 1] = lut[lutIndex + 1];
        image.data[pixel + 2] = lut[lutIndex + 2];
        image.data[pixel + 3] = lut[lutIndex + 3];
      }
    }
    offscreenContext.putImageData(image, 0, 0);

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(plotRect.width * dpr));
    canvas.height = Math.max(1, Math.round(plotRect.height * dpr));
    context.imageSmoothingEnabled = false;
    context.drawImage(offscreen, 0, 0, canvas.width, canvas.height);
  }, [analysis, timeRange, frequencyRange, displayRange, lut, plotRect.width, plotRect.height]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: plotRect.left,
        top: plotRect.top,
        width: plotRect.width,
        height: plotRect.height,
        display: 'block',
      }}
    />
  );
}

SpectrogramCanvas.propTypes = {
  analysis: PropTypes.shape({
    frameCount: PropTypes.number,
    binCount: PropTypes.number,
    times: PropTypes.instanceOf(Float32Array),
    frequencies: PropTypes.instanceOf(Float32Array),
    db: PropTypes.instanceOf(Float32Array),
  }),
  timeRange: PropTypes.arrayOf(PropTypes.number).isRequired,
  frequencyRange: PropTypes.arrayOf(PropTypes.number).isRequired,
  colorscale: PropTypes.string.isRequired,
  displayRange: PropTypes.arrayOf(PropTypes.number).isRequired,
  plotRect: PropTypes.shape({
    left: PropTypes.number,
    top: PropTypes.number,
    width: PropTypes.number,
    height: PropTypes.number,
  }).isRequired,
};


