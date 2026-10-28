import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import RouteFallback from '../components/shared/RouteFallback';
import { useErrors } from '../components/shared/ErrorContext';
import {
  AuthenticationStatus,
  useGlobalState,
} from '../services/Authentication/GlobalStateManager';

/**
 * Guards the authenticated area. Session status is resolved by
 * `GlobalStateProvider`, so this only renders a loader, a redirect, or the
 * protected route tree.
 */
export default function ProtectedRoute() {
  const { authStatus } = useGlobalState();
  const { addError } = useErrors();
  const location = useLocation();

  useEffect(() => {
    if (authStatus === AuthenticationStatus.UNAUTHENTICATED) {
      addError('Sign in to view the Dashboard and IoT Network.');
    }
  }, [authStatus, addError, location.pathname]);

  if (authStatus === AuthenticationStatus.LOADING) {
    return <RouteFallback label="Checking your session…" />;
  }

  if (authStatus === AuthenticationStatus.UNAUTHENTICATED) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
