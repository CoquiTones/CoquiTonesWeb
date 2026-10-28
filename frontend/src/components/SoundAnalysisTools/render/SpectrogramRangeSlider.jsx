import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import StyledSlider from '../../shared/StyledSlider';

const clampRange = (value, activeThumb, [min, max], minDistance) => (
  activeThumb === 0
    ? [Math.max(min, Math.min(value[0], value[1] - minDistance)), value[1]]
    : [value[0], Math.min(max, Math.max(value[1], value[0] + minDistance))]
);

/**
 * A range slider whose drag state is local to itself. Dragging only re-renders
 * this slider and its readout, not the entire settings panel.
 */
export default function SpectrogramRangeSlider({
  title,
  range,
  setRange,
  limits,
  minDistance,
  step,
  disabled = false,
  formatReadout,
  formatValue,
  getAriaLabel,
}) {
  const [temp, setTemp] = useState(range);

  useEffect(() => setTemp(range), [range]);

  const handleChange = (_event, newValue, activeThumb) => {
    setTemp(clampRange(newValue, activeThumb, limits, minDistance));
  };

  const handleCommit = (_event, newValue, activeThumb) => {
    setRange(clampRange(newValue, activeThumb, limits, minDistance));
  };

  return (
    <Box>
      <Typography component="p" variant="subtitle2" color="text.primary" sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {formatReadout(temp)}
      </Typography>
      <StyledSlider
        disableSwap
        disabled={disabled}
        sx={{ mt: 3 }}
        value={temp}
        onChange={handleChange}
        onChangeCommitted={handleCommit}
        valueLabelDisplay="auto"
        valueLabelFormat={formatValue}
        getAriaLabel={getAriaLabel}
        min={limits[0]}
        max={limits[1]}
        step={step}
      />
    </Box>
  );
}

SpectrogramRangeSlider.propTypes = {
  title: PropTypes.string.isRequired,
  range: PropTypes.arrayOf(PropTypes.number).isRequired,
  setRange: PropTypes.func.isRequired,
  limits: PropTypes.arrayOf(PropTypes.number).isRequired,
  minDistance: PropTypes.number.isRequired,
  step: PropTypes.number.isRequired,
  disabled: PropTypes.bool,
  formatReadout: PropTypes.func.isRequired,
  formatValue: PropTypes.func.isRequired,
  getAriaLabel: PropTypes.func.isRequired,
};
