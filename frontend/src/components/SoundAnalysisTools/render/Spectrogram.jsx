import { memo, useEffect } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import SpectrogramLegend from './SpectrogramLegend';
import SpectrogramPlot from './SpectrogramPlot';
import { useSpectrogram } from '../processing/useSpectrogram';
import { DEFAULT_DISPLAY_MAX_DB, DEFAULT_DISPLAY_MIN_DB } from '../processing/spectrogramModel';

const DEFAULT_DISPLAY_RANGE = [DEFAULT_DISPLAY_MIN_DB, DEFAULT_DISPLAY_MAX_DB];

const Spectrogram = memo(function Spectrogram({
  audioFile,
  timeRange,
  frequencyRange,
  colorscale,
  displayRange = DEFAULT_DISPLAY_RANGE,
  onProcessingChange,
}) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { status, progress, error, analysis, retry } = useSpectrogram({ audioFile });

  useEffect(() => {
    onProcessingChange?.({ status, progress, error });
  }, [status, progress, error, onProcessingChange]);

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
          timeRange={timeRange}
          frequencyRange={frequencyRange}
          colorscale={colorscale}
          displayRange={displayRange}
          status={status}
          progress={progress}
          error={error}
          onRetry={retry}
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
});

// The audio player no longer re-renders the page while playing, but memoising
// the plot also keeps unrelated parent updates from reconciling this subtree.
Spectrogram.propTypes = {
  audioFile: PropTypes.instanceOf(File),
  timeRange: PropTypes.arrayOf(PropTypes.number).isRequired,
  frequencyRange: PropTypes.arrayOf(PropTypes.number).isRequired,
  colorscale: PropTypes.string.isRequired,
  displayRange: PropTypes.arrayOf(PropTypes.number),
  onProcessingChange: PropTypes.func,
};

export default Spectrogram;
