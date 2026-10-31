import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { SPECIES } from '../../classifier/species';

const speciesShape = {
  index: PropTypes.number,
  start: PropTypes.number,
  end: PropTypes.number,
  coqui: PropTypes.bool,
  wightmanae: PropTypes.bool,
  gryllus: PropTypes.bool,
  portoricensis: PropTypes.bool,
  unicolor: PropTypes.bool,
  hedricki: PropTypes.bool,
  locustus: PropTypes.bool,
  richmondi: PropTypes.bool,
};

/**
 * Species presence for the pinned window.
 *
 * Read-only mode renders plain status text instead of disabled checkboxes, so
 * editing controls only appear in Editor mode.
 */
export default function SpeciesAnnotationList({
  window = null,
  readOnly = false,
  disabled = false,
  onToggle,
}) {
  if (!window) {
    return (
      <Typography variant="body2" color="text.secondary">
        Select a ten-second window to see its species annotations.
      </Typography>
    );
  }

  if (readOnly) {
    return (
      <Box role="group" aria-label="Species values">
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Read-only report
        </Typography>
        <Stack divider={<Divider flexItem />} spacing={0.5}>
          {SPECIES.map((species) => {
            const present = Boolean(window[species.key]);
            return (
              <Stack
                key={species.key}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={2}
                sx={{ minHeight: 32, py: 0.25 }}
              >
                <Typography variant="body2" color="text.primary">
                  {species.label}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: present ? 'success.main' : 'text.secondary',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {present ? 'Present' : 'Absent'}
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      </Box>
    );
  }

  return (
    <Box role="group" aria-label="Species annotations">
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Mark each species present in this ten-second window.
      </Typography>
      <Stack spacing={0}>
        {SPECIES.map((species) => (
          <FormControlLabel
            key={species.key}
            label={species.label}
            control={(
              <Checkbox
                size="small"
                checked={Boolean(window[species.key])}
                disabled={disabled}
                onChange={(event) => onToggle?.(species.key, event.target.checked)}
                inputProps={{ 'aria-label': species.label }}
                sx={{ minWidth: 44, minHeight: 44 }}
              />
            )}
            sx={{ mr: 0, minHeight: 44 }}
          />
        ))}
      </Stack>
    </Box>
  );
}

SpeciesAnnotationList.propTypes = {
  window: PropTypes.shape(speciesShape),
  readOnly: PropTypes.bool,
  disabled: PropTypes.bool,
  onToggle: PropTypes.func,
};
