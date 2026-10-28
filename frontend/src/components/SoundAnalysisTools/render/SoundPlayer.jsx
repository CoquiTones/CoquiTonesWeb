import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';

/**
 * Plays the loaded recording through a band-pass filter that follows the
 * visible spectrogram window, so the audio matches what is on screen.
 */
export default function SoundPlayer({ file, setCurrentTime, yrange, xrange, currentTime }) {
  const [audioUrl, setAudioUrl] = useState(null);
  const audioRef = useRef(null);
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

  const applyFilterWindow = (filter) => {
    const [low, high] = yrange ?? [];
    if (!filter || !Number.isFinite(low) || !Number.isFinite(high) || high <= low) return;

    const center = (low + high) / 2;
    filter.type = 'bandpass';
    filter.frequency.value = center;
    filter.Q.value = center / (high - low);
  };

  useEffect(() => {
    applyFilterWindow(filterRef.current);
  }, [yrange]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !xrange || currentTime <= xrange[1]) return;
    audio.currentTime = xrange[0];
  }, [currentTime, xrange]);

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

  if (!file || !audioUrl) return null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={(event) => setCurrentTime(event.target.currentTime)}
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
