import { Link as RouterLink, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Link as ScrollLink, animateScroll as scroll } from 'react-scroll';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import { alpha } from '@mui/material/styles';

import logo from '../assets/images/logo512.png';
import { NAV_ITEMS } from '../../config/navigation';
import {
  AuthenticationStatus,
  useGlobalState,
} from '../../services/Authentication/GlobalStateManager';
import { useErrors } from '../shared/ErrorContext';

const linkSx = {
  px: 1.5,
  py: 1,
  minHeight: 40,
  borderRadius: 999,
  color: 'text.secondary',
  fontWeight: 600,
  fontSize: '0.9375rem',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  transition: 'color 150ms ease, background-color 150ms ease',
  '&:hover': { color: 'text.primary', backgroundColor: alpha('#FFC857', 0.08) },
  '&.active': { color: 'primary.main', backgroundColor: alpha('#FFC857', 0.12) },
  '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
};

export default function Navbar({ isHome = false, onOpenMenu, menuOpen = false, onRequestSignIn }) {
  const { authStatus, logout } = useGlobalState();
  const { addError } = useErrors();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = authStatus === AuthenticationStatus.AUTHENTICATED;
  const isCheckingSession = authStatus === AuthenticationStatus.LOADING;

  const handleSignOut = () => {
    logout();
    navigate('/', { replace: true });
  };

  const handleProtectedNavigation = (event, item) => {
    if (!item.protected) return;

    if (!isAuthenticated) {
      event.preventDefault();
      addError('Sign in to open the Dashboard and IoT Network.');
      onRequestSignIn?.();
    }
  };

  const renderItem = (item) => {
    if (isHome && item.sectionId) {
      return (
        <Box
          key={item.label}
          component={ScrollLink}
          to={item.sectionId}
          smooth
          duration={450}
          spy
          hashSpy
          offset={-80}
          sx={linkSx}
        >
          {item.label}
        </Box>
      );
    }

    return (
      <Box
        key={item.label}
        component={NavLink}
        to={item.to}
        onClick={(event) => handleProtectedNavigation(event, item)}
        sx={linkSx}
        aria-current={location.pathname === item.to ? 'page' : undefined}
      >
        {item.label}
      </Box>
    );
  };

  return (
    <AppBar position="sticky" elevation={0}>
      <Container maxWidth="xl" disableGutters sx={{ px: { xs: 2, md: 4 } }}>
        <Toolbar disableGutters sx={{ gap: 1 }}>
          <Tooltip title="CoquiTones home">
            <Box
              component={RouterLink}
              to="/"
              onClick={() => scroll.scrollToTop({ duration: 400 })}
              aria-label="CoquiTones home"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1.25,
                textDecoration: 'none',
                color: 'primary.main',
                mr: { xs: 'auto', md: 2 },
                borderRadius: 2,
                pr: 1,
              }}
            >
              <Box
                component="img"
                src={logo}
                alt=""
                sx={{ width: 40, height: 40, objectFit: 'contain' }}
              />
              <Typography component="span" sx={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.01em' }}>
                CoquiTones
              </Typography>
            </Box>
          </Tooltip>

          <Box
            component="nav"
            aria-label="Primary"
            sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }}
          >
            {NAV_ITEMS.map(renderItem)}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: { md: 'auto' } }}>
            {isAuthenticated ? (
              <Button variant="outlined" color="primary" onClick={handleSignOut} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                Sign out
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={() => onRequestSignIn?.()}
                disabled={isCheckingSession}
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              >
                {isCheckingSession ? 'Checking session…' : 'Sign in'}
              </Button>
            )}

            <IconButton
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={onOpenMenu}
              sx={{ display: { xs: 'inline-flex', md: 'none' }, color: 'primary.main' }}
            >
              <MenuRoundedIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
