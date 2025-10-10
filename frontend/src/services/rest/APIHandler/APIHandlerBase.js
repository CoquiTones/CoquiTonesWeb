import Cookies from 'js-cookie';

/**
 * Abstract APIHandler class for managing API calls to backend server
 * 
 * @abstract
 * 
 */
export default class APIHandlerBase {
    web_url = import.meta.env.VITE_BACKEND_API_URL;
    

    getAuthenticationHeader () {
        const authenticated_header = {'Authorization' : 'Bearer ' + Cookies.get('session_token')}
        console.log("Authentication header from hadnler base: " + authenticated_header.Authentication);
        return authenticated_header;
    }
}


