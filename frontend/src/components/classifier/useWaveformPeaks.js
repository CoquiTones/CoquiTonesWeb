import { useEffect, useState } from 'react';

import { estimateDecodedBytes } from '../SoundAnalysisTools/processing/useSpectrogram';
import { MAX_DECODED_BYTES } from '../SoundAnalysisTools/processing/spectrogramModel';
import {
  WAVEFORM_BUCKET_COUNT,
  computePeakBuckets,
  normalizePeaks,
} from './waveformModel';

const IDLE_STATE = {
  status: 'idle',
  peaks: null,
  duration: 0,
  error: null,
  skippedReason: null,
};

/**
 * Decodes a recording locally and reduces it to a small amplitude envelope.
 * The decoded samples are intentionally not kept in state: only the peaks are
 * needed to paint the timeline.
 */
export const useWaveformPeaks = (audioFile) => {
  const [state, setState] = useState(IDLE_STATE);

  useEffect(() => {
    if (!audioFile) {
      setState(IDLE_STATE);
      return undefined;
    }

    let cancelled = false;
    const AudioContextClass =
      typeof window === 'undefined'
        ? null
        : window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      setState({
        ...IDLE_STATE,
        status: 'failed',
        error: 'Audio decoding is unavailable in this browser.',
      });
      return undefined;
    }

    setState({
      ...IDLE_STATE,
      status: 'decoding',
    });

    const decode = async () => {
      let context;
      try {
        const estimatedBytes = await estimateDecodedBytes(audioFile);
        if (cancelled) return;

        if (estimatedBytes > MAX_DECODED_BYTES) {
          setState({
            ...IDLE_STATE,
            status: 'skipped',
            skippedReason: 'This recording is too large to preview in the browser.',
          });
          return;
        }

        context = new AudioContextClass();
        const arrayBuffer = await audioFile.arrayBuffer();
        const audioBuffer = await context.decodeAudioData(arrayBuffer);
        if (cancelled) return;

        if (!audioBuffer || audioBuffer.length === 0 || audioBuffer.numberOfChannels === 0) {
          throw new Error('The recording does not contain any audio frames.');
        }

        const channels = [];
        for (let index = 0; index < audioBuffer.numberOfChannels; index += 1) {
          channels.push(audioBuffer.getChannelData(index));
        }

        const peaks = normalizePeaks(
          computePeakBuckets(channels, WAVEFORM_BUCKET_COUNT),
        );
        if (cancelled) return;

        setState({
          status: 'ready',
          peaks,
          duration: audioBuffer.duration,
          error: null,
          skippedReason: null,
        });
      } catch (error) {
        if (cancelled) return;
        setState({
          ...IDLE_STATE,
          status: 'failed',
          error: error?.message ?? 'The waveform could not be decoded.',
        });
      } finally {
        await context?.close?.();
      }
    };

    decode();

    return () => {
      cancelled = true;
    };
  }, [audioFile]);

  return state;
};

export default useWaveformPeaks;
