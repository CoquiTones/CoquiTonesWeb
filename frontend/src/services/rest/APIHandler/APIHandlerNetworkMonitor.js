
import APIHandlerBase from "./APIHandlerBase";
import { APIHandlerError, BackendError } from "./Errors";
import { NodeList } from "../ResponseORM/NetworkMonitor/NodeResponse";
import {InsertNewNodeRequest} from "../RequestORM/NetworkMonitor/NewNodeRequest"
export class APIHandlerNetworkMonitor extends APIHandlerBase {
    async get_all_nodes() {
        try {

            const response = await fetch(this.web_url + "/api/node/all", {
                method: "GET",
                headers: this.getAuthenticationHeader()
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

    /**
     * 
     * @param {InsertNewNodeRequest} insert_new_node_request 
     */
    async insert_new_node(insert_new_node_request) {
        try {
            const response = await fetch(this.web_url + "/api/node/insert", {
                method: "POST",
                headers: this.getAuthenticationHeader(),
                body: insert_new_node_request.toFormData()
            })
        } catch (error) {
            console.error("Error Inserting New Node: ", error);
            throw new APIHandlerError("Error Inserting all nodes in API Handler for Network Monitor: " + error.message);
        }
    }
}