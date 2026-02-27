import GlobalStateManager from "../../Authentication/GlobalStateManager";

/**
 * Abstract APIHandler class for managing API calls to backend server
 * 
 */
export default class APIHandlerBase {
    web_url = import.meta.env.VITE_BACKEND_API_URL;

    constructor() { }
    getAuthenticationHeader() {
        const authenticated_header = { 'Authorization': 'Bearer ' + GlobalStateManager.getAuthenticationToken() }
        return authenticated_header;
    }

    async insertAudio(insertAudioRequest) {

        try {

            const response = await fetch(`${this.web_url}/api/audio/insert`, {
                method: "POST",
                body: insertAudioRequest.toFormData(),
                headers: this.authenticated_header
            });

            if (!response.ok) {
                throw new BackendError(`Unable to insert audio in db`);
            }

            const audioId = await response.json();
            return audioId;
        } catch (error) {
            throw APIHandlerError(error.message);
        }
    }
}


