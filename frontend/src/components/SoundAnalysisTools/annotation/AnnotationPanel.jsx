import PropTypes from 'prop-types';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';

import AnnotationConflictDialog from './AnnotationConflictDialog';
import AnnotationModeToggle from './AnnotationModeToggle';
import SpeciesAnnotationList from './SpeciesAnnotationList';
import { formatTime } from '../processing/spectrogramFormat';

const sourceColor = (source) => {
  if (source === 'Manual') return 'success';
  if (source === 'Classifier') return 'info';
  return 'default';
};

/**
 * Reported/Editor controls, pinned-window navigation, and species annotations.
 */
export default function AnnotationPanel({
  mode,
  onModeChange,
  source = 'None',
  pinnedWindow = null,
  pinnedWindowIndex = null,
  windowCount = 0,
  onPinWindow,
  onToggleSpecies,
  readOnly = true,
  dirty = false,
  warnings = [],
  status = 'ready',
  error = null,
  canSave = false,
  onSave,
  saving = false,
  saveError = null,
  saveMessage = null,
  saveDisabledReason = null,
  conflict = null,
  onReloadConflict,
  onOverwriteConflict,
  onCancelConflict,
  onDismissSaveFeedback,
  canExport = false,
  onExport,
  exportDisabledReason = null,
  exporting = false,
  exportError = null,
  savedAt = null,
}) {
  const hasWindows = windowCount > 0;
  const stepWindow = (delta) => {
    const base = pinnedWindowIndex ?? (delta > 0 ? -1 : 0);
    const next = base + delta;
    if (next >= 0 && next < windowCount) onPinWindow?.(next);
  };

  return (
    <Box role="region" aria-label="Species annotations">
      <Typography component="h3" variant="h6" color="text.primary">
        Species annotations
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Review the reported values or switch to Editor to annotate ten-second windows.
      </Typography>

      <AnnotationModeToggle
        mode={mode}
        onChange={onModeChange}
        disabled={!hasWindows}
      />

      <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
        <Chip
          size="small"
          variant="outlined"
          color={sourceColor(source)}
          label={`Source: ${source}`}
        />
        {dirty && (
          <Chip size="small" color="warning" label="Unsaved changes" />
        )}
        {savedAt && (
          <Typography variant="caption" color="text.secondary">
            Saved {new Date(savedAt).toLocaleString()}
          </Typography>
        )}
      </Stack>

      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          size="small"
          onClick={onSave}
          disabled={!canSave || saving}
          aria-label={saving ? 'Saving annotations' : 'Save annotations'}
        >
          {saving ? 'Saving…' : 'Save annotations'}
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={onExport}
          disabled={!canExport || exporting}
          aria-label={exporting ? 'Exporting annotations' : 'Export annotations'}
        >
          {exporting ? 'Exporting…' : 'Export annotations'}
        </Button>
        {!canSave && !saving && saveDisabledReason && (
          <Typography variant="caption" color="text.secondary">
            {saveDisabledReason}
          </Typography>
        )}
        {!canExport && !exporting && exportDisabledReason && (
          <Typography variant="caption" color="text.secondary">
            {exportDisabledReason}
          </Typography>
        )}
      </Box>

      {saveMessage && (
        <Alert severity="success" sx={{ mt: 2 }} onClose={onDismissSaveFeedback}>
          {saveMessage}
        </Alert>
      )}

      {saveError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {saveError.message ?? 'The annotations could not be saved.'}
        </Alert>
      )}

      {exportError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {exportError.message ?? 'The annotations could not be exported.'}
        </Alert>
      )}

      {status === 'loading' && (
        <LinearProgress aria-label="Loading annotation report" sx={{ my: 2 }} />
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error.message ?? 'The annotation report could not be loaded.'}
        </Alert>
      )}

      {warnings.map((warning) => (
        <Alert key={warning} severity="warning" sx={{ mt: 2 }}>
          {warning}
        </Alert>
      ))}

      {!hasWindows && status !== 'loading' && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No ten-second windows are available for this recording.
        </Alert>
      )}

      <Box sx={{ mt: 2.5, mb: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton
            size="small"
            aria-label="Previous ten-second window"
            onClick={() => stepWindow(-1)}
            disabled={!hasWindows || pinnedWindowIndex === null || pinnedWindowIndex <= 0}
          >
            <ChevronLeftRoundedIcon />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }} aria-live="polite">
            <Typography variant="body2" color="text.primary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {pinnedWindow
                ? `Window ${pinnedWindowIndex + 1} of ${windowCount}`
                : 'Select a ten-second window'}
            </Typography>
            {pinnedWindow && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {formatTime(pinnedWindow.start)} – {formatTime(pinnedWindow.end)}
              </Typography>
            )}
          </Box>
          <IconButton
            size="small"
            aria-label="Next ten-second window"
            onClick={() => stepWindow(1)}
            disabled={!hasWindows || (pinnedWindowIndex !== null && pinnedWindowIndex >= windowCount - 1)}
          >
            <ChevronRightRoundedIcon />
          </IconButton>
        </Stack>
      </Box>

      <SpeciesAnnotationList
        window={pinnedWindow}
        readOnly={readOnly}
        disabled={!pinnedWindow}
        onToggle={(speciesKey, value) => {
          if (pinnedWindowIndex !== null) {
            onToggleSpecies?.(pinnedWindowIndex, speciesKey, value);
          }
        }}
      />

      <AnnotationConflictDialog
        open={Boolean(conflict)}
        latestReportId={conflict?.latestReportId ?? null}
        onReload={onReloadConflict}
        onOverwrite={onOverwriteConflict}
        onCancel={onCancelConflict}
      />
    </Box>
  );
}

AnnotationPanel.propTypes = {
  mode: PropTypes.oneOf(['reported', 'editor']).isRequired,
  onModeChange: PropTypes.func,
  source: PropTypes.oneOf(['Manual', 'Classifier', 'None']),
  pinnedWindow: PropTypes.object,
  pinnedWindowIndex: PropTypes.number,
  windowCount: PropTypes.number,
  onPinWindow: PropTypes.func,
  onToggleSpecies: PropTypes.func,
  readOnly: PropTypes.bool,
  dirty: PropTypes.bool,
  warnings: PropTypes.arrayOf(PropTypes.string),
  status: PropTypes.oneOf(['idle', 'loading', 'ready', 'error']),
  error: PropTypes.object,
  canSave: PropTypes.bool,
  onSave: PropTypes.func,
  saving: PropTypes.bool,
  saveError: PropTypes.object,
  saveMessage: PropTypes.string,
  saveDisabledReason: PropTypes.string,
  conflict: PropTypes.shape({
    latestReportId: PropTypes.number,
  }),
  onReloadConflict: PropTypes.func,
  onOverwriteConflict: PropTypes.func,
  onCancelConflict: PropTypes.func,
  onDismissSaveFeedback: PropTypes.func,
  canExport: PropTypes.bool,
  onExport: PropTypes.func,
  exportDisabledReason: PropTypes.string,
  exporting: PropTypes.bool,
  exportError: PropTypes.object,
  savedAt: PropTypes.string,
};
