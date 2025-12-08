import Cookies from 'js-cookie';

class GlobalStateManager {
    static ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24; // 1day 
    static SESSION_TOKEN_KEY  = 'session_token'

    /**
     * 
     * @returns string: authentication token
     */
    static getAuthenticationToken() {
        return Cookies.get(this.SESSION_TOKEN_KEY);
    }

    /**
     * 
     * @returns boolean
     */
    static getIsAuthenticated() {
        const isAuthenticated = Cookies.get(this.SESSION_TOKEN_KEY) ? true : false;
        return isAuthenticated;
    }
    
    static setAuthenticationToken(session_token) {
        Cookies.set(this.SESSION_TOKEN_KEY, session_token, {
                expires: this.ACCESS_TOKEN_EXPIRE_MINUTES, 
                secure: true,
                sameSite: 'strict'
            })
        
    }

    /**
     * Clears Authentication information
     *
     */
    static clearAuthenticationToken() {
        Cookies.remove(this.SESSION_TOKEN_KEY);
    }

    
}

export default GlobalStateManager;