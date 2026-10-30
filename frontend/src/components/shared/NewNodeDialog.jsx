import { useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import AddRoundedIcon from '@mui/icons-material/AddRounded';

import { APIHandlerNetworkMonitor } from '../../services/rest/APIHandler/APIHandlerNetworkMonitor';
import { InsertNewNodeRequest } from '../../services/rest/RequestORM/NetworkMonitor/NewNodeRequest';
import { useErrors } from './ErrorContext';

const EMPTY_FORM = {
  nodeType: 'primary',
  nodeName: '',
  description: '',
  latitude: '',
  longitude: '',
  password: '',
};

const isValidCoordinate = (value, min, max) => {
  const number = Number(value);
  return value !== '' && Number.isFinite(number) && number >= min && number <= max;
};

export default function NewNodeDialog({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { addError } = useErrors();
  const apiHandler = useMemo(() => new APIHandlerNetworkMonitor(), []);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const close = () => {
    if (submitting) return;
    setOpen(false);
    setForm(EMPTY_FORM);
    setFormError('');
  };

  const validate = () => {
    if (!form.nodeName.trim()) return 'Give the node a name.';
    if (!form.description.trim()) return 'Add a short description of where the node is installed.';
    if (!isValidCoordinate(form.latitude, -90, 90)) return 'Latitude must be a number between -90 and 90.';
    if (!isValidCoordinate(form.longitude, -180, 180)) {
      return 'Longitude must be a number between -180 and 180.';
    }
    if (form.nodeType === 'primary' && !form.password) {
      return 'Primary nodes need the MQTT client password flashed to the device.';
    }
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const request = new InsertNewNodeRequest(
        form.nodeType,
        form.longitude,
        form.latitude,
        form.description.trim(),
        form.nodeName.trim(),
        form.password,
      );
      await apiHandler.insert_new_node(request);
    } catch (error) {
      addError(error);
      setFormError('The node could not be added. Check the values and try again.');
      setSubmitting(false);
      return;
    }

    // The node is registered: close immediately and stop the spinner before
    // refreshing the list, so a slow refresh cannot leave the form stuck.
    setOpen(false);
    setForm(EMPTY_FORM);
    setFormError('');
    setSubmitting(false);

    try {
      await onCreated?.();
    } catch (error) {
      addError(error);
    }
  };

  return (
    <>
      <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setOpen(true)}>
        Add node
      </Button>

      <Dialog open={open} onClose={close} fullWidth maxWidth="sm" aria-labelledby="new-node-title">
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <DialogTitle id="new-node-title">Register a new node</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Add a field node to the Cluster Duck network. The MQTT password must match the one
              flashed to the device.
            </DialogContentText>

            {formError && (
              <Alert severity="error" sx={{ mb: 2 }} role="alert">
                {formError}
              </Alert>
            )}

            <Stack spacing={2}>
              <TextField select fullWidth label="Node type" value={form.nodeType} onChange={updateField('nodeType')}>
                <MenuItem value="primary">Primary</MenuItem>
                <MenuItem value="secondary">Secondary</MenuItem>
              </TextField>

              <TextField
                required
                fullWidth
                label="Node name"
                value={form.nodeName}
                onChange={updateField('nodeName')}
                autoComplete="off"
              />

              <TextField
                required
                fullWidth
                label="Description"
                helperText="Where is this node installed?"
                value={form.description}
                onChange={updateField('description')}
                autoComplete="off"
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  required
                  fullWidth
                  label="Latitude"
                  value={form.latitude}
                  onChange={updateField('latitude')}
                  slotProps={{ htmlInput: { inputMode: 'decimal' } }}
                  autoComplete="off"
                />
                <TextField
                  required
                  fullWidth
                  label="Longitude"
                  value={form.longitude}
                  onChange={updateField('longitude')}
                  slotProps={{ htmlInput: { inputMode: 'decimal' } }}
                  autoComplete="off"
                />
              </Stack>

              {form.nodeType === 'primary' && (
                <TextField
                  required
                  fullWidth
                  type="password"
                  label="MQTT client password"
                  value={form.password}
                  onChange={updateField('password')}
                  autoComplete="new-password"
                />
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={close} color="inherit" disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add node'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
