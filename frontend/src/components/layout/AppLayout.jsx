import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';

import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import SignInDialog from '../auth/SignInDialog';
import ErrorSnackbars from '../shared/ErrorSnackbars';
import RouteFallback from '../shared/RouteFallback';

/**
 * Application shell: sticky navbar, mobile drawer, routed page content and
 * footer. Pages no longer mount their own navbar/footer.
 */
export default function AppLayout({ showFooter = true }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', backgroundColor: 'background.default' }}>
      <Box component="a" href="#main-content" className="skip-link">
        Skip to content
      </Box>

      <Navbar
        isHome={isHome}
        menuOpen={sidebarOpen}
        onOpenMenu={() => setSidebarOpen(true)}
        onRequestSignIn={() => setSignInOpen(true)}
      />

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isHome={isHome}
        onRequestSignIn={() => setSignInOpen(true)}
      />

      <Box component="main" id="main-content" tabIndex={-1} sx={{ flex: 1, outline: 'none' }}>
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </Box>

      {showFooter && <Footer />}

      <ErrorSnackbars />
      <SignInDialog
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
        onSignedIn={() => setSignInOpen(false)}
      />
    </Box>
  );
}
