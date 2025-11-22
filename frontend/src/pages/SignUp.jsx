// src/components/auth/SignUpPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Divider,
  styled,
  Link,
  Snackbar,
  Alert
} from '@mui/material';
import logo from "../components/assets/images/logo512.png";
import HeroSection from '../components/shared/HeroSection';
// import Cookies from 'js-cookie'; // optional
import { APIHandlerAuthentication } from '../services/rest/APIHandler/APIHandlerAuthentication';
import { SignUpRequest } from '../services/rest/RequestORM/Authentication/SignUpRequest';

const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#000',
  padding: theme.spacing(3),

  '& .bgVideo': {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: 0,
    pointerEvents: 'none',
  },

  '& .overlay': {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.45)', // adjust for contrast
    zIndex: 1,
  },

  '& .card': {
    width: 420,
    maxWidth: '90%',
    backgroundColor: 'rgba(25,23,22,0.9)',
    border: '2px solid #000',
    boxShadow: 24,
    padding: theme.spacing(4),
    position: 'relative',
    zIndex: 2,
    backdropFilter: 'blur(4px)',
  },

  '& img': {
    width: '50%',
    height: '50%',
    display: 'block',
    margin: '0 auto 8px auto'
  }
}));


const SignUpPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  // New state for managing Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  	// Handler to close the Snackbar
	const handleSnackbarClose = (event, reason) => {
		if (reason === 'clickaway') {
			return;
		}
		setSnackbarOpen(false);
	};
  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = 'Username required';
    if (!form.password) e.password = 'Password required';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field) => (evt) => {
    setForm((s) => ({ ...s, [field]: evt.target.value }));
    setErrors((es) => ({ ...es, [field]: undefined }));
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const handler = new APIHandlerAuthentication();
      // Replace with your real request/handler:
      // const created = await handler.createUser(req);
      // Example placeholder (simulate):
      const createNewUserRequest = new SignUpRequest(form.username, form.password)
      const created = await handler.SignUpNewUser(createNewUserRequest)

      if (created) {
				// Show success Snackbar
				setSnackbarMessage('Successfuly Sign up. Welcome to CoquiTones!');
				setSnackbarSeverity('success');
				setSnackbarOpen(true);
        setTimeout(() => {
					navigate('/'); 
				}, 3000);
        
      } else {
        setErrors({ form: 'Registration failed. Try again.' });
      }
    } catch (err) {
      console.error('Sign-up error', err);
      setErrors({ form: 'Server error. Try again later.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <video
        className="bgVideo"
        autoPlay
        loop
        muted
        playsInline
        src="https://videos.pexels.com/video-files/9777616/9777616-hd_1920_1080_30fps.mp4"
        type="video/mp4"
      />
      <div className="overlay" />
      <Box className="card">
        <img src={logo} alt="logo" />
        <Typography
          variant="h5"
          align="center"
          sx={{ color: '#ffc857', fontWeight: 'bold', mb: 2 }}
        >
          Create Account
        </Typography>

        <TextField
          fullWidth
          margin="normal"
          label="Username"
          value={form.username}
          onChange={handleChange('username')}
          error={!!errors.username}
          helperText={errors.username}
        />

        <TextField
          fullWidth
          margin="normal"
          type="password"
          label="Password"
          value={form.password}
          onChange={handleChange('password')}
          error={!!errors.password}
          helperText={errors.password}
        />

        <TextField
          fullWidth
          margin="normal"
          type="password"
          label="Confirm Password"
          value={form.confirmPassword}
          onChange={handleChange('confirmPassword')}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword}
        />

        {errors.form && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {errors.form}
          </Typography>
        )}

        <Stack spacing={2} sx={{ mt: 2 }}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            fullWidth
          >
            {loading ? 'Creating…' : 'Sign Up'}
          </Button>

          <Divider>
            <Typography variant="body2" color="text.secondary">OR</Typography>
          </Divider>

          <Button variant="outlined" color="secondary" fullWidth onClick={() => navigate('/')}>
            <Link component="button" underline="none" sx={{ color: 'inherit' }}>
              Already have an account? Sign In
            </Link>
          </Button>

          <Button variant="text" color="error" fullWidth onClick={() => navigate('/')}>
            Cancel
          </Button>
                <Snackbar
                  open={snackbarOpen}
                  autoHideDuration={3000}
                  onClose={handleSnackbarClose}
                  anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                  <Alert
                    onClose={handleSnackbarClose}
                    severity={snackbarSeverity}
                    sx={{ width: '100%' }}
                  >
                    {snackbarMessage}
                  </Alert>
                </Snackbar>
        </Stack>
      </Box>
    </PageContainer>
  );
};

export default SignUpPage;
