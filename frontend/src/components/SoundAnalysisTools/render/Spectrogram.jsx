import { forwardRef, memo, useEffect, useImperativeHandle, useMemo } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import SpectrogramLegend from './SpectrogramLegend';
import SpectrogramPlot from './SpectrogramPlot';
import { useSpectrogram } from '../processing/useSpectrogram';
import {
  createSpectrogramImage,
  downloadSpectrogramImage,
  spectrogramFileName,
} from '../processing/spectrogramExport';
import {
  DEFAULT_DISPLAY_MAX_DB,
  DEFAULT_DISPLAY_MIN_DB,
  DEFAULT_MAX_BINS,
  DEFAULT_MAX_FRAMES,
  clampRange,
} from '../processing/spectrogramModel';

const DEFAULT_DISPLAY_RANGE = [DEFAULT_DISPLAY_MIN_DB, DEFAULT_DISPLAY_MAX_DB];

const Spectrogram = memo(forwardRef(function Spectrogram({
  audioFile,
  timeRange,
  frequencyRange,
  colorscale,
  displayRange = DEFAULT_DISPLAY_RANGE,
  maxFrames = DEFAULT_MAX_FRAMES,
  maxBins = DEFAULT_MAX_BINS,
  onProcessingChange,
  audioRef = null,
}, ref) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const {
    status,
    progress,
    error,
    analysis,
    refining = false,
    refineProgress = null,
    rerenderVisible,
    retry,
  } = useSpectrogram({
    audioFile,
    timeRange,
    frequencyRange,
    maxFrames,
    maxBins,
  });

  useEffect(() => {
    onProcessingChange?.({ status, progress, error, refining });
  }, [status, progress, error, refining, onProcessingChange]);

  const safeTimeRange = useMemo(
    () => (analysis
      ? clampRange(timeRange, 0, analysis.duration, analysis.timeResolution || 0)
      : timeRange),
    [analysis, timeRange],
  );
  const safeFrequencyRange = useMemo(
    () => (analysis
      ? clampRange(frequencyRange, 0, analysis.nyquist, analysis.frequencyResolution || 0)
      : frequencyRange),
    [analysis, frequencyRange],
  );
  const analysisCoversTime = Boolean(
    analysis
    && analysis.timeRange
    && analysis.timeRange[0] <= safeTimeRange[0] + 1e-6
    && analysis.timeRange[1] >= safeTimeRange[1] - 1e-6,
  );
  const plotTimeRange = analysisCoversTime
    ? safeTimeRange
    : (analysis?.timeRange ?? safeTimeRange);
  // The matrix is always full-band, so frequency zoom is an instant crop.
  const plotFrequencyRange = safeFrequencyRange;

  useImperativeHandle(ref, () => ({
    exportScreenshot: () => {
      if (!analysis) return false;
      const canvas = createSpectrogramImage({
        analysis,
        timeRange: plotTimeRange,
        frequencyRange: plotFrequencyRange,
        colorscale,
        displayRange,
        fileName: audioFile?.name ?? 'spectrogram',
        theme,
      });
      if (!canvas) return false;
      return downloadSpectrogramImage(
        canvas,
        spectrogramFileName(audioFile?.name, plotTimeRange),
      );
    },
    rerenderVisibleSegment: rerenderVisible,
  }), [
    analysis,
    plotTimeRange,
    plotFrequencyRange,
    colorscale,
    displayRange,
    audioFile,
    theme,
    rerenderVisible,
    ref,
  ]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isDesktop ? 'row' : 'column',
        gap: 2,
        width: '100%',
        height: '100%',
        minHeight: 360,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0, minHeight: 360 }}>
        <SpectrogramPlot
          analysis={analysis}
          fileName={audioFile?.name ?? ''}
          timeRange={plotTimeRange}
          frequencyRange={plotFrequencyRange}
          colorscale={colorscale}
          displayRange={displayRange}
          status={status}
          progress={progress}
          refining={refining}
          refineProgress={refineProgress}
          error={error}
          onRetry={retry}
          audioRef={audioRef}
        />
      </Box>
      {analysis && (
        <Box sx={{ flexShrink: 0, alignSelf: isDesktop ? 'stretch' : 'stretch' }}>
          <SpectrogramLegend
            colorscale={colorscale}
            displayRange={displayRange}
            orientation={isDesktop ? 'vertical' : 'horizontal'}
          />
        </Box>
      )}
    </Box>
  );
}));

// The audio player no longer re-renders the page while playing, but memoising
// the plot also keeps unrelated parent updates from reconciling this subtree.
Spectrogram.propTypes = {
  audioFile: PropTypes.instanceOf(File),
  timeRange: PropTypes.arrayOf(PropTypes.number).isRequired,
  frequencyRange: PropTypes.arrayOf(PropTypes.number).isRequired,
  colorscale: PropTypes.string.isRequired,
  displayRange: PropTypes.arrayOf(PropTypes.number),
  maxFrames: PropTypes.number,
  maxBins: PropTypes.number,
  onProcessingChange: PropTypes.func,
  audioRef: PropTypes.shape({
    current: PropTypes.object,
  }),
};

export default Spectrogram;
