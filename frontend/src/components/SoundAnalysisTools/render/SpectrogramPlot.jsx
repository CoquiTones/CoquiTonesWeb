import { useCallback, useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';

import SpectrogramAxes from './SpectrogramAxes';
import SpectrogramCanvas from './SpectrogramCanvas';
import SpectrogramStatus from './SpectrogramStatus';
import SpectrogramTooltip from './SpectrogramTooltip';
import { formatDbfs, formatFrequency, formatTime } from '../processing/spectrogramFormat';
import {
  cellFromPoint,
  createPlotRect,
  frequencyToY,
  isInsidePlot,
  timeToX,
} from '../processing/spectrogramTransforms';

const FALLBACK_WIDTH = 800;
const FALLBACK_HEIGHT = 400;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const hiddenLiveRegion = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

export default function SpectrogramPlot({
  analysis = null,
  fileName = '',
  timeRange,
  frequencyRange,
  colorscale,
  displayRange,
  status,
  progress = null,
  error = null,
  onRetry = null,
}) {
  const containerRef = useRef(null);
  const keyboardRef = useRef(null);
  const announceTimerRef = useRef(null);
  const helpId = useId();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [readout, setReadout] = useState(null);
  const [pinned, setPinned] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;

    const updateSize = () => {
      setSize({ width: element.clientWidth, height: element.clientHeight });
    };
    updateSize();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateSize);
      observer.observe(element);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    setReadout(null);
    setPinned(false);
    keyboardRef.current = null;
  }, [analysis, timeRange, frequencyRange]);

  useEffect(
    () => () => {
      if (announceTimerRef.current) clearTimeout(announceTimerRef.current);
    },
    [],
  );

  const width = size.width || containerRef.current?.clientWidth || FALLBACK_WIDTH;
  const height = size.height || containerRef.current?.clientHeight || FALLBACK_HEIGHT;
  const plotRect = createPlotRect({ width, height });

  const announce = useCallback((cell) => {
    if (announceTimerRef.current) return;
    setAnnouncement(
      `Time ${formatTime(cell.time)}, frequency ${formatFrequency(cell.frequency)}, intensity ${formatDbfs(cell.dbfs)}`,
    );
    announceTimerRef.current = setTimeout(() => {
      announceTimerRef.current = null;
    }, 250);
  }, []);

  const cellAt = useCallback(
    (frameIndex, binIndex) => {
      if (!analysis || analysis.frameCount < 1 || analysis.binCount < 1) return null;
      const safeFrame = clamp(frameIndex, 0, analysis.frameCount - 1);
      const safeBin = clamp(binIndex, 0, analysis.binCount - 1);
      return {
        frameIndex: safeFrame,
        binIndex: safeBin,
        time: analysis.times[safeFrame],
        frequency: analysis.frequencies[safeBin],
        dbfs: analysis.db[safeFrame * analysis.binCount + safeBin],
      };
    },
    [analysis],
  );

  const showCell = useCallback(
    (cell, keyboardMode, pin = false) => {
      if (!cell) return;
      const pointer = {
        x: timeToX(cell.time, timeRange, plotRect),
        y: frequencyToY(cell.frequency, frequencyRange, plotRect),
      };
      setReadout({ cell, pointer, keyboardMode });
      setPinned(pin);
      if (keyboardMode) announce(cell);
    },
    [announce, frequencyRange, plotRect, timeRange],
  );

  const handlePointerMove = (event) => {
    if (!analysis || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (!isInsidePlot(x, y, plotRect)) {
      if (!pinned) setReadout(null);
      return;
    }
    const cell = cellFromPoint(analysis, { x, y }, timeRange, frequencyRange, plotRect);
    if (!cell) {
      if (!pinned) setReadout(null);
      return;
    }
    setReadout({ cell, pointer: { x, y }, keyboardMode: false });
  };

  const handlePointerDown = (event) => {
    if (!analysis || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (!isInsidePlot(x, y, plotRect)) {
      setReadout(null);
      setPinned(false);
      return;
    }
    const cell = cellFromPoint(analysis, { x, y }, timeRange, frequencyRange, plotRect);
    if (cell) {
      setReadout({ cell, pointer: { x, y }, keyboardMode: false });
      setPinned(event.pointerType === 'touch');
    }
  };

  const handlePointerLeave = () => {
    if (!pinned) setReadout(null);
  };

  const handleFocus = () => {
    if (!analysis || keyboardRef.current) return;
    const frameIndex = Math.floor(analysis.frameCount / 2);
    const binIndex = Math.floor(analysis.binCount / 2);
    keyboardRef.current = { frameIndex, binIndex };
    showCell(cellAt(frameIndex, binIndex), true);
  };

  const handleKeyDown = (event) => {
    if (!analysis) return;
    if (event.key === 'Escape') {
      setReadout(null);
      setPinned(false);
      return;
    }
    if (['Enter', ' '].includes(event.key)) {
      event.preventDefault();
      setPinned((current) => !current);
      return;
    }

    const current = keyboardRef.current ?? {
      frameIndex: Math.floor(analysis.frameCount / 2),
      binIndex: Math.floor(analysis.binCount / 2),
    };
    let next = { ...current };

    if (event.key === 'ArrowLeft') next.frameIndex -= 1;
    else if (event.key === 'ArrowRight') next.frameIndex += 1;
    else if (event.key === 'ArrowUp') next.binIndex += 1;
    else if (event.key === 'ArrowDown') next.binIndex -= 1;
    else if (event.key === 'Home') next.frameIndex = 0;
    else if (event.key === 'End') next.frameIndex = analysis.frameCount - 1;
    else return;

    event.preventDefault();
    next = {
      frameIndex: clamp(next.frameIndex, 0, analysis.frameCount - 1),
      binIndex: clamp(next.binIndex, 0, analysis.binCount - 1),
    };
    keyboardRef.current = next;
    showCell(cellAt(next.frameIndex, next.binIndex), true, pinned);
  };

  const showFullStatus = !analysis || status === 'idle' || status === 'decoding' || status === 'failed';
  const showInlineProgress = status === 'analyzing' && Boolean(analysis);

  return (
    <Box
      ref={containerRef}
      role="application"
      tabIndex={0}
      aria-label={`Spectrogram of ${fileName || 'the loaded recording'}, showing ${timeRange[0]} to ${timeRange[1]} seconds and ${frequencyRange[0]} to ${frequencyRange[1]} hertz`}
      aria-describedby={helpId}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerLeave={handlePointerLeave}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 360,
        outline: 'none',
        '&:focus-visible': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: 2,
        },
      }}
    >
      <SpectrogramCanvas
        analysis={analysis}
        timeRange={timeRange}
        frequencyRange={frequencyRange}
        colorscale={colorscale}
        displayRange={displayRange}
        plotRect={plotRect}
      />
      <SpectrogramAxes
        timeRange={timeRange}
        frequencyRange={frequencyRange}
        plotRect={plotRect}
      />
      <SpectrogramTooltip
        cell={readout?.cell ?? null}
        pointer={readout?.pointer ?? null}
        plotRect={plotRect}
        keyboardMode={readout?.keyboardMode ?? false}
      />
      {showInlineProgress && (
        <LinearProgress
          variant={typeof progress === 'number' ? 'determinate' : 'indeterminate'}
          value={typeof progress === 'number' ? Math.round(progress * 100) : undefined}
          sx={{ position: 'absolute', top: 0, left: plotRect.left, width: plotRect.width, zIndex: 4 }}
        />
      )}
      {showFullStatus && (
        <SpectrogramStatus
          status={status}
          fileName={fileName}
          progress={progress}
          error={error}
          onRetry={onRetry}
        />
      )}
      <span id={helpId} style={hiddenLiveRegion}>
        Use the arrow keys to move the readout by one time frame or frequency row. Press Home or End
        to jump to the first or last time frame. Press Enter or Space to pin the readout, and Escape
        to dismiss it.
      </span>
      <span aria-live="polite" data-testid="spectrogram-announcement" style={hiddenLiveRegion}>
        {announcement}
      </span>
    </Box>
  );
}

SpectrogramPlot.propTypes = {
  analysis: PropTypes.object,
  fileName: PropTypes.string,
  timeRange: PropTypes.arrayOf(PropTypes.number).isRequired,
  frequencyRange: PropTypes.arrayOf(PropTypes.number).isRequired,
  colorscale: PropTypes.string.isRequired,
  displayRange: PropTypes.arrayOf(PropTypes.number).isRequired,
  status: PropTypes.oneOf(['idle', 'decoding', 'analyzing', 'ready', 'failed']).isRequired,
  progress: PropTypes.number,
  error: PropTypes.object,
  onRetry: PropTypes.func,
};
