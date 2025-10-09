import { APIHandlerError, ValidationError, BackendError } from "./Errors";
/**
 * Abstract APIHandler class for managing API calls to backend server
 * 
 * @abstract
 * 
 */
export default class APIHandlerBase {
    web_url = import.meta.env.VITE_BACKEND_API_URL;
}


