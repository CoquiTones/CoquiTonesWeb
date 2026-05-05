import React, { useContext, useEffect, useRef } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useGlobalState, AuthenticationStatus } from '../services/Authentication/GlobalStateManager';
import { ErrorContext } from "../components/shared/ErrorContext"
import CircularProgress from '@mui/material/CircularProgress';
import { ValidationError } from '../services/rest/APIHandler/Errors';

const ProtectedRoute = () => {
  const { authStatus } = useGlobalState();
  const { errors, setErrors } = useContext(ErrorContext);
  const errorAddedRef = useRef(false);

  useEffect(() => {
    if (authStatus === AuthenticationStatus.UNAUTHENTICATED && !errorAddedRef.current) {
      setErrors([...errors, new ValidationError("You must be Signed In to view this page!")])
      errorAddedRef.current = true;
    }
  }, [authStatus])

  if (authStatus === AuthenticationStatus.LOADING) {
    return <CircularProgress />
  }

  if (authStatus === AuthenticationStatus.UNAUTHENTICATED) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
