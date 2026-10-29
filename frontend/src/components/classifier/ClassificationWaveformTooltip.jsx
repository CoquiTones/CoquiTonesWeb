import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { formatSliceRange } from './waveformModel';

const TOOLTIP_WIDTH = 232;
const EDGE_MARGIN = 8;
const POINTER_OFFSET = 14;
const ROW_HEIGHT = 18;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const tooltipHeight = (readout) => {
  if (readout.kind === 'unclassified') return 104;
  const speciesCount = Math.max(1, readout.segment?.species?.length ?? 0);
  return 82 + speciesCount * ROW_HEIGHT;
};

/**
 * Readout for the classification timeline. It stays inside the plot and flips
 * away from the edges, mirroring the spectrogram tooltip behaviour.
 */
export default function ClassificationWaveformTooltip({ readout = null, plotRect }) {
  if (!readout || !plotRect) return null;

  const height = tooltipHeight(readout);
  const minLeft = EDGE_MARGIN;
  const maxLeft = Math.max(minLeft, plotRect.width - TOOLTIP_WIDTH - EDGE_MARGIN);
  const minTop = EDGE_MARGIN;
  const maxTop = Math.max(minTop, plotRect.height - height - EDGE_MARGIN);

  let left = readout.pointer.x + POINTER_OFFSET;
  if (left > maxLeft) left = readout.pointer.x - TOOLTIP_WIDTH - POINTER_OFFSET;
  left = clamp(left, minLeft, maxLeft);

  let top = readout.pointer.y - height - POINTER_OFFSET;
  if (top < minTop) top = readout.pointer.y + POINTER_OFFSET;
  top = clamp(top, minTop, maxTop);

  const range = readout.kind === 'segment'
    ? formatSliceRange(readout.segment.start, readout.segment.end)
    : formatSliceRange(readout.start, readout.end);
  const species = readout.kind === 'segment' ? readout.segment.species ?? [] : [];

  return (
    <Paper
      role="tooltip"
      elevation={8}
      style={{ left, top }}
      sx={{
        position: 'absolute',
        width: TOOLTIP_WIDTH,
        minHeight: height,
        p: 1.25,
        pointerEvents: 'none',
        zIndex: 4,
        borderColor: 'divider',
      }}
    >
      <Typography component="p" variant="caption" color="text.secondary" sx={{ mb: 0.25 }}>
        {readout.kind === 'segment' ? 'Time slice' : 'Unclassified audio'}
      </Typography>
      <Typography
        component="p"
        variant="subtitle2"
        sx={{ fontVariantNumeric: 'tabular-nums', mb: 0.75 }}
      >
        {range}
      </Typography>

      {readout.kind === 'unclassified' ? (
        <Typography component="p" variant="caption" color="text.secondary">
          The classifier only analyses complete 10-second windows. This part of the recording was
          not classified.
        </Typography>
      ) : species.length > 0 ? (
        <>
          <Typography component="p" variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
            Species detected
          </Typography>
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 0.5 }}>
            {species.map((entry) => (
              <Box
                component="li"
                key={entry.key}
                sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
              >
                <Box
                  aria-hidden="true"
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: entry.color,
                    flexShrink: 0,
                  }}
                />
                <Typography variant="caption" color="text.primary">
                  {entry.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </>
      ) : (
        <Typography component="p" variant="caption" color="text.secondary">
          No species detected
        </Typography>
      )}
    </Paper>
  );
}

ClassificationWaveformTooltip.propTypes = {
  readout: PropTypes.shape({
    kind: PropTypes.oneOf(['segment', 'unclassified']).isRequired,
    segment: PropTypes.shape({
      start: PropTypes.number.isRequired,
      end: PropTypes.number.isRequired,
      species: PropTypes.arrayOf(
        PropTypes.shape({
          key: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
          color: PropTypes.string.isRequired,
        }),
      ).isRequired,
    }),
    start: PropTypes.number,
    end: PropTypes.number,
    pointer: PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired,
    }).isRequired,
    keyboardMode: PropTypes.bool,
  }),
  plotRect: PropTypes.shape({
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  }).isRequired,
};
