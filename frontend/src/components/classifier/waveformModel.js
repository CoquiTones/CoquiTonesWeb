import { getDetectedSpecies } from './species';

/** Number of amplitude samples kept for the waveform preview. */
export const WAVEFORM_BUCKET_COUNT = 4096;

const MIN_PEAK_REFERENCE = 0.005;

const finiteNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

/**
 * Turns API slices into timeline segments. The classifier works in complete
 * windows, so the audio after the last window is reported separately as an
 * unclassified tail.
 */
export const buildSliceSegments = (slices, duration = 0) => {
  const source = Array.isArray(slices) ? slices : [];
  const segments = source.map((slice, index) => {
    const start = finiteNumber(slice?.start_time) ?? 0;
    const end = finiteNumber(slice?.end_time) ?? start;
    const detectedSpecies = getDetectedSpecies(slice);
    return {
      index,
      start,
      end,
      duration: Math.max(0, end - start),
      species: detectedSpecies,
      hasDetection: detectedSpecies.length > 0,
    };
  });

  const lastEnd = segments.reduce((latest, segment) => Math.max(latest, segment.end), 0);
  const safeDuration = finiteNumber(duration) > 0 ? finiteNumber(duration) : lastEnd;
  const classifiedEnd = Math.min(lastEnd, safeDuration);
  const hasUnclassifiedTail = classifiedEnd < safeDuration - 1e-6;

  return {
    segments,
    duration: safeDuration,
    classifiedEnd,
    unclassifiedStart: hasUnclassifiedTail ? classifiedEnd : null,
  };
};

/**
 * Finds the classification window containing `time`. Returns `null` for the
 * unclassified tail at the end of the recording.
 */
export const findSegmentAtTime = (segments, time, classifiedEnd) => {
  const value = finiteNumber(time);
  if (!Array.isArray(segments) || value === null || value < 0) return null;
  if (Number.isFinite(classifiedEnd) && value >= classifiedEnd) return null;

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    if (value >= segment.start && value < segment.end) return segment;
  }
  return null;
};

/**
 * Downsamples decoded audio to the maximum absolute amplitude per bucket.
 * `channels` may be an array of channel arrays or a single channel array.
 */
export const computePeakBuckets = (channels, bucketCount = WAVEFORM_BUCKET_COUNT) => {
  const channelList = (Array.isArray(channels) ? channels : [channels]).filter(
    (channel) => channel && channel.length > 0,
  );
  const length = channelList.reduce((longest, channel) => Math.max(longest, channel.length), 0);
  const safeBucketCount = Math.floor(finiteNumber(bucketCount) ?? 0);

  if (!length || safeBucketCount < 1) return new Float32Array(0);

  const buckets = Math.min(safeBucketCount, length);
  const peaks = new Float32Array(buckets);
  const samplesPerBucket = length / buckets;

  for (let bucket = 0; bucket < buckets; bucket += 1) {
    const start = Math.floor(bucket * samplesPerBucket);
    const end = Math.max(
      start + 1,
      Math.min(length, Math.floor((bucket + 1) * samplesPerBucket)),
    );
    let peak = 0;

    for (let channelIndex = 0; channelIndex < channelList.length; channelIndex += 1) {
      const channel = channelList[channelIndex];
      const channelEnd = Math.min(end, channel.length);
      for (let sample = start; sample < channelEnd; sample += 1) {
        const amplitude = Math.abs(channel[sample]);
        if (amplitude > peak) peak = amplitude;
      }
    }

    peaks[bucket] = Number.isFinite(peak) ? peak : 0;
  }

  return peaks;
};

/**
 * Scales peaks so the loudest part of the recording fills the plot while a
 * single transient does not squash the rest of the waveform.
 */
export const normalizePeaks = (peaks) => {
  if (!peaks || peaks.length === 0) return new Float32Array(0);

  let maxPeak = 0;
  for (let index = 0; index < peaks.length; index += 1) {
    if (peaks[index] > maxPeak) maxPeak = peaks[index];
  }
  if (!(maxPeak > 0)) return new Float32Array(peaks.length);

  const sorted = Array.from(peaks).sort((left, right) => left - right);
  const percentileIndex = Math.min(
    sorted.length - 1,
    Math.floor(sorted.length * 0.99),
  );
  const percentile = sorted[percentileIndex] ?? maxPeak;
  const reference = Math.max(percentile, maxPeak * 0.35, MIN_PEAK_REFERENCE);

  const normalized = new Float32Array(peaks.length);
  for (let index = 0; index < peaks.length; index += 1) {
    normalized[index] = Math.min(1, peaks[index] / reference);
  }
  return normalized;
};

const formatSeconds = (value) => {
  const number = finiteNumber(value);
  if (number === null) return '—';
  return Number.isInteger(number) ? `${number}s` : `${number.toFixed(1)}s`;
};

/** Formats a slice range the same way the results table does. */
export const formatSliceRange = (start, end) => `${formatSeconds(start)} – ${formatSeconds(end)}`;
