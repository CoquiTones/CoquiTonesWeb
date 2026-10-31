import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { SPECIES } from '../../classifier/species';

/**
 * Eight-species presence checklist for the pinned window.
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

  return (
    <Box
      role="group"
      aria-label="Species annotations"
      aria-readonly={readOnly}
    >
      {readOnly && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          Read-only report
        </Typography>
      )}
      <Stack spacing={0}>
        {SPECIES.map((species) => (
          <FormControlLabel
            key={species.key}
            label={species.label}
            control={(
              <Checkbox
                size="small"
                checked={Boolean(window[species.key])}
                disabled={readOnly || disabled}
                onChange={(event) => onToggle?.(species.key, event.target.checked)}
                inputProps={{ 'aria-label': species.label }}
              />
            )}
            sx={{ mr: 0, minHeight: 40 }}
          />
        ))}
      </Stack>
    </Box>
  );
}

SpeciesAnnotationList.propTypes = {
  window: PropTypes.shape({
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
  }),
  readOnly: PropTypes.bool,
  disabled: PropTypes.bool,
  onToggle: PropTypes.func,
};
