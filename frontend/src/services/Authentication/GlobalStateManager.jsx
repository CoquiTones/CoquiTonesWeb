import Cookies from 'js-cookie';
import { APIHandlerAuthentication } from '../rest/APIHandler/APIHandlerAuthentication';
import React, { createContext, useState, useCallback, useEffect } from 'react';

class GlobalStateManager {
    static ACCESS_TOKEN_EXPIRE_HOURS = 24;
    static SESSION_TOKEN_KEY = 'session_token'

    static getAuthenticationToken() {
        return Cookies.get(this.SESSION_TOKEN_KEY);
    }

    static setAuthenticationToken(session_token) {
        Cookies.set(this.SESSION_TOKEN_KEY, session_token, {
            expires: this.ACCESS_TOKEN_EXPIRE_HOURS / 24,
            secure: true,
            sameSite: 'strict'
        })
    }

    static clearAuthenticationToken() {
        Cookies.remove(this.SESSION_TOKEN_KEY);
    }
}

// Create Context
export const GlobalStateContext = createContext();

export const AuthenticationStatus = {
    AUTHENTICATED: "AUTHENTICATED",
    LOADING: "LOADING", // used for initial state or when fetching
    UNAUTHENTICATED: "UNAUTHENTICATED"

}
// Provider Component
export const GlobalStateProvider = ({ children }) => {
    // Single state: 'loading' | AuthenticationStatus.AUTHENTICATED | 'unauthenticated'
    const [authStatus, setAuthStatus] = useState(AuthenticationStatus.LOADING);
    useEffect(() => {
        const initialCheckAuth = async () => {
            const token = GlobalStateManager.getAuthenticationToken();

            if (token !== undefined) {
                const apiHandlerAuthentication = new APIHandlerAuthentication();
                const authenticated = await apiHandlerAuthentication.isUserAuthenticated();
                setAuthStatus(authenticated ? AuthenticationStatus.AUTHENTICATED : AuthenticationStatus.UNAUTHENTICATED);
            } else {
                setAuthStatus(AuthenticationStatus.UNAUTHENTICATED);
            }
        }
        initialCheckAuth()
    }, []);

    const login = useCallback((token) => {
        GlobalStateManager.setAuthenticationToken(token);
        setAuthStatus(AuthenticationStatus.AUTHENTICATED);
    }, []);

    const logout = useCallback(() => {
        GlobalStateManager.clearAuthenticationToken();
        setAuthStatus(AuthenticationStatus.UNAUTHENTICATED);
    }, []);

    const getAuthenticationToken = useCallback(() => {
        return GlobalStateManager.getAuthenticationToken();
    }, []);

    return (
        <GlobalStateContext.Provider value={{ authStatus, login, logout, getAuthenticationToken }}>
            {children}
        </GlobalStateContext.Provider>
    );
};

export const useGlobalState = () => {
    const context = React.useContext(GlobalStateContext);
    if (!context) {
        throw new Error('useGlobalState must be used within GlobalStateProvider');
    }
    return context;
};

export default GlobalStateManager;
