import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { APIHandlerAuthentication } from '../../services/rest/APIHandler/APIHandlerAuthentication';
import { AuthenticateUserRequest } from '../../services/rest/RequestORM/Authentication/CheckUserRequest';
import { useGlobalState } from '../../services/Authentication/GlobalStateManager';
import { useErrors } from '../shared/ErrorContext';

export default function SignInDialog({ open, onClose, onSignedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useGlobalState();
  const { addError } = useErrors();
  const navigate = useNavigate();

  const reset = () => {
    setPassword('');
    setError('');
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Enter both your username and password.');
      return;
    }

    setSubmitting(true);
    try {
      const handler = new APIHandlerAuthentication();
      const request = new AuthenticateUserRequest(username.trim(), password);
      const authenticated = await handler.setSessionTokenIfUserExists(request, login);

      if (!authenticated) {
        setError('Those credentials were not accepted. Check your username and password.');
        return;
      }

      reset();
      onSignedIn?.();
      navigate('/Dashboard');
    } catch (err) {
      const message = 'Sign in failed. Please try again.';
      setError(message);
      addError(err instanceof Error ? err : message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="sign-in-dialog-title"
    >
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogTitle id="sign-in-dialog-title">Sign in to CoquiTones</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Access the dashboard, historical data, and the IoT node network.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} role="alert">
              {error}
            </Alert>
          )}

          <TextField
            autoFocus
            fullWidth
            required
            margin="dense"
            label="Username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <TextField
            fullWidth
            required
            margin="dense"
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, flexDirection: 'column', alignItems: 'stretch', gap: 1 }}>
          <Button type="submit" variant="contained" disabled={submitting} fullWidth>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
          <Button component={RouterLink} to="/SignUp" onClick={handleClose} variant="text" fullWidth>
            Need an account? Create one
          </Button>
          <Button onClick={handleClose} color="inherit" disabled={submitting} fullWidth>
            Cancel
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
