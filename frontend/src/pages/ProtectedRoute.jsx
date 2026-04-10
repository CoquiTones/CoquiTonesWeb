import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import GlobalStateManager from '../services/Authentication/GlobalStateManager';
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = GlobalStateManager.getIsAuthenticated();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Render children or nested routes if authenticated
  return children ? children : <Outlet />;
};

export default ProtectedRoute;