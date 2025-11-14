import Cookies from 'js-cookie';

class GlobalStateManager {
    ACCESS_TOKEN_EXPIRE_MINUTES = 60
    static getAuthenticationToken() {
        return Cookies.get('session_token');
    }

    static getIsAuthenticated() {
        return Cookies.get('session_token') ? true : false;
    }
    
    static setAuthenticationToken(session_token) {
        Cookies.set('session_token', session_token, {
                expires: this.ACCESS_TOKEN_EXPIRE_MINUTES, 
                secure: true,
                sameSite: 'strict'
            })
    }

    
}

export default GlobalStateManager;