import React, { useState } from "react";
import PropTypes from "prop-types";

import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import Box from "@mui/material/Box";

import StyledSlider from "../../shared/StyledSlider";

function ValueLabelComponent(props) {
  const { children, value } = props;

  return (
    <Tooltip enterTouchDelay={0} placement="top" title={value}>
      {children}
    </Tooltip>
  );
}

ValueLabelComponent.propTypes = {
  children: PropTypes.element.isRequired,
  value: PropTypes.number.isRequired,
};

export default function SpectrogramControls({
  colorscale,
  setColorscale,
  xrange,
  setXrange,
  yrange,
  setYrange,
  defaultX,
  defaultY,
}) {
  // Local states to track slider during drag
  const [tempX, setTempX] = useState(xrange);
  const [tempY, setTempY] = useState(yrange);

  const MIN_FREQUENCY_DISTANCE = 1000;
  const MIN_TIME_DISTANCE_SECONDS = 5;

  const handleXSliderChange = (event, newValue, activeThumb) => {
    if (activeThumb === 0) {
      setTempX([Math.min(newValue[0], tempX[1] - MIN_TIME_DISTANCE_SECONDS), tempX[1]]);
    } else {
      setTempX([tempX[0], Math.max(newValue[1], tempX[0] + MIN_TIME_DISTANCE_SECONDS)]);
    }
  };

  const handleXSliderCommit = (event, newValue, activeThumb) => {
    if (activeThumb === 0) {
      setXrange([Math.min(newValue[0], tempX[1] - MIN_TIME_DISTANCE_SECONDS), tempX[1]]);
    } else {
      setXrange([tempX[0], Math.max(newValue[1], tempX[0] + MIN_TIME_DISTANCE_SECONDS)]);
    }
  };

  const handleYSliderChange = (event, newValue, activeThumb) => {
    if (activeThumb === 0) {
      setTempY([Math.min(newValue[0], tempY[1] - MIN_FREQUENCY_DISTANCE), tempY[1]]);
    } else {
      setTempY([tempY[0], Math.max(newValue[1], tempY[0] + MIN_FREQUENCY_DISTANCE)]);
    }
  };

  const handleYSliderCommit = (event, newValue, activeThumb) => {
    if (activeThumb === 0) {
      setYrange([Math.min(newValue[0], tempY[1] - MIN_FREQUENCY_DISTANCE), tempY[1]]);
    } else {
      setYrange([tempY[0], Math.max(newValue[1], tempY[0] + MIN_FREQUENCY_DISTANCE)]);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <FormControl fullWidth>
        <InputLabel id="colorscale-label">Color Scale</InputLabel>
        <Select
          labelId="colorscale-label"
          value={colorscale}
          label="Color Scale"
          onChange={(event) => setColorscale(event.target.value)}
          MenuProps={{
            PaperProps: {
              sx: {
                backgroundColor: "#121212",
                opacity: 1,
              },
            },
          }}
        >
          <MenuItem value={"RdBu"}>RedBlue</MenuItem>
          <MenuItem value={"Portland"}>Portland</MenuItem>
          <MenuItem value={"Picnic"}>Picnic</MenuItem>
          <MenuItem value={"jet"}>Jet</MenuItem>
          <MenuItem value={"hot"}>Hot</MenuItem>
          <MenuItem value={"Greys"}>Greyscale</MenuItem>
          <MenuItem value={"Electric"}>Electric</MenuItem>
          <MenuItem value={"Bluered"}>BlueRed</MenuItem>
          <MenuItem value={"Blackbody"}>BlackBody</MenuItem>
        </Select>
      </FormControl>
      <Typography gutterBottom color="white">
        Time (s) Range
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <StyledSlider
          disableSwap
          sx={{ marginTop: 4, flexGrow: 1 }}
          value={tempX}
          onChange={handleXSliderChange}
          onChangeCommitted={handleXSliderCommit}
          valueLabelDisplay="on"
          min={defaultX[0]}
          max={defaultX[1]}
          step={0.1}
        />
      </Box>
      <Typography gutterBottom color="white">
        Frequency (Hz) Range
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <StyledSlider
          disableSwap
          sx={{ marginTop: 4, flexGrow: 1 }}
          value={tempY}
          onChange={handleYSliderChange}
          onChangeCommitted={handleYSliderCommit}
          valueLabelDisplay="on"
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
};
