import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';

/**
 * Plays the loaded recording through a band-pass filter that follows the
 * visible spectrogram window, so the audio matches what is on screen.
 *
 * Playback time is handled inside the element (rather than lifted to React
 * state) so time updates do not re-render the spectrogram while audio plays.
 */
export default function SoundPlayer({ file, yrange, xrange, audioRef: externalAudioRef = null }) {
  const [audioUrl, setAudioUrl] = useState(null);
  const localAudioRef = useRef(null);
  const audioRef = externalAudioRef ?? localAudioRef;
  const audioContextRef = useRef(null);
  const filterRef = useRef(null);

  useEffect(() => {
    if (!file) {
      setAudioUrl(null);
      return undefined;
    }

    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const applyFilterWindow = useCallback((filter) => {
    const [low, high] = yrange ?? [];
    if (!filter || !Number.isFinite(low) || !Number.isFinite(high) || high <= low) return;

    const center = (low + high) / 2;
    filter.type = 'bandpass';
    filter.frequency.value = center;
    filter.Q.value = center / (high - low);
  }, [yrange]);

  useEffect(() => {
    applyFilterWindow(filterRef.current);
  }, [applyFilterWindow]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !xrange) return;
    if (audio.currentTime < xrange[0] || audio.currentTime > xrange[1]) {
      audio.currentTime = xrange[0];
    }
  }, [audioRef, audioUrl, xrange]);

  // timeupdate fires roughly four times a second; nudge the playhead back at
  // the visible-window boundary promptly so the line does not sit outside the
  // plot between events.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !xrange) return undefined;

    const enforceVisibleLoop = () => {
      if (audio.paused) return;
      if (audio.currentTime < xrange[0] || audio.currentTime > xrange[1]) {
        audio.currentTime = xrange[0];
      }
    };
    const interval = setInterval(enforceVisibleLoop, 100);
    return () => clearInterval(interval);
  }, [audioRef, audioUrl, xrange]);

  useEffect(
    () => () => {
      audioContextRef.current?.close?.();
      audioContextRef.current = null;
    },
    [],
  );

  const ensureAudioChain = () => {
    if (audioContextRef.current || !audioRef.current) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      const context = new AudioContextClass();
      const source = context.createMediaElementSource(audioRef.current);
      const filter = context.createBiquadFilter();
      applyFilterWindow(filter);
      source.connect(filter);
      filter.connect(context.destination);
      audioContextRef.current = context;
      filterRef.current = filter;
    } catch (error) {
      // Audio still plays through the element if Web Audio is unavailable.
      console.warn('Could not initialise the audio filter', error);
    }
  };

  const handlePlay = async () => {
    ensureAudioChain();
    await audioContextRef.current?.resume?.();
  };

  const handleTimeUpdate = (event) => {
    const audio = event.currentTarget;
    if (!xrange) return;
    if (audio.currentTime < xrange[0] || audio.currentTime > xrange[1]) {
      audio.currentTime = xrange[0];
    }
  };

  if (!file || !audioUrl) return null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        controls
        loop
        preload="metadata"
        aria-label="Audio player for the loaded recording"
        style={{ height: 40, maxWidth: 280 }}
      />
    </Box>
  );
}

SoundPlayer.propTypes = {
  file: PropTypes.instanceOf(File),
  yrange: PropTypes.arrayOf(PropTypes.number),
  xrange: PropTypes.arrayOf(PropTypes.number),
  audioRef: PropTypes.shape({
    current: PropTypes.object,
  }),
};
