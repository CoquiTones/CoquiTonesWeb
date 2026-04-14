import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useGlobalState } from '../services/Authentication/GlobalStateManager';

const ProtectedRoute = () => {
  const { isAuthenticated } = useGlobalState();

  // Still loading
  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
