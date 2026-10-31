import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

/**
 * Explain a stale-save conflict and require an explicit user decision.
 *
 * Reload keeps the newer saved work; overwrite replaces it with the current
 * draft. Cancel leaves the draft untouched.
 */
export default function AnnotationConflictDialog({
  open = false,
  latestReportId = null,
  onReload,
  onOverwrite,
  onCancel,
}) {
  const reportLabel = latestReportId ? ` (report ${latestReportId})` : '';

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      fullWidth
      maxWidth="xs"
      aria-labelledby="annotation-conflict-title"
      aria-describedby="annotation-conflict-description"
    >
      <DialogTitle id="annotation-conflict-title">Annotation save conflict</DialogTitle>
      <DialogContent>
        <DialogContentText id="annotation-conflict-description">
          A newer manual report exists for this recording{reportLabel}. Reload it to
          keep the newer saved work, or overwrite it with your current draft. Your
          draft is kept until you choose.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onCancel} color="inherit">
          Cancel
        </Button>
        <Button onClick={onReload}>Reload latest</Button>
        <Button onClick={onOverwrite} color="warning" variant="contained">
          Overwrite
        </Button>
      </DialogActions>
    </Dialog>
  );
}

AnnotationConflictDialog.propTypes = {
  open: PropTypes.bool,
  latestReportId: PropTypes.number,
  onReload: PropTypes.func,
  onOverwrite: PropTypes.func,
  onCancel: PropTypes.func,
};
