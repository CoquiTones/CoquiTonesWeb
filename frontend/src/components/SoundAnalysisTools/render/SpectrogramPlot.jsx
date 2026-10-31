import { useCallback, useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';

import SpectrogramAxes from './SpectrogramAxes';
import SpectrogramCanvas from './SpectrogramCanvas';
import SpectrogramPlayhead from './SpectrogramPlayhead';
import SpectrogramStatus from './SpectrogramStatus';
import SpectrogramTooltip from './SpectrogramTooltip';
import { windowAtTime } from '../annotation/annotationModel';
import { formatDbfs, formatFrequency, formatTime } from '../processing/spectrogramFormat';
import {
  cellFromPoint,
  createPlotRect,
  findBinWindow,
  findFrameWindow,
  frequencyCellBoundaries,
  frequencyToY,
  isInsidePlot,
  timeCellBoundaries,
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

const SIGNAL_NOTICES = {
  silent: 'This recording contains no measurable signal; the plot shows the -100 dBFS floor.',
  constant: 'This recording is constant; only DC energy is visible.',
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
  refining = false,
  refineProgress = null,
  error = null,
  onRetry = null,
  audioRef = null,
  annotationWindows = [],
  pinnedWindowIndex = null,
  onPinWindow = null,
}) {
  const containerRef = useRef(null);
  const keyboardRef = useRef(null);
  const announceTimerRef = useRef(null);
  const previewWindowRef = useRef(null);
  const helpId = useId();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [readout, setReadout] = useState(null);
  const [pinned, setPinned] = useState(false);
  const [previewWindowIndex, setPreviewWindowIndex] = useState(null);
  const [announcement, setAnnouncement] = useState('');

  const setPreview = useCallback((index) => {
    if (previewWindowRef.current === index) return;
    previewWindowRef.current = index;
    setPreviewWindowIndex(index);
  }, []);

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
    setPreview(null);
    keyboardRef.current = null;
  }, [analysis, timeRange, frequencyRange, setPreview]);

  useEffect(() => {
    if (status === 'ready') return;
    setReadout(null);
    setPinned(false);
    setPreview(null);
  }, [status, setPreview]);

  useEffect(() => {
    if (!pinned) return undefined;

    const dismissOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setReadout(null);
        setPinned(false);
      }
    };
    document.addEventListener('pointerdown', dismissOutside);
    return () => document.removeEventListener('pointerdown', dismissOutside);
  }, [pinned]);

  useEffect(
    () => () => {
      if (announceTimerRef.current) clearTimeout(announceTimerRef.current);
    },
    [],
  );

  const width = size.width || containerRef.current?.clientWidth || FALLBACK_WIDTH;
  const height = size.height || containerRef.current?.clientHeight || FALLBACK_HEIGHT;
  const plotRect = createPlotRect({ width, height });

  let keyboardBox = null;
  if (readout?.keyboardMode && analysis && readout.cell) {
    const [left, right] = timeCellBoundaries(
      readout.cell.time,
      analysis.timeResolution || 0,
      timeRange,
      plotRect,
    );
    const [top, bottom] = frequencyCellBoundaries(
      readout.cell.frequency,
      analysis.frequencyResolution || 0,
      frequencyRange,
      plotRect,
    );
    keyboardBox = {
      left,
      top,
      width: Math.max(1, right - left),
      height: Math.max(1, bottom - top),
    };
  }

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
      setPreview(windowAtTime(annotationWindows, cell.time));
      if (keyboardMode) announce(cell);
    },
    [announce, annotationWindows, frequencyRange, plotRect, setPreview, timeRange],
  );

  const handlePointerMove = (event) => {
    if (!analysis || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (!isInsidePlot(x, y, plotRect)) {
      if (!pinned) setReadout(null);
      setPreview(null);
      return;
    }
    const cell = cellFromPoint(analysis, { x, y }, timeRange, frequencyRange, plotRect);
    if (!cell) {
      if (!pinned) setReadout(null);
      setPreview(null);
      return;
    }
    setReadout({ cell, pointer: { x, y }, keyboardMode: false });
    setPreview(windowAtTime(annotationWindows, cell.time));
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
      const windowIndex = windowAtTime(annotationWindows, cell.time);
      if (windowIndex !== null) onPinWindow?.(windowIndex);
    }
  };

  const handlePointerLeave = () => {
    if (!pinned) setReadout(null);
    setPreview(null);
  };

  const handleBlur = () => {
    setReadout(null);
    setPinned(false);
    setPreview(null);
  };

  const handleFocus = () => {
    if (!analysis || keyboardRef.current) return;
    const [frameStart, frameEnd] = findFrameWindow(analysis.times, timeRange);
    const [binStart, binEnd] = findBinWindow(analysis.frequencies, frequencyRange);
    const frameIndex = clamp(
      Math.floor((frameStart + frameEnd) / 2),
      0,
      analysis.frameCount - 1,
    );
    const binIndex = clamp(
      Math.floor((binStart + binEnd) / 2),
      0,
      analysis.binCount - 1,
    );
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
      if (readout?.cell) {
        const windowIndex = windowAtTime(annotationWindows, readout.cell.time);
        if (windowIndex !== null) onPinWindow?.(windowIndex);
      }
      setPinned((current) => !current);
      return;
    }

    // Keep keyboard navigation inside the visible window; the analysis now
    // covers the whole recording rather than just the displayed slice.
    const [frameStart, frameEnd] = findFrameWindow(analysis.times, timeRange);
    const [binStart, binEnd] = findBinWindow(analysis.frequencies, frequencyRange);
    const minFrame = clamp(frameStart, 0, analysis.frameCount - 1);
    const maxFrame = clamp(Math.max(frameStart, frameEnd), 0, analysis.frameCount - 1);
    const minBin = clamp(binStart, 0, analysis.binCount - 1);
    const maxBin = clamp(Math.max(binStart, binEnd), 0, analysis.binCount - 1);

    const current = keyboardRef.current ?? {
      frameIndex: Math.floor((minFrame + maxFrame) / 2),
      binIndex: Math.floor((minBin + maxBin) / 2),
    };
    let next = { ...current };

    if (event.key === 'ArrowLeft') next.frameIndex -= 1;
    else if (event.key === 'ArrowRight') next.frameIndex += 1;
    else if (event.key === 'ArrowUp') next.binIndex += 1;
    else if (event.key === 'ArrowDown') next.binIndex -= 1;
    else if (event.key === 'Home') next.frameIndex = minFrame;
    else if (event.key === 'End') next.frameIndex = maxFrame;
    else return;

    event.preventDefault();
    next = {
      frameIndex: clamp(next.frameIndex, minFrame, maxFrame),
      binIndex: clamp(next.binIndex, minBin, maxBin),
    };
    keyboardRef.current = next;
    showCell(cellAt(next.frameIndex, next.binIndex), true, pinned);
  };

  const showFullStatus = !analysis || status === 'idle' || status === 'decoding' || status === 'failed';
  const showInlineProgress = (status === 'analyzing' && Boolean(analysis)) || refining;
  const inlineProgress = refining ? refineProgress : progress;

  const windowForIndex = (index) => (
    index === null || index === undefined ? null : annotationWindows[index] ?? null
  );
  const pinnedWindow = windowForIndex(pinnedWindowIndex);
  const previewWindow = previewWindowIndex !== null && previewWindowIndex !== pinnedWindowIndex
    ? windowForIndex(previewWindowIndex)
    : null;
  const readoutWindow = readout?.cell
    ? windowForIndex(windowAtTime(annotationWindows, readout.cell.time))
    : null;
  const windowRect = (window) => {
    if (!window) return null;
    const left = clamp(
      timeToX(window.start, timeRange, plotRect),
      plotRect.left,
      plotRect.left + plotRect.width,
    );
    const right = clamp(
      timeToX(window.end, timeRange, plotRect),
      plotRect.left,
      plotRect.left + plotRect.width,
    );
    if (right <= left) return null;
    return { left, width: right - left };
  };
  const pinnedRect = windowRect(pinnedWindow);
  const previewRect = previewWindow ? windowRect(previewWindow) : null;

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
      onBlur={handleBlur}
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
      {pinnedRect && (
        <Box
          data-testid="spectrogram-annotation-pinned"
          sx={{
            position: 'absolute',
            left: pinnedRect.left,
            top: plotRect.top,
            width: pinnedRect.width,
            height: plotRect.height,
            border: '2px solid',
            borderColor: 'primary.main',
            backgroundColor: 'action.selected',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}
      {previewRect && (
        <Box
          data-testid="spectrogram-annotation-preview"
          sx={{
            position: 'absolute',
            left: previewRect.left,
            top: plotRect.top,
            width: previewRect.width,
            height: plotRect.height,
            border: '1px dashed',
            borderColor: 'divider',
            backgroundColor: 'action.hover',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}
      {analysis && (
        <SpectrogramPlayhead audioRef={audioRef} timeRange={timeRange} plotRect={plotRect} />
      )}
      {keyboardBox && (
        <Box
          data-testid="spectrogram-keyboard-cursor"
          sx={{
            position: 'absolute',
            left: keyboardBox.left,
            top: keyboardBox.top,
            width: keyboardBox.width,
            height: keyboardBox.height,
            border: '2px solid',
            borderColor: 'primary.main',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      )}
      <SpectrogramTooltip
        cell={readout?.cell ?? null}
        pointer={readout?.pointer ?? null}
        plotRect={plotRect}
        keyboardMode={readout?.keyboardMode ?? false}
        window={readoutWindow}
      />
      {status === 'ready' && analysis?.signalNotice && (
        <Alert
          severity="info"
          role="status"
          aria-live="polite"
          data-testid="spectrogram-signal-notice"
          sx={{
            position: 'absolute',
            top: plotRect.top + 8,
            left: plotRect.left + 8,
            maxWidth: Math.max(160, plotRect.width - 16),
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          {SIGNAL_NOTICES[analysis.signalNotice]}
        </Alert>
      )}
      {showInlineProgress && (
        <LinearProgress
          aria-label={refining ? 'Refining the visible spectrogram window' : 'Analyzing spectrogram'}
          variant={typeof inlineProgress === 'number' ? 'determinate' : 'indeterminate'}
          value={typeof inlineProgress === 'number' ? Math.round(inlineProgress * 100) : undefined}
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
        to jump to the first or last time frame. Press Enter or Space to pin the readout and its
        ten-second annotation window, and Escape to dismiss it.
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
  refining: PropTypes.bool,
  refineProgress: PropTypes.number,
  error: PropTypes.object,
  onRetry: PropTypes.func,
  audioRef: PropTypes.shape({
    current: PropTypes.object,
  }),
  annotationWindows: PropTypes.arrayOf(PropTypes.object),
  pinnedWindowIndex: PropTypes.number,
  onPinWindow: PropTypes.func,
};
