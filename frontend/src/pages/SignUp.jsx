import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';

import logo from '../components/assets/images/logo512.png';
import { useErrors } from '../components/shared/ErrorContext';
import { APIHandlerAuthentication } from '../services/rest/APIHandler/APIHandlerAuthentication';
import { SignUpRequest } from '../services/rest/RequestORM/Authentication/SignUpRequest';

const EMPTY_FORM = { username: '', password: '', confirmPassword: '' };
const EMPTY_ERRORS = { username: '', password: '', confirmPassword: '', form: '' };

const BENEFITS = [
  'Review weekly species detections and node health',
  'Browse and export historical acoustic data',
  'Manage the IoT node network and MQTT clients',
];

export default function SignUpPage() {
  const navigate = useNavigate();
  const { addError } = useErrors();
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);
  const summaryRef = useRef(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState(EMPTY_ERRORS);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const hasErrors = Object.values(fieldErrors).some(Boolean);

  useEffect(() => {
    if (!success) return undefined;
    const timer = window.setTimeout(() => navigate('/'), 2200);
    return () => window.clearTimeout(timer);
  }, [success, navigate]);

  useEffect(() => {
    if (hasErrors) summaryRef.current?.focus();
  }, [hasErrors]);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [field]: '', form: '' }));
  };

  const validate = () => {
    const errors = { ...EMPTY_ERRORS };

    if (!form.username.trim()) errors.username = 'Choose a username.';
    if (!form.password) errors.password = 'Choose a password.';
    else if (form.password.length < 8) errors.password = 'Use at least 8 characters.';
    if (form.confirmPassword !== form.password) errors.confirmPassword = 'The passwords do not match.';

    setFieldErrors(errors);

    const firstInvalid = ['username', 'password', 'confirmPassword'].find((field) => errors[field]);
    if (firstInvalid) {
      const refs = { username: usernameRef, password: passwordRef, confirmPassword: confirmRef };
      refs[firstInvalid].current?.focus();
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading || !validate()) return;

    setLoading(true);
    try {
      const handler = new APIHandlerAuthentication();
      const created = await handler.SignUpNewUser(
        new SignUpRequest(form.username.trim(), form.password),
      );

      if (created) {
        setSuccess(true);
      } else {
        const message = 'Registration failed. That username may already be taken.';
        setFieldErrors((current) => ({ ...current, form: message }));
        summaryRef.current?.focus();
      }
    } catch (error) {
      const message = 'Registration failed. Please try again.';
      setFieldErrors((current) => ({ ...current, form: message }));
      addError(error instanceof Error ? error.message : message);
      summaryRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        backgroundColor: 'background.default',
      }}
    >
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 6,
          background: 'linear-gradient(160deg, #1D1A16 0%, #14120F 60%, #2A1B0C 100%)',
          borderRight: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box component={RouterLink} to="/" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, textDecoration: 'none' }}>
          <Box component="img" src={logo} alt="" sx={{ width: 48, height: 48 }} />
          <Typography component="span" sx={{ fontWeight: 800, fontSize: '1.25rem', color: 'primary.main' }}>
            CoquiTones
          </Typography>
        </Box>

        <Box sx={{ maxWidth: 420 }}>
          <Typography component="p" variant="h2" color="text.primary">
            Monitor amphibians with open source technology.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            An account gives researchers access to the full CoquiTones toolkit.
          </Typography>
          <Stack component="ul" spacing={1.5} sx={{ mt: 4, pl: 0, listStyle: 'none' }}>
            {BENEFITS.map((benefit) => (
              <Stack key={benefit} component="li" direction="row" spacing={1.5} alignItems="flex-start">
                <CheckCircleRoundedIcon color="primary" fontSize="small" sx={{ mt: '2px' }} />
                <Typography variant="body2" color="text.secondary">
                  {benefit}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        <Typography variant="caption" color="text.secondary">
          Open source · Built with Proyecto Coquí
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 2, sm: 4 } }}>
        <Container maxWidth="xs" disableGutters>
          <Paper sx={{ p: { xs: 3, sm: 4 } }}>
            <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 2 }}>
              <Box component="img" src={logo} alt="CoquiTones" sx={{ width: 64, height: 64 }} />
            </Box>

            <Typography component="h1" variant="h3" color="text.primary">
              Create your account
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
              Already registered?{' '}
              <Box component={RouterLink} to="/" sx={{ color: 'primary.main', fontWeight: 600 }}>
                Sign in from the home page
              </Box>
              .
            </Typography>

            {success && (
              <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircleRoundedIcon />}>
                Account created. Taking you to the home page…
              </Alert>
            )}

            {hasErrors && (
              <Alert
                severity="error"
                role="alert"
                tabIndex={-1}
                ref={summaryRef}
                sx={{ mb: 2 }}
              >
                Please fix the highlighted fields and try again.
                {fieldErrors.form ? ` ${fieldErrors.form}` : ''}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Stack spacing={2}>
                <TextField
                  inputRef={usernameRef}
                  required
                  fullWidth
                  label="Username"
                  name="username"
                  autoComplete="username"
                  value={form.username}
                  onChange={updateField('username')}
                  error={Boolean(fieldErrors.username)}
                  helperText={fieldErrors.username}
                  disabled={loading || success}
                  autoFocus
                />
                <TextField
                  inputRef={passwordRef}
                  required
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={updateField('password')}
                  error={Boolean(fieldErrors.password)}
                  helperText={fieldErrors.password || 'At least 8 characters.'}
                  disabled={loading || success}
                />
                <TextField
                  inputRef={confirmRef}
                  required
                  fullWidth
                  label="Confirm password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={updateField('confirmPassword')}
                  error={Boolean(fieldErrors.confirmPassword)}
                  helperText={fieldErrors.confirmPassword}
                  disabled={loading || success}
                />

                <Button type="submit" variant="contained" size="large" disabled={loading || success} fullWidth>
                  {loading ? 'Creating account…' : success ? 'Account created' : 'Sign up'}
                </Button>
              </Stack>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Button component={RouterLink} to="/" variant="text" fullWidth>
              Back to home
            </Button>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}
