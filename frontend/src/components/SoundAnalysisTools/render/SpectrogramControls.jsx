import { useId, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Collapse from '@mui/material/Collapse';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import useMediaQuery from '@mui/material/useMediaQuery';

import SpectrogramRangeSlider from './SpectrogramRangeSlider';
import {
  DETAIL_PROFILES,
  getDetailProfile,
  selectFftSize,
} from '../processing/spectrogramModel';

const MIN_FREQUENCY_DISTANCE = 1000;
const MIN_TIME_DISTANCE_SECONDS = 5;

const formatTimeReadout = (value) => `${value[0].toFixed(1)}s – ${value[1].toFixed(1)}s`;
const formatTimeValue = (value) => `${Number(value).toFixed(1)}s`;
const timeAriaLabel = (index) => (index === 0 ? 'Visible time start' : 'Visible time end');

const formatFrequencyReadout = (value) => (
  `${Math.round(value[0]).toLocaleString()} Hz – ${Math.round(value[1]).toLocaleString()} Hz`
);
const formatFrequencyValue = (value) => `${Math.round(value).toLocaleString()} Hz`;
const frequencyAriaLabel = (index) => (
  index === 0 ? 'Visible frequency start' : 'Visible frequency end'
);

const formatSpacing = (value) => {
  if (value >= 10) return Math.round(value).toLocaleString();
  if (value >= 1) return value.toFixed(1);
  return Number(value.toPrecision(2)).toString();
};

/**
 * Spectrogram settings split into two groups:
 *
 * - Display: colour scale and the visible time/frequency window. These only
 *   change which slice of the existing matrix is drawn.
 * - Advanced settings: low/medium/high generation profiles. Changing one
 *   triggers a new full-file STFT using the already decoded samples.
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
  detailProfile,
  setDetailProfile,
  duration,
  sampleRate,
  disabled = false,
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const uid = useId();
  const colorscaleLabelId = `${uid}-colorscale-label`;
  const profileLabelId = `${uid}-detail-profile-label`;
  const advancedContentId = `${uid}-advanced-settings-content`;

  const profile = getDetailProfile(detailProfile);
  const frameSpacing = Number.isFinite(duration) && duration > 0
    ? (duration * 1000) / profile.maxFrames
    : null;
  const fftSize = Number.isFinite(sampleRate) && sampleRate > 0
    ? selectFftSize(sampleRate)
    : null;
  const rawBins = fftSize ? Math.floor(fftSize / 2) + 1 : null;
  const effectiveBins = rawBins ? Math.min(profile.maxBins, rawBins) : profile.maxBins;
  const binSpacing = Number.isFinite(sampleRate) && sampleRate > 0 && effectiveBins > 1
    ? sampleRate / 2 / (effectiveBins - 1)
    : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography component="h3" variant="subtitle2" color="text.secondary">
        Display
      </Typography>

      <FormControl fullWidth size="small" disabled={disabled}>
        <InputLabel id={colorscaleLabelId}>Color scale</InputLabel>
        <Select
          labelId={colorscaleLabelId}
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

      <SpectrogramRangeSlider
        title="Visible time"
        range={xrange}
        setRange={setXrange}
        limits={defaultX}
        minDistance={MIN_TIME_DISTANCE_SECONDS}
        step={0.1}
        disabled={disabled}
        formatReadout={formatTimeReadout}
        formatValue={formatTimeValue}
        getAriaLabel={timeAriaLabel}
      />

      <SpectrogramRangeSlider
        title="Visible frequency"
        range={yrange}
        setRange={setYrange}
        limits={defaultY}
        minDistance={MIN_FREQUENCY_DISTANCE}
        step={1}
        disabled={disabled}
        formatReadout={formatFrequencyReadout}
        formatValue={formatFrequencyValue}
        getAriaLabel={frequencyAriaLabel}
      />

      <Box>
        <ButtonBase
          onClick={() => setAdvancedOpen((open) => !open)}
          aria-expanded={advancedOpen}
          aria-controls={advancedContentId}
          sx={{
            mx: -1,
            px: 1,
            py: 0.75,
            width: (theme) => `calc(100% + ${theme.spacing(2)})`,
            minHeight: 44,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            borderRadius: 1,
            color: 'text.primary',
            textAlign: 'left',
            transition: (theme) => theme.transitions.create('background-color', {
              duration: theme.transitions.duration.shorter,
            }),
            '@media (hover: hover)': {
              '&:hover': { backgroundColor: 'action.hover' },
            },
            '&:focus-visible': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: 2,
            },
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
          }}
        >
          <Typography
            component="span"
            variant="subtitle2"
            color="text.secondary"
            sx={{ mr: 'auto', whiteSpace: 'nowrap' }}
          >
            Advanced settings
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
            {profile.label}
          </Typography>
          <ExpandMoreRoundedIcon
            fontSize="small"
            aria-hidden="true"
            sx={{
              color: 'text.secondary',
              transform: advancedOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: (theme) => theme.transitions.create('transform', {
                duration: theme.transitions.duration.shorter,
              }),
              '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
            }}
          />
        </ButtonBase>

        <Box id={advancedContentId}>
          <Collapse in={advancedOpen} timeout={reduceMotion ? 0 : 'auto'} unmountOnExit>
            <Box sx={{ mx: -1, px: 1, pt: 1.5, pb: 0.5 }}>
              <Typography
                component="p"
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 0.5 }}
              >
                Resolution profile
              </Typography>
              <Select
                variant="standard"
                disableUnderline
                value={detailProfile}
                disabled={disabled}
                onChange={(event) => setDetailProfile(event.target.value)}
                IconComponent={ExpandMoreRoundedIcon}
                inputProps={{ 'aria-label': 'Resolution profile' }}
                renderValue={(value) => getDetailProfile(value).label}
                sx={{
                  width: '100%',
                  borderRadius: 1,
                  '&:before, &:after': { display: 'none' },
                  '&.Mui-focused': {
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: 2,
                  },
                  '& .MuiSelect-select': { py: 1.5, pl: 0, pr: 4, typography: 'body2' },
                  '& .MuiSelect-icon': { right: 0, color: 'text.secondary' },
                }}
              >
                {Object.entries(DETAIL_PROFILES).map(([key, item]) => (
                  <MenuItem key={key} value={key}>
                    {item.label} — {item.maxFrames.toLocaleString()} frames / {item.maxBins.toLocaleString()} bins
                  </MenuItem>
                ))}
              </Select>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                Time: {profile.maxFrames.toLocaleString()} frames
                {frameSpacing ? ` • ${formatSpacing(frameSpacing)} ms/frame` : ''}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Frequency: {effectiveBins.toLocaleString()} bins
                {binSpacing ? ` • ≈ ${formatSpacing(binSpacing)} Hz/bin` : ''}
                {rawBins && profile.maxBins > rawBins ? ' (max for this file)' : ''}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                Changing the profile regenerates the full-file analysis.
              </Typography>
            </Box>
          </Collapse>
        </Box>
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
  detailProfile: PropTypes.string.isRequired,
  setDetailProfile: PropTypes.func.isRequired,
  duration: PropTypes.number,
  sampleRate: PropTypes.number,
  disabled: PropTypes.bool,
};
