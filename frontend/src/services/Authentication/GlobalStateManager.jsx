import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { APIHandlerAuthentication } from '../rest/APIHandler/APIHandlerAuthentication';
import {
  ACCESS_TOKEN_EXPIRE_HOURS,
  SESSION_TOKEN_KEY,
  clearSessionToken,
  getSessionToken,
  hasSessionToken,
  setSessionToken,
} from './sessionToken';

class GlobalStateManager {
  static ACCESS_TOKEN_EXPIRE_HOURS = ACCESS_TOKEN_EXPIRE_HOURS;
  static SESSION_TOKEN_KEY = SESSION_TOKEN_KEY;

  static getAuthenticationToken() {
    return getSessionToken();
  }

  static hasAuthenticationToken() {
    return hasSessionToken();
  }

  static setAuthenticationToken(sessionToken) {
    setSessionToken(sessionToken);
  }

  static clearAuthenticationToken() {
    clearSessionToken();
  }
}

export const GlobalStateContext = createContext(null);

export const AuthenticationStatus = Object.freeze({
  AUTHENTICATED: 'AUTHENTICATED',
  LOADING: 'LOADING',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
});

export const GlobalStateProvider = ({ children }) => {
  const [authStatus, setAuthStatus] = useState(AuthenticationStatus.LOADING);

  useEffect(() => {
    let cancelled = false;

    const checkInitialAuth = async () => {
      if (!hasSessionToken()) {
        if (!cancelled) setAuthStatus(AuthenticationStatus.UNAUTHENTICATED);
        return;
      }

      try {
        const apiHandler = new APIHandlerAuthentication();
        const authenticated = await apiHandler.isUserAuthenticated();
        if (!cancelled) {
          setAuthStatus(
            authenticated
              ? AuthenticationStatus.AUTHENTICATED
              : AuthenticationStatus.UNAUTHENTICATED,
          );
        }
      } catch {
        if (!cancelled) setAuthStatus(AuthenticationStatus.UNAUTHENTICATED);
      }
    };

    checkInitialAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback((token) => {
    setSessionToken(token);
    setAuthStatus(AuthenticationStatus.AUTHENTICATED);
  }, []);

  const logout = useCallback(() => {
    clearSessionToken();
    setAuthStatus(AuthenticationStatus.UNAUTHENTICATED);
  }, []);

  const getAuthenticationToken = useCallback(() => getSessionToken(), []);

  const value = useMemo(
    () => ({ authStatus, login, logout, getAuthenticationToken }),
    [authStatus, login, logout, getAuthenticationToken],
  );

  return (
    <GlobalStateContext.Provider value={value}>
      {children}
    </GlobalStateContext.Provider>
  );
};

export const useGlobalState = () => {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
};

export default GlobalStateManager;
