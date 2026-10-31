import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

/**
 * Switch between the read-only report and the editable annotation draft.
 */
export default function AnnotationModeToggle({
  mode,
  onChange,
  disabled = false,
}) {
  return (
    <Box>
      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        value={mode}
        disabled={disabled}
        onChange={(_event, nextMode) => {
          if (nextMode) onChange?.(nextMode);
        }}
        aria-label="Annotation mode"
        sx={{ '& .MuiToggleButton-root': { minHeight: 40 } }}
      >
        <ToggleButton value="reported">
          Reported
        </ToggleButton>
        <ToggleButton value="editor">
          Editor
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}

AnnotationModeToggle.propTypes = {
  mode: PropTypes.oneOf(['reported', 'editor']).isRequired,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
};
