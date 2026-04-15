import React, { useContext, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useGlobalState } from '../services/Authentication/GlobalStateManager';

const ProtectedRoute = () => {
  const { isAuthenticated, errors, setErrors } = useGlobalState();

  // Still loading
  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    setErrors([...errors, "You must be Signed in to access this page!"])
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
