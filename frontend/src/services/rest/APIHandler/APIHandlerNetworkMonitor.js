
import APIHandlerBase from "./APIHandlerBase";
import { APIHandlerError, BackendError } from "./Errors";
import { Node, NodeList } from "../ResponseORM/NetworkMonitor/NodeResponse";
import { InsertNewNodeRequest } from "../RequestORM/NetworkMonitor/NewNodeRequest"
// import NodeDeleteRequest from "../RequestORM/NetworkMonitor/NodeDeleteRequest";
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

    /**
     * 
     * @returns {NodeList}
     */
    async get_nodes_with_no_client() {
        try {
            const response = await fetch(this.web_url + "/api/node/noclient", {
                method: "GET",
                headers: this.getAuthenticationHeader(),
            })

            if (!response.ok) {
                throw new BackendError("Network error when attempting to retrieve list of nodse with no mqtt client");
            }
            const apiResponseObject = await response.json()
            return new NodeList(apiResponseObject);
        } catch (error) {
            console.error("Error with Getting Node Sync with MQTT");
            throw new APIHandlerError("Error with Getting Node Sync with MQTT" + error.message);
        }
    }

    /**
     * 
     * @param {Node} node 
     */
    async create_client_for_node(node) {
        try {
            const response = await fetch(this.web_url + "/api/node/mqtt", {
                method: "POST",
                headers: this.getAuthenticationHeader(),
                body: node.getNodeIdFormData()
            });

            if (!response.ok) {
                throw new BackendError("Network error when attempting to add client for node  with no mqtt client");
            }

            const apiResponseObject = await response.json();
            return true;
        } catch (error) {
            console.error("Error with Creating client for node");
            throw new APIHandlerError("Error with creating client for node" + node.nid);
        }
    }
}