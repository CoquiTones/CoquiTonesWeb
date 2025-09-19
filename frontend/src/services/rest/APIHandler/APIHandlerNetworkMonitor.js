
import APIHandlerBase from "./APIHandlerBase";
import { APIHandlerError, BackendError } from "./Errors";
import { NodeList } from "../ResponseORM/NetworkMonitor/NodeResponse";
export class APIHandlerNetworkMonitor extends APIHandlerBase {
    async get_all_nodes() {
        try {
            const response = await fetch(this.web_url + "/api/node/all", {
                method: "GET",
            });

            if (!response.ok) {
                throw new BackendError('Unable to get all nodes due to network error: ' + response.statusText)
            }
            const getNodeAPIResopnse = await response.json()
            return new NodeList(getNodeAPIResopnse);
        } catch (error) {
            console.error("Error fetching all nodes : ", error);
            throw new APIHandlerError('Error with fetching all nodes in API Handler: ' + error.message);
        }
    }
}