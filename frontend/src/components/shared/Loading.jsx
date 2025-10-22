// src/components/ui/Loading.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Backdrop, Box, CircularProgress, Typography } from '@mui/material';

const Loading = ({ open = false, fullScreen = false, message = 'Loading…', size = 48, color = 'primary' }) => {
  if (fullScreen) {
    return (
      <Backdrop open={open} sx={{ zIndex: (theme) => theme.zIndex.modal + 1, color: '#fff' }}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
          <CircularProgress color={color} size={size} />
          {message && <Typography variant="body2" sx={{ mt: 1 }}>{message}</Typography>}
        </Box>
      </Backdrop>
    );
  }

  return (
    <Box display="inline-flex" alignItems="center" gap={1}>
      <CircularProgress color={color} size={size} />
      {message && <Typography variant="body2">{message}</Typography>}
    </Box>
  );
};

Loading.propTypes = {
  open: PropTypes.bool,
  fullScreen: PropTypes.bool,
  message: PropTypes.string,
  size: PropTypes.number,
  color: PropTypes.oneOf(['inherit','primary','secondary','error','info','success','warning']),
};

export default Loading;
