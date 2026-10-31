import PropTypes from 'prop-types';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';

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
 * Read-only/Editor controls, pinned-window navigation, and species annotations.
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
  const hasRecording = status !== 'idle';
  const isEditor = mode === 'editor';
  const showSource = source !== 'None' || isEditor;
  const showMetadata = showSource || dirty || Boolean(savedAt);
  const showExport = canExport;
  const stepWindow = (delta) => {
    const base = pinnedWindowIndex ?? (delta > 0 ? -1 : 0);
    const next = base + delta;
    if (next >= 0 && next < windowCount) onPinWindow?.(next);
  };

  return (
    <Box role="region" aria-label="Annotation workspace">
      <Typography component="h3" variant="h6" color="text.primary">
        Species annotations
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        {isEditor
          ? 'Annotate the ten-second windows, then save or export.'
          : 'Review the authoritative species values without editing them.'}
      </Typography>

      {!hasRecording && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Load a recording to view or annotate ten-second windows.
        </Typography>
      )}

      {hasRecording && (
        <>
          {hasWindows && (
            <AnnotationModeToggle
              mode={mode}
              onChange={onModeChange}
            />
          )}

          {showMetadata && (
            <Stack
              direction="row"
              spacing={1}
              sx={{ mt: 2, flexWrap: 'wrap', gap: 1, alignItems: 'center' }}
            >
              {showSource && (
                <Chip
                  size="small"
                  variant="outlined"
                  color={sourceColor(source)}
                  label={`Source: ${source}`}
                />
              )}
              {dirty && (
                <Chip size="small" color="warning" label="Unsaved changes" />
              )}
              {savedAt && (
                <Typography variant="caption" color="text.secondary">
                  Saved {new Date(savedAt).toLocaleString()}
                </Typography>
              )}
            </Stack>
          )}

          {status === 'loading' && (
            <LinearProgress aria-label="Loading annotation report" sx={{ mt: 2 }} />
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

          {status === 'ready' && !hasWindows && isEditor && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No ten-second windows are available for this recording.
            </Alert>
          )}

          {hasWindows && (
            <>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ display: 'block', mt: 3 }}
              >
                Window
              </Typography>

              <Box sx={{ mt: 0.5, mb: 1.5 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <IconButton
                    size="small"
                    aria-label="Previous ten-second window"
                    onClick={() => stepWindow(-1)}
                    disabled={pinnedWindowIndex === null || pinnedWindowIndex <= 0}
                    sx={{ minWidth: 44, minHeight: 44 }}
                  >
                    <ChevronLeftRoundedIcon />
                  </IconButton>
                  <Box sx={{ flex: 1, minWidth: 0 }} aria-live="polite">
                    <Typography
                      variant="body2"
                      color="text.primary"
                      sx={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {pinnedWindow
                        ? `Window ${pinnedWindowIndex + 1} of ${windowCount}`
                        : 'Select a ten-second window'}
                    </Typography>
                    {pinnedWindow && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block' }}
                      >
                        {formatTime(pinnedWindow.start)} – {formatTime(pinnedWindow.end)}
                      </Typography>
                    )}
                  </Box>
                  <IconButton
                    size="small"
                    aria-label="Next ten-second window"
                    onClick={() => stepWindow(1)}
                    disabled={pinnedWindowIndex !== null && pinnedWindowIndex >= windowCount - 1}
                    sx={{ minWidth: 44, minHeight: 44 }}
                  >
                    <ChevronRightRoundedIcon />
                  </IconButton>
                </Stack>
              </Box>

              <SpeciesAnnotationList
                window={pinnedWindow}
                readOnly={!isEditor}
                disabled={!pinnedWindow}
                onToggle={(speciesKey, value) => {
                  if (pinnedWindowIndex !== null) {
                    onToggleSpecies?.(pinnedWindowIndex, speciesKey, value);
                  }
                }}
              />

              <Divider sx={{ my: 2 }} />

              <Stack spacing={1}>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {isEditor && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={onSave}
                      startIcon={<SaveRoundedIcon />}
                      disabled={!canSave || saving}
                      aria-label={saving ? 'Saving annotations' : 'Save annotations'}
                      sx={{ minHeight: 44, textTransform: 'none' }}
                    >
                      {saving ? 'Saving…' : 'Save annotations'}
                    </Button>
                  )}
                  {showExport && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={onExport}
                      startIcon={<DownloadRoundedIcon />}
                      disabled={exporting}
                      aria-label={exporting ? 'Exporting annotations' : 'Export annotations'}
                      sx={{ minHeight: 44, textTransform: 'none' }}
                    >
                      {exporting ? 'Exporting…' : 'Export annotations'}
                    </Button>
                  )}
                </Stack>
                {isEditor && !canSave && !saving && saveDisabledReason && (
                  <Typography variant="caption" color="text.secondary">
                    {saveDisabledReason}
                  </Typography>
                )}
                {isEditor && !showExport && !exporting && exportDisabledReason && (
                  <Typography variant="caption" color="text.secondary">
                    {exportDisabledReason}
                  </Typography>
                )}
              </Stack>
            </>
          )}
        </>
      )}

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

      <AnnotationConflictDialog
        open={isEditor && Boolean(conflict)}
        latestReportId={conflict?.latestReportId ?? null}
        onReload={onReloadConflict}
        onOverwrite={onOverwriteConflict}
        onCancel={onCancelConflict}
      />
    </Box>
  );
}

AnnotationPanel.propTypes = {
  mode: PropTypes.oneOf(['readOnly', 'editor']).isRequired,
  onModeChange: PropTypes.func,
  source: PropTypes.oneOf(['Manual', 'Classifier', 'None']),
  pinnedWindow: PropTypes.object,
  pinnedWindowIndex: PropTypes.number,
  windowCount: PropTypes.number,
  onPinWindow: PropTypes.func,
  onToggleSpecies: PropTypes.func,
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
