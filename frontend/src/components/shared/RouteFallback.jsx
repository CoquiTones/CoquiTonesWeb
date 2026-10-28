import { Box, CircularProgress, Typography } from '@mui/material';

export default function RouteFallback({ label = 'Loading page…' }) {
  return (
    <Box
      sx={{
        minHeight: '50vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
      role="status"
      aria-live="polite"
    >
      <CircularProgress color="primary" />
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}
