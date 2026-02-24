import Cookies from 'js-cookie';
import { APIHandlerAuthentication } from '../rest/APIHandler/APIHandlerAuthentication';
class GlobalStateManager {
    static ACCESS_TOKEN_EXPIRE_MINUTES = 30;
    static SESSION_TOKEN_KEY = 'session_token'

    /**
     * 
     * @returns string: authentication token | undeifned
     */
    static getAuthenticationToken() {
        return Cookies.get(this.SESSION_TOKEN_KEY);
    }

    /**
     * 
     * @returns boolean
     */
    static getIsAuthenticated() {
        let isAuthenticated = false;
        if (this.getAuthenticationToken() !== undefined) {
            const apiHandlerAuthentication = new APIHandlerAuthentication();
            isAuthenticated = apiHandlerAuthentication.isUserAuthenticated();
        }

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