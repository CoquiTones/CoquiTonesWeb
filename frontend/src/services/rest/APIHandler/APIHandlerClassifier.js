import APIHandlerBase from "./APIHandlerBase";
import { APIHandlerError, BackendError } from "./Errors";
import ClassifierReport from "../ResponseORM/Classifier/ClassifierReport";
import { ClassifyAudioRequest } from "../RequestORM/Classifier/ClassifyAudioRequest";
export class APIHandlerClassifier extends APIHandlerBase {

    /**
     * 
     * @param {ClassifyAudioRequest} classifyAudioRequest 
     * @returns {ClassifierReport}
     */
    async fetchClassification(classifyAudioRequest) {
        try {
            const response = await fetch(this.web_url + "/api/classifier/classify", {
                method: "POST",
                body: classifyAudioRequest.toFormData(),
            });

            if (!response.ok) {
                throw new BackendError(response.statusText)
            }
            const classifierReportResponse = await response.json()
            const report = new ClassifierReport(classifierReportResponse);
            return report;
        } catch (error) {
            throw new APIHandlerError('Error with classifying audio file: ' + error.message);
        }
    };
}