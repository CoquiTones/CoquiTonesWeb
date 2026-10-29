import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import ClassificationWaveformTooltip from './ClassificationWaveformTooltip';
import { useWaveformPeaks } from './useWaveformPeaks';
import { buildSliceSegments, findSegmentAtTime } from './waveformModel';
import { SPECIES } from './species';
import { formatTimeTick } from '../SoundAnalysisTools/processing/spectrogramFormat';
import { makeTicks } from '../SoundAnalysisTools/processing/spectrogramTransforms';

const FALLBACK_WIDTH = 800;
const FALLBACK_HEIGHT = 160;

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

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Amplitude timeline for the classifier report. Every 10-second window is a
 * hover/focus target; detected windows are tinted and carry a species color
 * strip along the top edge.
 */
export default function ClassificationWaveform({ slices, audioFile, fileName = '' }) {
  const theme = useTheme();
  const headingId = useId();
  const descriptionId = useId();
  const instructionsId = useId();

  const containerRef = useRef(null);
  const plotRef = useRef(null);
  const canvasRef = useRef(null);
  const pointerActiveRef = useRef(false);

  const [size, setSize] = useState({ width: 0, height: 0 });
  const [readout, setReadout] = useState(null);
  const [pinned, setPinned] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const { status, peaks, duration, skippedReason } = useWaveformPeaks(audioFile);
  const {
    segments,
    duration: timelineDuration,
    classifiedEnd,
    unclassifiedStart,
  } = useMemo(() => buildSliceSegments(slices, duration), [slices, duration]);

  const width = size.width || FALLBACK_WIDTH;
  const height = size.height || FALLBACK_HEIGHT;

  const detectedCount = useMemo(
    () => segments.reduce((total, segment) => total + (segment.hasDetection ? 1 : 0), 0),
    [segments],
  );

  const presentSpecies = useMemo(() => {
    const keys = new Set();
    segments.forEach((segment) => {
      segment.species.forEach((species) => keys.add(species.key));
    });
    return SPECIES.filter((species) => keys.has(species.key));
  }, [segments]);

  const ticks = useMemo(
    () => (timelineDuration > 0 ? makeTicks(0, timelineDuration, 6) : []),
    [timelineDuration],
  );

  useEffect(() => {
    const element = plotRef.current;
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
    const pixelWidth = Math.max(1, Math.round(width * dpr));
    const pixelHeight = Math.max(1, Math.round(height * dpr));
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);

    if (!(timelineDuration > 0)) return;

    const xForTime = (time) =>
      (clamp(time, 0, timelineDuration) / timelineDuration) * width;
    const centerY = height / 2;
    const halfHeight = Math.max(2, height / 2 - 10);
    const mutedBarColor = alpha(theme.palette.text.secondary, 0.52);
    const detectedBarColor = alpha(theme.palette.primary.light, 0.92);
    const tailBarColor = alpha(theme.palette.text.secondary, 0.26);

    if (unclassifiedStart !== null) {
      const tailX = xForTime(unclassifiedStart);
      context.fillStyle = alpha(theme.palette.text.primary, 0.035);
      context.fillRect(tailX, 0, width - tailX, height);
    }

    segments.forEach((segment) => {
      if (!segment.hasDetection) return;
      const startX = xForTime(segment.start);
      const endX = xForTime(segment.end);
      if (endX <= startX) return;
      context.fillStyle = alpha(theme.palette.primary.main, 0.13);
      context.fillRect(startX, 0, endX - startX, height);
    });

    const drawWaveformBars = (startTime, endTime, color) => {
      if (!peaks || peaks.length === 0 || status !== 'ready') return;
      const startX = Math.max(0, Math.floor(xForTime(startTime)));
      const endX = Math.min(width, Math.ceil(xForTime(endTime)));
      context.fillStyle = color;

      for (let x = startX; x < endX; x += 1) {
        const bucketStart = Math.floor((x / width) * peaks.length);
        const bucketEnd = Math.max(
          bucketStart + 1,
          Math.ceil(((x + 1) / width) * peaks.length),
        );
        let peak = 0;
        for (let bucket = bucketStart; bucket < Math.min(peaks.length, bucketEnd); bucket += 1) {
          if (peaks[bucket] > peak) peak = peaks[bucket];
        }

        const amplitude = Math.min(1, peak) * halfHeight;
        if (amplitude < 0.5) {
          context.fillRect(x, centerY - 0.5, 1, 1);
        } else {
          context.fillRect(x, centerY - amplitude, 1, amplitude * 2);
        }
      }
    };

    if (peaks && peaks.length > 0 && status === 'ready') {
      segments.forEach((segment) => {
        drawWaveformBars(
          segment.start,
          segment.end,
          segment.hasDetection ? detectedBarColor : mutedBarColor,
        );
      });
      if (unclassifiedStart !== null) {
        drawWaveformBars(unclassifiedStart, timelineDuration, tailBarColor);
      }
    } else {
      // Without decoded samples, keep the slice structure readable with one
      // equal-height bar per window. Hover and keyboard inspection still work.
      segments.forEach((segment) => {
        const startX = xForTime(segment.start);
        const endX = xForTime(segment.end);
        const barWidth = Math.max(1, (endX - startX) * 0.62);
        const centerX = (startX + endX) / 2;
        context.fillStyle = segment.hasDetection ? detectedBarColor : mutedBarColor;
        context.fillRect(
          centerX - barWidth / 2,
          centerY - halfHeight * 0.38,
          barWidth,
          halfHeight * 0.76,
        );
      });
    }

    context.strokeStyle = alpha(theme.palette.text.primary, 0.14);
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0, centerY + 0.5);
    context.lineTo(width, centerY + 0.5);
    context.stroke();

    segments.forEach((segment) => {
      if (!segment.hasDetection || segment.species.length === 0) return;
      const startX = xForTime(segment.start);
      const endX = xForTime(segment.end);
      const segmentWidth = endX - startX;
      if (segmentWidth <= 0) return;
      const partWidth = segmentWidth / segment.species.length;
      segment.species.forEach((species, index) => {
        context.fillStyle = species.color;
        context.fillRect(
          startX + index * partWidth,
          0,
          Math.max(1, partWidth),
          3,
        );
      });
    });

    context.strokeStyle = alpha(theme.palette.text.primary, 0.07);
    segments.forEach((segment) => {
      const x = xForTime(segment.start);
      if (x <= 0 || x >= width) return;
      if (xForTime(segment.end) - x < 6) return;
      context.beginPath();
      context.moveTo(x + 0.5, 4);
      context.lineTo(x + 0.5, height);
      context.stroke();
    });

    if (unclassifiedStart !== null) {
      const tailX = Math.min(width - 0.5, xForTime(unclassifiedStart));
      context.save();
      context.strokeStyle = alpha(theme.palette.text.secondary, 0.5);
      context.setLineDash([4, 4]);
      context.beginPath();
      context.moveTo(tailX, 0);
      context.lineTo(tailX, height);
      context.stroke();
      context.restore();

      if (width - tailX > 84) {
        context.fillStyle = alpha(theme.palette.text.secondary, 0.9);
        context.font = `10px ${theme.typography.fontFamily}`;
        context.fillText('not classified', Math.min(width - 76, tailX + 6), 15);
      }
    }
  }, [
    peaks,
    segments,
    timelineDuration,
    unclassifiedStart,
    width,
    height,
    theme,
    status,
  ]);

  const announce = useCallback((message) => {
    setAnnouncement(message);
  }, []);

  const showSegment = useCallback(
    (index, keyboardMode = false) => {
      const segment = segments[index];
      if (!segment || !(timelineDuration > 0)) return;

      const pointer = {
        x: (((segment.start + segment.end) / 2) / timelineDuration) * width,
        y: height / 2,
      };
      setReadout({ kind: 'segment', segment, pointer, keyboardMode });

      if (keyboardMode) {
        const speciesText = segment.species.length
          ? `Species detected: ${segment.species.map((species) => species.label).join(', ')}.`
          : 'No species detected.';
        announce(`${segment.start} to ${segment.end} seconds. ${speciesText}`);
      }
    },
    [segments, timelineDuration, width, height, announce],
  );

  const readoutFromPoint = useCallback(
    (x, y, plotWidth) => {
      if (!(timelineDuration > 0) || !(plotWidth > 0)) return;
      const time = (x / plotWidth) * timelineDuration;
      const segment = findSegmentAtTime(segments, time, classifiedEnd);

      if (segment) {
        setReadout({ kind: 'segment', segment, pointer: { x, y }, keyboardMode: false });
        return;
      }

      if (unclassifiedStart !== null && time >= unclassifiedStart) {
        setReadout({
          kind: 'unclassified',
          start: unclassifiedStart,
          end: timelineDuration,
          pointer: { x, y },
          keyboardMode: false,
        });
        return;
      }

      setReadout(null);
    },
    [timelineDuration, segments, classifiedEnd, unclassifiedStart],
  );

  const handlePointerMove = (event) => {
    if (event.pointerType === 'touch') return;
    pointerActiveRef.current = true;

    const rect = plotRef.current?.getBoundingClientRect();
    if (!rect || !(rect.width > 0) || !(rect.height > 0)) return;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
      if (!pinned) setReadout(null);
      return;
    }
    readoutFromPoint(x, y, rect.width);
  };

  const handlePointerDown = (event) => {
    pointerActiveRef.current = true;
    if (event.pointerType === 'mouse') return;

    const rect = plotRef.current?.getBoundingClientRect();
    if (!rect || !(rect.width > 0) || !(rect.height > 0)) return;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (x < 0 || x > rect.width || y < 0 || y > rect.height) return;

    readoutFromPoint(x, y, rect.width);
    setPinned(true);
  };

  const handleClick = () => {
    if (readout) setPinned(true);
  };

  const handlePointerLeave = () => {
    pointerActiveRef.current = false;
    if (!pinned) setReadout(null);
  };

  const handleFocus = () => {
    if (pointerActiveRef.current || readout) return;
    const firstDetected = segments.findIndex((segment) => segment.hasDetection);
    showSegment(firstDetected >= 0 ? firstDetected : 0, true);
  };

  const handleBlur = () => {
    pointerActiveRef.current = false;
    if (!pinned) setReadout(null);
  };

  const handleKeyDown = (event) => {
    if (segments.length === 0) return;

    if (event.key === 'Escape') {
      setReadout(null);
      setPinned(false);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setPinned((current) => !current);
      return;
    }

    const currentIndex = readout?.kind === 'segment' ? readout.segment.index : -1;
    let nextIndex = null;

    if (event.key === 'ArrowLeft') {
      nextIndex = currentIndex < 0 ? segments.length - 1 : currentIndex - 1;
    } else if (event.key === 'ArrowRight') {
      nextIndex = currentIndex < 0 ? 0 : currentIndex + 1;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = segments.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    showSegment(clamp(nextIndex, 0, segments.length - 1), true);
  };

  const activeBounds = useMemo(() => {
    if (!readout || !(timelineDuration > 0)) return null;
    const start = readout.kind === 'segment' ? readout.segment.start : readout.start;
    const end = readout.kind === 'segment' ? readout.segment.end : readout.end;
    const left = (clamp(start, 0, timelineDuration) / timelineDuration) * width;
    const right = (clamp(end, 0, timelineDuration) / timelineDuration) * width;
    return { left, width: Math.max(1, right - left) };
  }, [readout, timelineDuration, width]);

  if (segments.length === 0) return null;

  return (
    <Box
      ref={containerRef}
      component="section"
      aria-labelledby={headingId}
      sx={{ mb: 3 }}
    >
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 1,
          mb: 1,
        }}
      >
        <Box>
          <Typography id={headingId} component="h3" variant="subtitle1" color="text.primary">
            Detection timeline
          </Typography>
          <Typography id={descriptionId} variant="caption" color="text.secondary">
            Each panel is a 10-second classification window. Hover or focus a panel to inspect the
            species found.
          </Typography>
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          data-testid="classification-waveform-summary"
          sx={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {detectedCount} of {segments.length} window{segments.length === 1 ? '' : 's'} with
          detections
        </Typography>
      </Box>

      <Box
        sx={{
          position: 'relative',
          px: 1,
          pt: 1,
          pb: 0.5,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: alpha(theme.palette.background.default, 0.55),
        }}
      >
        <Box
          ref={plotRef}
          role="application"
          tabIndex={0}
          aria-label={`Detection timeline for ${
            fileName || 'the recording'
          }: ${segments.length} classification windows, ${detectedCount} with detections.`}
          aria-describedby={`${descriptionId} ${instructionsId}`}
          aria-busy={status === 'decoding'}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerLeave={handlePointerLeave}
          onClick={handleClick}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          sx={{
            position: 'relative',
            width: '100%',
            height: { xs: 132, sm: 168 },
            cursor: 'crosshair',
            touchAction: 'pan-y',
            outline: 'none',
            '&:focus-visible': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: 2,
              borderRadius: 1,
            },
          }}
        >
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              display: 'block',
            }}
          />

          {activeBounds && (
            <Box
              aria-hidden="true"
              sx={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${activeBounds.left}px`,
                width: `${activeBounds.width}px`,
                border: '1px solid',
                borderColor: 'primary.main',
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                borderRadius: 0.5,
                pointerEvents: 'none',
                zIndex: 2,
              }}
            />
          )}

          {readout && !readout.keyboardMode && (
            <Box
              aria-hidden="true"
              sx={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${readout.pointer.x}px`,
                width: '1px',
                backgroundColor: alpha(theme.palette.primary.main, 0.55),
                pointerEvents: 'none',
                zIndex: 2,
              }}
            />
          )}

          <ClassificationWaveformTooltip
            readout={readout}
            plotRect={{ width, height }}
          />

          {status === 'decoding' && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                backgroundColor: alpha(theme.palette.background.default, 0.6),
                zIndex: 3,
              }}
            >
              <Box sx={{ width: '60%', maxWidth: 260, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Preparing waveform…
                </Typography>
                <LinearProgress />
              </Box>
            </Box>
          )}
        </Box>

        {ticks.length > 0 && (
          <Box aria-hidden="true" sx={{ position: 'relative', height: 22, mt: 0.5, mx: 0.5 }}>
            {ticks.map((tick) => (
              <Typography
                key={tick.fraction}
                variant="caption"
                color="text.secondary"
                sx={{
                  position: 'absolute',
                  left: `${tick.fraction * 100}%`,
                  transform:
                    tick.fraction === 0
                      ? 'none'
                      : tick.fraction === 1
                        ? 'translateX(-100%)'
                        : 'translateX(-50%)',
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatTimeTick(tick.value)}
              </Typography>
            ))}
          </Box>
        )}
      </Box>

      {(status === 'failed' || status === 'skipped') && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {status === 'skipped'
            ? `${skippedReason} Highlighted windows still show the classification results.`
            : 'The waveform preview could not be decoded. Highlighted windows still show the classification results.'}
        </Typography>
      )}

      <Box
        aria-label="Timeline legend"
        sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mt: 1 }}
      >
        {presentSpecies.map((species) => (
          <Box
            key={species.key}
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
          >
            <Box
              aria-hidden="true"
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: species.color,
                flexShrink: 0,
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {species.label}
            </Typography>
          </Box>
        ))}

        {detectedCount > 0 && (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              aria-hidden="true"
              sx={{
                width: 14,
                height: 10,
                borderRadius: 0.5,
                backgroundColor: alpha(theme.palette.primary.main, 0.18),
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, 0.4),
              }}
            />
            <Typography variant="caption" color="text.secondary">
              Detected window
            </Typography>
          </Box>
        )}

        {unclassifiedStart !== null && (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              aria-hidden="true"
              sx={{
                width: 14,
                height: 10,
                borderRadius: 0.5,
                border: '1px dashed',
                borderColor: 'divider',
              }}
            />
            <Typography variant="caption" color="text.secondary">
              Not classified
            </Typography>
          </Box>
        )}
      </Box>

      <span id={instructionsId} style={hiddenLiveRegion}>
        Use the Left and Right arrow keys to move between 10-second windows. Home and End jump to
        the first or last window. Press Enter or Space to pin the readout, and Escape to dismiss it.
        The full results are also available in the table below.
      </span>
      <span
        aria-live="polite"
        data-testid="classification-waveform-announcement"
        style={hiddenLiveRegion}
      >
        {announcement}
      </span>
    </Box>
  );
}

ClassificationWaveform.propTypes = {
  slices: PropTypes.arrayOf(PropTypes.object).isRequired,
  audioFile: PropTypes.instanceOf(File),
  fileName: PropTypes.string,
};
