import { describe, expect, it } from 'vitest';

import { SPECIES } from '../src/components/classifier/species';
import {
  buildSliceSegments,
  computePeakBuckets,
  findSegmentAtTime,
  formatSliceRange,
  normalizePeaks,
} from '../src/components/classifier/waveformModel';

const makeSlice = (start, end, keys = []) => ({
  start_time: start,
  end_time: end,
  ...Object.fromEntries(
    SPECIES.map((species) => [species.key, keys.includes(species.key) ? 1 : 0]),
  ),
});

describe('classification waveform model', () => {
  describe('buildSliceSegments', () => {
    it('maps detected flags to species and keeps multiple matches', () => {
      const slices = [
        makeSlice(0, 10, ['coqui']),
        makeSlice(10, 20, ['coqui', 'portoricensis']),
      ];

      const result = buildSliceSegments(slices, 25);

      expect(result.segments.map((segment) => segment.species.map((entry) => entry.key))).toEqual([
        ['coqui'],
        ['coqui', 'portoricensis'],
      ]);
      expect(result.segments[1].hasDetection).toBe(true);
      expect(result.duration).toBe(25);
      expect(result.classifiedEnd).toBe(20);
      expect(result.unclassifiedStart).toBe(20);
    });

    it('marks a window without detections', () => {
      const result = buildSliceSegments([makeSlice(0, 10, [])], 10);

      expect(result.segments[0].hasDetection).toBe(false);
      expect(result.segments[0].species).toEqual([]);
      expect(result.unclassifiedStart).toBeNull();
    });

    it('falls back to the last window when the duration is unknown', () => {
      const slices = [makeSlice(0, 10, ['coqui']), makeSlice(10, 20, ['gryllus'])];
      const result = buildSliceSegments(slices, 0);

      expect(result.duration).toBe(20);
      expect(result.classifiedEnd).toBe(20);
      expect(result.unclassifiedStart).toBeNull();
    });

    it('trims classification coverage to the decoded duration', () => {
      const slices = [makeSlice(0, 10, ['coqui']), makeSlice(10, 20, ['gryllus'])];
      const result = buildSliceSegments(slices, 15);

      expect(result.duration).toBe(15);
      expect(result.classifiedEnd).toBe(15);
      expect(result.unclassifiedStart).toBeNull();
    });
  });

  describe('findSegmentAtTime', () => {
    const { segments, classifiedEnd } = buildSliceSegments(
      [makeSlice(0, 10, ['coqui']), makeSlice(10, 20, ['gryllus'])],
      25,
    );

    it('returns the slice containing a time', () => {
      expect(findSegmentAtTime(segments, 0, classifiedEnd)?.index).toBe(0);
      expect(findSegmentAtTime(segments, 9.99, classifiedEnd)?.index).toBe(0);
      expect(findSegmentAtTime(segments, 10, classifiedEnd)?.index).toBe(1);
    });

    it('returns null outside the classified range', () => {
      expect(findSegmentAtTime(segments, -1, classifiedEnd)).toBeNull();
      expect(findSegmentAtTime(segments, 20, classifiedEnd)).toBeNull();
      expect(findSegmentAtTime(segments, 24, classifiedEnd)).toBeNull();
    });
  });

  describe('computePeakBuckets', () => {
    it('keeps the maximum absolute sample per bucket', () => {
      const peaks = computePeakBuckets([Float32Array.from([0, 0.5, -1, 0.25])], 2);
      expect(Array.from(peaks)).toEqual([0.5, 1]);
    });

    it('combines channels without allocating a mixdown buffer', () => {
      const peaks = Array.from(
        computePeakBuckets(
          [Float32Array.from([0.1, 0.2]), Float32Array.from([0.8, 0.05])],
          2,
        ),
      );
      expect(peaks[0]).toBeCloseTo(0.8);
      expect(peaks[1]).toBeCloseTo(0.2);
    });

    it('returns an empty array without samples', () => {
      expect(computePeakBuckets([], 4096)).toHaveLength(0);
      expect(computePeakBuckets([new Float32Array(0)], 4096)).toHaveLength(0);
    });

    it('caps the bucket count at the number of samples', () => {
      const peaks = Array.from(computePeakBuckets([Float32Array.from([0.4, 0.9])], 4));
      expect(peaks).toHaveLength(2);
      expect(peaks[0]).toBeCloseTo(0.4);
      expect(peaks[1]).toBeCloseTo(0.9);
    });
  });

  describe('normalizePeaks', () => {
    it('leaves silence flat', () => {
      expect(Array.from(normalizePeaks(new Float32Array([0, 0, 0])))).toEqual([0, 0, 0]);
    });

    it('scales the loudest samples to the top of the plot', () => {
      const normalized = normalizePeaks(new Float32Array([0.25, 0.5]));
      expect(normalized[0]).toBeCloseTo(0.5);
      expect(normalized[1]).toBeCloseTo(1);
    });

    it('does not divide by zero or return values above one', () => {
      const normalized = normalizePeaks(new Float32Array([0.005, 0.01, 0.02]));
      normalized.forEach((value) => {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeLessThanOrEqual(1);
      });
      expect(Math.max(...normalized)).toBeCloseTo(1);
    });
  });

  it('formats slice ranges like the table', () => {
    expect(formatSliceRange(0, 10)).toBe('0s – 10s');
    expect(formatSliceRange(60, 70)).toBe('60s – 70s');
    expect(formatSliceRange(10.5, 20.5)).toBe('10.5s – 20.5s');
  });
});
