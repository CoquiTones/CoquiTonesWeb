import React, { useContext, useEffect, useRef } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useGlobalState } from '../services/Authentication/GlobalStateManager';
import { ErrorContext } from "../components/shared/ErrorContext"
import CircularProgress from '@mui/material/CircularProgress';
import { ValidationError } from '../services/rest/APIHandler/Errors';

const ProtectedRoute = () => {
  const { isAuthenticated } = useGlobalState();
  const { errors, setErrors } = useContext(ErrorContext);
  const errorAddedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated && !errorAddedRef.current) {
      setErrors([...errors, new ValidationError("You must be Signed In to view this page!")])
      errorAddedRef.current = true;
    }
  }, [isAuthenticated])

  if (isAuthenticated === null) {
    return <CircularProgress />
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
