import GlobalStateManager from "../../Authentication/GlobalStateManager";
import AudioFileRequest from "../RequestORM/Shared/AudioFileRequest";
import InsertAudioRequest from "../RequestORM/SpectralAnalysis/insertAudioRequest";
import { APIHandlerError } from "./Errors";

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

    /**
     * 
     * @param {InsertAudioRequest} insertAudioRequest 
     * @returns 
     */
    async insertAudio(insertAudioRequest) {

        try {

            const response = await fetch(`${this.web_url}/api/audio/insert`, {
                method: "POST",
                body: insertAudioRequest.toFormData(),
                headers: this.getAuthenticationHeader()
            });

            if (!response.ok) {
                throw new BackendError(`Unable to insert audio in db` + response.statusText);
            }

            const audioId = await response.json();
            return audioId;
        } catch (error) {
            throw new APIHandlerError(error.message);
        }
    }

    /**
     * 
     * @param {AudioFileRequest} audioFileRequest 
     */
    async getAudioById(audioFileRequest) {
        try {
            const response = await fetch(`${this.web_url}/api/audio`, {
                method: "POST",
                body: audioFileRequest.toFormData(),
                headers: this.getAuthenticationHeader(),
            })

            if (!response.ok) {
                throw new BackendError('Unable to get Audio File by ID');
            }

            const audioFile = await response.blob();
            return audioFile;
        } catch (error) {
            throw new APIHandlerError(error.message);
        }
    }
}
