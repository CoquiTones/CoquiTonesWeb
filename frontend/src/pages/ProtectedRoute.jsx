import React, { useContext, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import GlobalStateManager from '../services/Authentication/GlobalStateManager';
import { ValidationError } from '../services/rest/APIHandler/Errors';
import { ErrorContext } from '../components/shared/ErrorContext';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = GlobalStateManager.getIsAuthenticated();
  const { errors, setErrors } = useContext(ErrorContext);

  useEffect(() => {
    if (!isAuthenticated) {
      setErrors([...errors, new ValidationError('You must sign in before accessing this page')]);
    }
  }, [isAuthenticated, setErrors]);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Render children or nested routes if authenticated
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
