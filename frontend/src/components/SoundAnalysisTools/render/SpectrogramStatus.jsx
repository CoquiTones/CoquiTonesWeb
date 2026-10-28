import PropTypes from 'prop-types';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import GraphicEqRoundedIcon from '@mui/icons-material/GraphicEqRounded';

const SUPPORTED_FORMATS = 'WAV, MP3, MP4, M4A, OGG or FLAC';

export default function SpectrogramStatus({
  status,
  fileName = '',
  progress = null,
  error = null,
  onRetry = null,
}) {
  if (status === 'ready') return null;

  if (status === 'failed' && error) {
    return (
      <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', p: 2, zIndex: 4 }}>
        <Alert
          severity="error"
          role="alert"
          sx={{ width: '100%', maxWidth: 520 }}
          action={
            onRetry ? (
              <Button color="inherit" size="small" onClick={onRetry}>
                Retry
              </Button>
            ) : undefined
          }
        >
          <Typography component="p" variant="subtitle2">
            {error.message}
          </Typography>
          {fileName && (
            <Typography component="p" variant="caption" sx={{ mt: 0.5 }}>
              File: {fileName}
            </Typography>
          )}
          <Typography component="p" variant="caption" sx={{ mt: 0.5 }}>
            Supported formats: {SUPPORTED_FORMATS}.
          </Typography>
        </Alert>
      </Box>
    );
  }

  if (status === 'idle') {
    return (
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.5,
          textAlign: 'center',
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 3,
          color: 'text.secondary',
          p: 2,
          zIndex: 2,
        }}
      >
        <GraphicEqRoundedIcon sx={{ fontSize: 44 }} aria-hidden="true" />
        <Typography component="p" variant="subtitle1" color="text.primary">
          No recording loaded
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380 }}>
          Upload a file or load a stored recording to render its spectrogram.
        </Typography>
      </Box>
    );
  }

  const isDeterminate = typeof progress === 'number' && Number.isFinite(progress);
  const label = status === 'decoding' ? 'Decoding' : 'Analyzing';

  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        p: 2,
        zIndex: 4,
        backgroundColor: 'rgba(20, 18, 15, 0.72)',
        borderRadius: 3,
      }}
    >
      <Typography component="p" variant="subtitle1" color="text.primary">
        {label} {fileName ? <strong>{fileName}</strong> : 'recording'}…
      </Typography>
      <Box sx={{ width: '100%', maxWidth: 360 }}>
        <LinearProgress
          variant={isDeterminate ? 'determinate' : 'indeterminate'}
          value={isDeterminate ? Math.round(progress * 100) : undefined}
        />
      </Box>
      {isDeterminate && (
        <Typography variant="caption" color="text.secondary">
          {Math.round(progress * 100)}%
        </Typography>
      )}
    </Box>
  );
}

SpectrogramStatus.propTypes = {
  status: PropTypes.oneOf(['idle', 'decoding', 'analyzing', 'ready', 'failed']).isRequired,
  fileName: PropTypes.string,
  progress: PropTypes.number,
  error: PropTypes.shape({
    code: PropTypes.string,
    message: PropTypes.string,
    fileName: PropTypes.string,
  }),
  onRetry: PropTypes.func,
};


