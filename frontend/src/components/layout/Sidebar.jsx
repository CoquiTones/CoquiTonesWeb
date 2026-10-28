import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { Link as ScrollLink } from 'react-scroll';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

import { NAV_ITEMS } from '../../config/navigation';
import {
  AuthenticationStatus,
  useGlobalState,
} from '../../services/Authentication/GlobalStateManager';
import { useErrors } from '../shared/ErrorContext';

export default function Sidebar({ open, onClose, isHome = false, onRequestSignIn }) {
  const { authStatus, logout } = useGlobalState();
  const { addError } = useErrors();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = authStatus === AuthenticationStatus.AUTHENTICATED;

  const handleProtected = (event, item) => {
    if (!item.protected || isAuthenticated) return;
    event.preventDefault();
    addError('Sign in to open the Dashboard and IoT Network.');
    onClose();
    onRequestSignIn?.();
  };

  const handleSignOut = () => {
    logout();
    onClose();
    if (location.pathname === '/') navigate('/');
    else navigate('/', { replace: true });
  };

  const navContent = (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }} role="presentation">
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography component="p" variant="overline" color="primary" sx={{ m: 0 }}>
          Menu
        </Typography>
        <IconButton aria-label="Close navigation menu" onClick={onClose}>
          <CloseRoundedIcon />
        </IconButton>
      </Box>

      <Box component="nav" id="mobile-navigation" aria-label="Mobile">
        <List disablePadding>
          {NAV_ITEMS.map((item) =>
            isHome && item.sectionId ? (
              <ListItem key={item.label} disablePadding>
                <ListItemButton
                  component={ScrollLink}
                  to={item.sectionId}
                  smooth
                  duration={450}
                  offset={-80}
                  onClick={onClose}
                  sx={{ borderRadius: 2, mb: 0.5 }}
                >
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ) : (
              <ListItem key={item.label} disablePadding>
                <ListItemButton
                  component={RouterLink}
                  to={item.to}
                  onClick={(event) => {
                    handleProtected(event, item);
                    if (!(item.protected && !isAuthenticated)) onClose();
                  }}
                  selected={location.pathname === item.to}
                  sx={{ borderRadius: 2, mb: 0.5 }}
                >
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ),
          )}
        </List>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'grid', gap: 1.5 }}>
        {isAuthenticated ? (
          <Button variant="outlined" onClick={handleSignOut} fullWidth>
            Sign out
          </Button>
        ) : (
          <Button
            variant="contained"
            fullWidth
            disabled={authStatus === AuthenticationStatus.LOADING}
            onClick={() => {
              onClose();
              onRequestSignIn?.();
            }}
          >
            Sign in
          </Button>
        )}
        <Button component={RouterLink} to="/SignUp" variant="text" fullWidth onClick={onClose}>
          Create account
        </Button>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 'auto', pt: 3 }}>
        Open-source acoustic monitoring for amphibian conservation.
      </Typography>
    </Box>
  );

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      slotProps={{ paper: { sx: { width: { xs: '86vw', sm: 360 }, maxWidth: 400 } } }}
    >
      {navContent}
    </Drawer>
  );
}
