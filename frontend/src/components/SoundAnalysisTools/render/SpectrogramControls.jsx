import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';

import StyledSlider from '../../shared/StyledSlider';

const MIN_FREQUENCY_DISTANCE = 1000;
const MIN_TIME_DISTANCE_SECONDS = 5;

const clampTimeRange = (value, activeThumb, [min, max]) => (
  activeThumb === 0
    ? [Math.max(min, Math.min(value[0], value[1] - MIN_TIME_DISTANCE_SECONDS)), value[1]]
    : [value[0], Math.min(max, Math.max(value[1], value[0] + MIN_TIME_DISTANCE_SECONDS))]
);

const clampFrequencyRange = (value, activeThumb, [min, max]) => (
  activeThumb === 0
    ? [Math.max(min, Math.min(value[0], value[1] - MIN_FREQUENCY_DISTANCE)), value[1]]
    : [value[0], Math.min(max, Math.max(value[1], value[0] + MIN_FREQUENCY_DISTANCE))]
);

/**
 * Spectrogram display controls: colour scale plus the visible time and
 * frequency window.
 *
 * The sliders update local state while dragging so the thumb and value label
 * stay responsive, but the parent range (which redraws the plot) is only
 * updated on commit. Changing a range never re-runs the audio analysis.
 */
export default function SpectrogramControls({
  colorscale,
  setColorscale,
  xrange,
  setXrange,
  yrange,
  setYrange,
  defaultX,
  defaultY,
  disabled = false,
}) {
  const [tempX, setTempX] = useState(xrange);
  const [tempY, setTempY] = useState(yrange);

  useEffect(() => setTempX(xrange), [xrange]);
  useEffect(() => setTempY(yrange), [yrange]);

  const handleXChange = (_event, newValue, activeThumb) => {
    setTempX(clampTimeRange(newValue, activeThumb, defaultX));
  };

  const handleXCommit = (_event, newValue, activeThumb) => {
    setXrange(clampTimeRange(newValue, activeThumb, defaultX));
  };

  const handleYChange = (_event, newValue, activeThumb) => {
    setTempY(clampFrequencyRange(newValue, activeThumb, defaultY));
  };

  const handleYCommit = (_event, newValue, activeThumb) => {
    setYrange(clampFrequencyRange(newValue, activeThumb, defaultY));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <FormControl fullWidth size="small" disabled={disabled}>
        <InputLabel id="colorscale-label">Color scale</InputLabel>
        <Select
          labelId="colorscale-label"
          value={colorscale}
          label="Color scale"
          disabled={disabled}
          onChange={(event) => setColorscale(event.target.value)}
        >
          <MenuItem value="RdBu">Red–blue</MenuItem>
          <MenuItem value="Portland">Portland</MenuItem>
          <MenuItem value="Picnic">Picnic</MenuItem>
          <MenuItem value="jet">Jet</MenuItem>
          <MenuItem value="hot">Hot</MenuItem>
          <MenuItem value="Greys">Greyscale</MenuItem>
          <MenuItem value="Electric">Electric</MenuItem>
          <MenuItem value="Bluered">Blue–red</MenuItem>
          <MenuItem value="Blackbody">Blackbody</MenuItem>
        </Select>
      </FormControl>

      <Box>
        <Typography component="p" variant="subtitle2" color="text.primary" sx={{ mb: 0.5 }}>
          Visible time
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {tempX[0].toFixed(1)}s – {tempX[1].toFixed(1)}s
        </Typography>
        <StyledSlider
          disableSwap
          disabled={disabled}
          sx={{ mt: 3 }}
          value={tempX}
          onChange={handleXChange}
          onChangeCommitted={handleXCommit}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `${Number(value).toFixed(1)}s`}
          getAriaLabel={(index) => (index === 0 ? 'Visible time start' : 'Visible time end')}
          min={defaultX[0]}
          max={defaultX[1]}
          step={0.1}
        />
      </Box>

      <Box>
        <Typography component="p" variant="subtitle2" color="text.primary" sx={{ mb: 0.5 }}>
          Visible frequency
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {Math.round(tempY[0]).toLocaleString()} Hz – {Math.round(tempY[1]).toLocaleString()} Hz
        </Typography>
        <StyledSlider
          disableSwap
          disabled={disabled}
          sx={{ mt: 3 }}
          value={tempY}
          onChange={handleYChange}
          onChangeCommitted={handleYCommit}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `${Math.round(value).toLocaleString()} Hz`}
          getAriaLabel={(index) => (index === 0 ? 'Visible frequency start' : 'Visible frequency end')}
          min={defaultY[0]}
          max={defaultY[1]}
          step={1}
        />
      </Box>
    </Box>
  );
}

SpectrogramControls.propTypes = {
  colorscale: PropTypes.string.isRequired,
  setColorscale: PropTypes.func.isRequired,
  xrange: PropTypes.arrayOf(PropTypes.number).isRequired,
  setXrange: PropTypes.func.isRequired,
  yrange: PropTypes.arrayOf(PropTypes.number).isRequired,
  setYrange: PropTypes.func.isRequired,
  defaultX: PropTypes.arrayOf(PropTypes.number).isRequired,
  defaultY: PropTypes.arrayOf(PropTypes.number).isRequired,
  disabled: PropTypes.bool,
};
