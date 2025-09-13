import ClassifierReport from "../ResponseORM/ClassifierReport";
import APIHandlerBase from "./APIHandlerBase";
import { APIHandlerError, BackendError } from "./Errors";

export class APIHandlerNetworkMonitor extends APIHandlerBase {
    async get_all_ducks() {
        try {
            const response = await fetch(this.web_url + "/api/node/all", {
                method: "GET",
            });

            if (!response.ok) {
                throw new BackendError('Unable to get all nodes due to network error: ' + response.statusText)
            }
            const classifierReportAPIResponse = await response.json()
            return new ClassifierReport(classifierReportAPIResponse);
        } catch (error) {
            console.error("Error fetching all nodes : ", error);
            throw new APIHandlerError('Error with fetching all nodes in API Handler: ' + error.message);
        }
    }
}