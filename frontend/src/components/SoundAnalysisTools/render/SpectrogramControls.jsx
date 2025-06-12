import React from "react";
import PropTypes from "prop-types";

import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import FileUpload from "../../shared/FileUpload";
import Box from "@mui/material/Box"; // Import Box component

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
  type,
  setType,
  colorscale,
  setColorscale,
  xrange,
  setXrange,
  yrange,
  setYrange,
  defaultX,
  defaultY,
}) {
  const handleXRangeChange = (newValue) => {
    setXrange(newValue);
  };

  const handleYRangeChange = (newValue) => {
    setYrange(newValue);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">Chart Type</InputLabel>
        <Select
          defaultValue={"basic-spectrogram"}
          value={type}
          label="Chart Type"
          onChange={(event) => setType(event.target.value)}
        >
          <MenuItem value={"mel-spectrogram"}>Mel Spectrogram</MenuItem>
          <MenuItem value={"basic-spectrogram"}>Basic Spectrogram</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">Color Scale</InputLabel>
        <Select
          defaultValue={"Jet"}
          value={colorscale}
          label="Color Scale"
          onChange={(event) => setColorscale(event.target.value)}
        >
          <MenuItem value={"RdBu"}>RedBlue</MenuItem>
          <MenuItem value={"Portland"}> Portland</MenuItem>
          <MenuItem value={"Picnic"}>Picnic</MenuItem>
          <MenuItem value={"jet"}> Jet</MenuItem>
          <MenuItem value={"hot"}>Hot</MenuItem>
          <MenuItem value={"Greys"}> Greyscale</MenuItem>
          <MenuItem value={"Electric"}>Electric</MenuItem>
          <MenuItem value={"Bluered"}> BlueRed</MenuItem>
          <MenuItem value={"Blackbody"}>BlackBody</MenuItem>
        </Select>
      </FormControl>

      <Typography gutterBottom>Time (s) Range</Typography>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <StyledSlider
          sx={{ marginTop: 4, flexGrow: 1 }}
          defaultValue={defaultX}
          value={xrange.map((val) => val.toFixed(1))}
          onChange={(event, newValue) => handleXRangeChange(newValue)}
          valueLabelDisplay="on"
          min={defaultX[0]}
          max={defaultX[1]}
        />
      </Box>

      <Typography gutterBottom>Frequency (Hz) Range</Typography>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <StyledSlider
          sx={{ marginTop: 4, flexGrow: 1 }}
          defaultValue={defaultY}
          value={yrange.map((val) => val.toFixed(0))}
          onChange={(event, newValue) => handleYRangeChange(newValue)}
          valueLabelDisplay="on"
          min={defaultY[0]}
          max={defaultY[1]}
        />
      </Box>
    </Box>
  );
}
