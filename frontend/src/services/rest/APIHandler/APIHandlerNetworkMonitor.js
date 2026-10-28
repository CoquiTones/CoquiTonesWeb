import APIHandlerBase from './APIHandlerBase';
import { APIHandlerError } from './Errors';
import { NodeList } from '../ResponseORM/NetworkMonitor/NodeResponse';
import { InsertNewNodeRequest } from '../RequestORM/NetworkMonitor/NewNodeRequest';

export class APIHandlerNetworkMonitor extends APIHandlerBase {
  /** @returns {Promise<NodeList>} */
  async get_all_nodes() {
    try {
      const data = await this.request('/api/node/all');
      return new NodeList(data);
    } catch (error) {
      throw new APIHandlerError(`Could not load the node list: ${error.message}`);
    }
  }

  /**
   * @param {InsertNewNodeRequest} insertNewNodeRequest
   */
  async insert_new_node(insertNewNodeRequest) {
    try {
      await this.request('/api/node/insert', {
        method: 'POST',
        body: insertNewNodeRequest.toFormData(),
        expect: 'none',
      });
    } catch (error) {
      throw new APIHandlerError(`Could not add the node: ${error.message}`);
    }
  }

  /** @returns {Promise<NodeList>} */
  async get_nodes_with_no_client() {
    try {
      const data = await this.request('/api/node/noclient');
      return new NodeList(data);
    } catch (error) {
      throw new APIHandlerError(`Could not check MQTT client status: ${error.message}`);
    }
  }

  /**
   * @param {import('../ResponseORM/NetworkMonitor/NodeResponse').Node} node
   * @param {string} clientPassword
   */
  async create_client_for_node(node, clientPassword) {
    try {
      const formData = new FormData();
      formData.append('nid', node.nid);
      formData.append('password', clientPassword);
      const data = await this.request('/api/node/mqtt', {
        method: 'POST',
        body: formData,
      });
      return data?.nodeCreationStatus;
    } catch (error) {
      throw new APIHandlerError(`Could not create an MQTT client for node ${node.nid}: ${error.message}`);
    }
  }
}

export default APIHandlerNetworkMonitor;
