import APIHandlerBase from "./APIHandlerBase";
import { BackendError, APIHandlerError } from "./Errors";
export class APIHandlerSpectralAnalysis extends APIHandlerBase {

    async insertAudio(insertAudioRequest) {

        try {

            const response = await fetch(`${this.web_url}/api/audio/insert`, {
                method: "POST",
                body: insertAudioRequest.toFormData(),
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