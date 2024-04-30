import React from 'react';
import PropTypes from 'prop-types';

import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import FileUpload from '../shared/FileUpload';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box'; // Import Box component
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

import StyledSlider from '../shared/StyledSlider';

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

export default function SpectrogramControls({ setAudioFile, type, setType, colorscale, setColorscale, xrange, setXrange, yrange, setYrange }) {

    const handleXRangeChange = (newValue) => {
        setXrange(newValue);
    };

    const handleYRangeChange = (newValue) => {
        setYrange(newValue);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FileUpload setAudioFile={setAudioFile} />

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
                    <MenuItem value={"YlOrRd"}> YellowOrRed</MenuItem>
                    <MenuItem value={"RdBu"}>RedBlue</MenuItem>
                    <MenuItem value={"Portland"}> Portland</MenuItem>
                    <MenuItem value={"Picnic"}>Picnic</MenuItem>
                    <MenuItem value={"Jet"}> Jet</MenuItem>
                    <MenuItem value={"Hot"}>Hot</MenuItem>
                    <MenuItem value={"Greys"}> Greyscale</MenuItem>
                    <MenuItem value={"Electric"}>Electric</MenuItem>
                    <MenuItem value={"Bluered"}> BlueRed</MenuItem>
                    <MenuItem value={"Blackbody"}>BlackBody</MenuItem>
                </Select>
            </FormControl>

            <Typography gutterBottom>
                Time (s) Range
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={() => handleXRangeChange([xrange[0] - 1, xrange[1]])}>
                    <RemoveIcon />
                </IconButton>
                <IconButton onClick={() => handleXRangeChange([xrange[0] + 1, xrange[1]])}>
                    <AddIcon />
                </IconButton>
                <StyledSlider
                    sx={{ marginTop: 4, flexGrow: 1 }}
                    defaultValue={[0, 300]}
                    value={xrange}
                    onChange={(event, newValue) => handleXRangeChange(newValue)}
                    valueLabelDisplay="on"
                    min={0}
                    max={300}
                />
                <IconButton onClick={() => handleXRangeChange([xrange[0], xrange[1] - 1])}>
                    <RemoveIcon />
                </IconButton>
                <IconButton onClick={() => handleXRangeChange([xrange[0], xrange[1] + 1])}>
                    <AddIcon />
                </IconButton>
            </Box>

            <Typography gutterBottom>
                Frequency (Hz) Range
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={() => handleYRangeChange([yrange[0] - 1, yrange[1]])}>
                    <RemoveIcon />
                </IconButton>
                <IconButton onClick={() => handleYRangeChange([yrange[0] + 1, yrange[1]])}>
                    <AddIcon />
                </IconButton>
                <StyledSlider
                    sx={{ marginTop: 4, flexGrow: 1 }}
                    defaultValue={[0, 10000]}
                    value={yrange}
                    onChange={(event, newValue) => handleYRangeChange(newValue)}
                    valueLabelDisplay="on"
                    min={0}
                    max={10000}
                />
                <IconButton onClick={() => handleYRangeChange([yrange[0], yrange[1] - 1])}>
                    <RemoveIcon />
                </IconButton>
                <IconButton onClick={() => handleYRangeChange([yrange[0], yrange[1] + 1])}>
                    <AddIcon />
                </IconButton>
            </Box>
        </Box>
    );
}
