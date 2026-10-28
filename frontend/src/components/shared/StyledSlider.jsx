import Slider from '@mui/material/Slider';
import { alpha, styled } from '@mui/material/styles';

/**
 * Range slider styled for the spectrogram panel (high contrast thumb, visible
 * focus ring, no layout shift on hover).
 */
const StyledSlider = styled(Slider)(({ theme }) => ({
  height: 8,
  padding: '16px 0',
  '& .MuiSlider-track': { border: 'none', backgroundColor: theme.palette.primary.main },
  '& .MuiSlider-rail': { backgroundColor: theme.palette.divider, opacity: 1 },
  '& .MuiSlider-thumb': {
    height: 24,
    width: 24,
    backgroundColor: theme.palette.background.paper,
    border: `2px solid ${theme.palette.primary.main}`,
    '&:hover, &.Mui-active, &.Mui-focusVisible': {
      boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.18)}`,
    },
    '&::before': { display: 'none' },
  },
  '& .MuiSlider-valueLabel': {
    lineHeight: 1.2,
    fontSize: 12,
    padding: '4px 6px',
    borderRadius: 1,
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.secondary.contrastText,
  },
}));

export default StyledSlider;
