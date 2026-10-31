import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { formatDbfs, formatFrequency, formatTime } from '../processing/spectrogramFormat';

const TOOLTIP_WIDTH = 190;
const TOOLTIP_HEIGHT = 112;
const EDGE_MARGIN = 8;
const POINTER_OFFSET = 14;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function SpectrogramTooltip({
  cell = null,
  pointer = null,
  plotRect,
  keyboardMode = false,
  window = null,
}) {
  if (!cell || !pointer) return null;

  const minLeft = plotRect.left + EDGE_MARGIN;
  const maxLeft = plotRect.left + plotRect.width - TOOLTIP_WIDTH - EDGE_MARGIN;
  const minTop = plotRect.top + EDGE_MARGIN;
  const maxTop = plotRect.top + plotRect.height - TOOLTIP_HEIGHT - EDGE_MARGIN;

  let left = pointer.x + POINTER_OFFSET;
  if (left > maxLeft) left = pointer.x - TOOLTIP_WIDTH - POINTER_OFFSET;
  left = clamp(left, minLeft, Math.max(minLeft, maxLeft));

  let top = pointer.y - TOOLTIP_HEIGHT - POINTER_OFFSET;
  if (top < minTop) top = pointer.y + POINTER_OFFSET;
  top = clamp(top, minTop, Math.max(minTop, maxTop));

  return (
    <Paper
      role="status"
      aria-live={keyboardMode ? 'polite' : 'off'}
      elevation={8}
      style={{ left, top }}
      sx={{
        position: 'absolute',
        width: TOOLTIP_WIDTH,
        minHeight: TOOLTIP_HEIGHT,
        p: 1.25,
        pointerEvents: 'none',
        zIndex: 3,
        borderColor: 'divider',
      }}
    >
      <Typography component="p" variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
        Spectrogram readout
      </Typography>
      {window && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
          Window {window.index + 1} · {formatTime(window.start)} – {formatTime(window.end)}
        </Typography>
      )}
      <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 1.5, rowGap: 0.25 }}>
        <Typography component="dt" variant="caption" color="text.secondary">Time</Typography>
        <Typography component="dd" variant="caption" sx={{ m: 0, fontVariantNumeric: 'tabular-nums' }}>
          {formatTime(cell.time)}
        </Typography>
        <Typography component="dt" variant="caption" color="text.secondary">Frequency</Typography>
        <Typography component="dd" variant="caption" sx={{ m: 0, fontVariantNumeric: 'tabular-nums' }}>
          {formatFrequency(cell.frequency)}
        </Typography>
        <Typography component="dt" variant="caption" color="text.secondary">Intensity</Typography>
        <Typography component="dd" variant="caption" sx={{ m: 0, fontVariantNumeric: 'tabular-nums' }}>
          {formatDbfs(cell.dbfs)}
        </Typography>
      </Box>
    </Paper>
  );
}

SpectrogramTooltip.propTypes = {
  cell: PropTypes.shape({
    time: PropTypes.number,
    frequency: PropTypes.number,
    dbfs: PropTypes.number,
  }),
  pointer: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }),
  plotRect: PropTypes.shape({
    left: PropTypes.number.isRequired,
    top: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  }).isRequired,
  keyboardMode: PropTypes.bool,
  window: PropTypes.shape({
    index: PropTypes.number,
    start: PropTypes.number,
    end: PropTypes.number,
  }),
};


