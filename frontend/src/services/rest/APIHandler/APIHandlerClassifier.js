import APIHandlerBase from "./APIHandlerBase";
import { APIHandlerError, BackendError } from "./Errors";
import ClassifierReport from "../ResponseORM/Classifier/ClassifierReport";
export class APIHandlerClassifier extends APIHandlerBase {

    async fetchClassification(classifyAudioRequest) {
        try {
            const response = await fetch(this.web_url + "/api/classifier/classify", {
                method: "POST",
                body: classifyAudioRequest.toFormData(),
            });

            if (!response.ok) {
                throw new BackendError('Unable to classify audio sample due to network error: ' + response.statusText)
            }
            const classifierReportResponse = await response.json()
            const report = new ClassifierReport(classifierReportResponse);
            return report;
        } catch (error) {
            console.error("Error fetching Classification from audio file input : ", error);
            throw new APIHandlerError('Error with fetchClassification in Handler: ' + error.message);
        }
    };
}