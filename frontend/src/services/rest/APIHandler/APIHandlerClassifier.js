import APIHandlerBase from "./APIHandlerBase";
import { APIHandlerError, BackendError } from "./Errors";

export class APIHandlerrClassifier extends APIHandlerBase {

    async fetchClassification(rawAudioFile) {
        const formData = new FormData();
        formData.append("file", rawAudioFile);
        try {
            const response = await fetch(this.web_url + "/api/classifier/classify", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new BackendError('Unable to classify audio sample due to network error: ' + response.statusText)
            }
            const classifierReportResponse = await response.json()
            return classifierReportResponse;
        } catch (error) {
            console.error("Error fetching Classification from audio file input : ", error);
            throw new APIHandlerError('Error with fetchClassification in Handler: ' + error.message);
        }
    };
}