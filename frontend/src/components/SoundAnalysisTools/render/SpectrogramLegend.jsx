import { useMemo } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { buildGradientCss, buildLut } from '../processing/spectrogramColormap';
import { formatDbfs } from '../processing/spectrogramFormat';
import { makeTicks } from '../processing/spectrogramTransforms';

export default function SpectrogramLegend({
  colorscale,
  displayRange,
  orientation = 'vertical',
}) {
  const [displayMinDb, displayMaxDb] = displayRange;
  const lut = useMemo(() => buildLut(colorscale), [colorscale]);
  const gradient = useMemo(
    () => buildGradientCss(lut, orientation === 'vertical' ? 'to top' : 'to right'),
    [lut, orientation],
  );
  const ticks = makeTicks(displayMinDb, displayMaxDb, 5);
  const isVertical = orientation === 'vertical';

  return (
    <Box
      component="figure"
      role="group"
      aria-label={`Intensity scale from ${displayMinDb} to ${displayMaxDb} dBFS`}
      sx={{ m: 0, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}
    >
      <Typography component="figcaption" variant="subtitle2" color="text.primary">
        Intensity
      </Typography>

      {isVertical ? (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'stretch' }}>
          <Box
            data-testid="spectrogram-legend-gradient"
            sx={{
              width: 14,
              height: 200,
              flexShrink: 0,
              background: gradient,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
            }}
          />
          <Box
            sx={{
              height: 200,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {ticks
              .slice()
              .reverse()
              .map((tick) => (
                <Typography
                  key={tick.fraction}
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}
                >
                  {formatDbfs(tick.value)}
                </Typography>
              ))}
          </Box>
        </Box>
      ) : (
        <Box sx={{ width: '100%', minWidth: 220 }}>
          <Box
            data-testid="spectrogram-legend-gradient"
            sx={{
              width: '100%',
              height: 14,
              background: gradient,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            {ticks.map((tick) => (
              <Typography
                key={tick.fraction}
                variant="caption"
                color="text.secondary"
                sx={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatDbfs(tick.value)}
              </Typography>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

SpectrogramLegend.propTypes = {
  colorscale: PropTypes.string.isRequired,
  displayRange: PropTypes.arrayOf(PropTypes.number).isRequired,
  orientation: PropTypes.oneOf(['vertical', 'horizontal']),
};
