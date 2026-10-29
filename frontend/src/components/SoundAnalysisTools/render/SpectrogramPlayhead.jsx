import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';

import { timeToX } from '../processing/spectrogramTransforms';

/**
 * A vertical playhead driven imperatively from the audio element. Keeping the
 * time out of React state avoids re-rendering the spectrogram on every audio
 * frame while still following play, pause, seek, and the visible-window loop.
 */
export default function SpectrogramPlayhead({ audioRef, timeRange, plotRect }) {
  const lineRef = useRef(null);
  const lastXRef = useRef(null);

  useEffect(() => {
    const line = lineRef.current;
    if (!line) return undefined;

    const update = () => {
      const audio = audioRef?.current;
      if (!audio) {
        line.style.opacity = '0';
        return;
      }

      const time = audio.currentTime;
      const visible = Number.isFinite(time) && time >= timeRange[0] && time <= timeRange[1];
      line.style.opacity = visible ? '1' : '0';
      if (!visible) return;

      const x = timeToX(time, timeRange, plotRect);
      if (x !== lastXRef.current) {
        line.style.transform = `translate3d(${x}px, 0, 0)`;
        lastXRef.current = x;
      }
    };

    update();
    let frameId = null;
    const tick = () => {
      update();
      frameId = requestAnimationFrame(tick);
    };
    if (typeof requestAnimationFrame === 'function') {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      if (frameId !== null && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(frameId);
      }
    };
  }, [
    audioRef,
    timeRange[0],
    timeRange[1],
    plotRect.left,
    plotRect.top,
    plotRect.width,
    plotRect.height,
  ]);

  return (
    <Box
      ref={lineRef}
      data-testid="spectrogram-playhead"
      aria-hidden="true"
      sx={{
        position: 'absolute',
        top: plotRect.top,
        left: 0,
        width: 2,
        height: plotRect.height,
        bgcolor: 'primary.main',
        boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.45)',
        opacity: 0,
        pointerEvents: 'none',
        transform: 'translate3d(0, 0, 0)',
        willChange: 'transform, opacity',
        zIndex: 2,
      }}
    />
  );
}

SpectrogramPlayhead.propTypes = {
  audioRef: PropTypes.shape({
    current: PropTypes.object,
  }),
  timeRange: PropTypes.arrayOf(PropTypes.number).isRequired,
  plotRect: PropTypes.shape({
    left: PropTypes.number.isRequired,
    top: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  }).isRequired,
};
