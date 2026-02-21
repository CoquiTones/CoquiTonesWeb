import GlobalStateManager from "../../Authentication/GlobalStateManager";

/**
 * Abstract APIHandler class for managing API calls to backend server
 * 
 * @abstract
 * 
 */
export default class APIHandlerBase {
    web_url = import.meta.env.VITE_BACKEND_API_URL;
    

    getAuthenticationHeader () {
        const authenticated_header = {'Authorization' : 'Bearer ' + GlobalStateManager.getAuthenticationToken()}
        return authenticated_header;
    }
}


