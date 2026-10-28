import { useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';

import { buildLut, dbToLutIndex } from '../processing/spectrogramColormap';
import { findBinWindow, findFrameWindow } from '../processing/spectrogramTransforms';

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

    // Never build more pixels than the plot can display. Zoomed-out views of a
    // full-file analysis can otherwise touch millions of cells per redraw.
    const dpr = window.devicePixelRatio || 1;
    const targetWidth = Math.max(1, Math.min(frameCount, Math.round(plotRect.width * dpr)));
    const targetHeight = Math.max(1, Math.min(binCount, Math.round(plotRect.height * dpr)));

    const offscreen = document.createElement('canvas');
    offscreen.width = targetWidth;
    offscreen.height = targetHeight;
    const offscreenContext = offscreen.getContext('2d');
    if (!offscreenContext) return;

    const image = offscreenContext.createImageData(targetWidth, targetHeight);
    const frameStep = frameCount / targetWidth;
    const binStep = binCount / targetHeight;

    for (let row = 0; row < targetHeight; row += 1) {
      const sourceBin = binStart + (binCount - 1 - Math.floor(row * binStep));
      let pixel = row * targetWidth * 4;
      for (let column = 0; column < targetWidth; column += 1) {
        const sourceFrame = frameStart + Math.floor(column * frameStep);
        const dbfs = analysis.db[sourceFrame * analysis.binCount + sourceBin];
        const lutIndex = dbToLutIndex(dbfs, displayMinDb, displayMaxDb) * 4;
        image.data[pixel] = lut[lutIndex];
        image.data[pixel + 1] = lut[lutIndex + 1];
        image.data[pixel + 2] = lut[lutIndex + 2];
        image.data[pixel + 3] = lut[lutIndex + 3];
        pixel += 4;
      }
    }
    offscreenContext.putImageData(image, 0, 0);

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


