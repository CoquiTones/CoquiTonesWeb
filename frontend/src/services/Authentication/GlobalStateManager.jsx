import Cookies from 'js-cookie';
import { APIHandlerAuthentication } from '../rest/APIHandler/APIHandlerAuthentication';
import React, { createContext, useState, useCallback, useEffect } from 'react';

class GlobalStateManager {
    static ACCESS_TOKEN_EXPIRE_HOURS = 24;
    static SESSION_TOKEN_KEY = 'session_token'

    /**
     * @returns string: authentication token | undefined
     */
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

    /**
     * Clears Authentication information
     */
    static clearAuthenticationToken() {
        Cookies.remove(this.SESSION_TOKEN_KEY);
    }
}

// Create Context
export const GlobalStateContext = createContext();

// Provider Component
export const GlobalStateProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading

    // Check authentication only once on mount
    useEffect(() => {
        const token = GlobalStateManager.getAuthenticationToken();

        if (token !== undefined) {
            const apiHandlerAuthentication = new APIHandlerAuthentication();
            const authenticated = apiHandlerAuthentication.isUserAuthenticated();
            setIsAuthenticated(authenticated);
        } else {
            setIsAuthenticated(false);
        }
    }, []);

    // Expose methods to update auth state
    const login = useCallback((token) => {
        GlobalStateManager.setAuthenticationToken(token);
        setIsAuthenticated(true);
    }, []);

    const logout = useCallback(() => {
        GlobalStateManager.clearAuthenticationToken();
        setIsAuthenticated(false);
    }, []);

    const getAuthenticationToken = useCallback(() => {
        return GlobalStateManager.getAuthenticationToken();
    }, []);

    return (
        <GlobalStateContext.Provider value={{ isAuthenticated, login, logout, getAuthenticationToken }}>
            {children}
        </GlobalStateContext.Provider>
    );
};

// Custom Hook
export const useGlobalState = () => {
    const context = React.useContext(GlobalStateContext);
    if (!context) {
        throw new Error('useGlobalState must be used within GlobalStateProvider');
    }
    return context;
};

export default GlobalStateManager;
