import Cookies from 'js-cookie';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { APIHandlerAuthentication } from '../rest/APIHandler/APIHandlerAuthentication';

class GlobalStateManager {
  static ACCESS_TOKEN_EXPIRE_HOURS = 24;
  static SESSION_TOKEN_KEY = 'session_token';

  static getAuthenticationToken() {
    return Cookies.get(this.SESSION_TOKEN_KEY);
  }

  static hasAuthenticationToken() {
    const token = this.getAuthenticationToken();
    return Boolean(token && token.length > 0);
  }

  static setAuthenticationToken(sessionToken) {
    Cookies.set(this.SESSION_TOKEN_KEY, sessionToken, {
      expires: this.ACCESS_TOKEN_EXPIRE_HOURS / 24,
      secure: window.location.protocol === 'https:',
      sameSite: 'strict',
    });
  }

  static clearAuthenticationToken() {
    Cookies.remove(this.SESSION_TOKEN_KEY);
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
      if (!GlobalStateManager.hasAuthenticationToken()) {
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
    GlobalStateManager.setAuthenticationToken(token);
    setAuthStatus(AuthenticationStatus.AUTHENTICATED);
  }, []);

  const logout = useCallback(() => {
    GlobalStateManager.clearAuthenticationToken();
    setAuthStatus(AuthenticationStatus.UNAUTHENTICATED);
  }, []);

  const getAuthenticationToken = useCallback(
    () => GlobalStateManager.getAuthenticationToken(),
    [],
  );

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
