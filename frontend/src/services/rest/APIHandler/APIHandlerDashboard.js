import DeleteRecordRequest from '../RequestORM/Dashboard/DeleteRecordRequest';
import RecentDataRequest from '../RequestORM/Dashboard/RecentDataRequest';
import { NodeHealthCheck } from '../ResponseORM/Dashboard/NodeHealthCheck';
import { RecentData } from '../ResponseORM/Dashboard/RecenDataResponse';
import { RecentReports } from '../ResponseORM/Dashboard/RecentEntriesResponse';
import { WeekSpeciesSummary } from '../ResponseORM/Dashboard/WeekSpeciesSummary';
import APIHandlerBase from './APIHandlerBase';
import { APIHandlerError } from './Errors';

export class APIHandlerDashboard extends APIHandlerBase {
  async get_week_species_summary() {
    try {
      const data = await this.request('/api/dashboard/week-species-summary');
      return new WeekSpeciesSummary(data);
    } catch (error) {
      throw new APIHandlerError(`Could not load the weekly species summary: ${error.message}`);
    }
  }

  async get_node_health_check() {
    try {
      const data = await this.request('/api/dashboard/node-health-check');
      return new NodeHealthCheck(data);
    } catch (error) {
      throw new APIHandlerError(`Could not load node health: ${error.message}`);
    }
  }

  async get_recent_reports() {
    try {
      const data = await this.request('/api/dashboard/recent-reports');
      return new RecentReports(data);
    } catch (error) {
      throw new APIHandlerError(`Could not load recent reports: ${error.message}`);
    }
  }

  /**
   * @param {RecentDataRequest} recentDataRequest
   * @returns {Promise<RecentData>}
   */
  async get_recent_data(recentDataRequest) {
    try {
      const data = await this.request('/api/dashboard/recent-data', {
        method: 'POST',
        body: recentDataRequest.toFormData(),
      });
      return new RecentData(data);
    } catch (error) {
      throw new APIHandlerError(`Could not load recent data: ${error.message}`);
    }
  }

  /**
   * @param {DeleteRecordRequest} deleteRecordRequest
   */
  async delete_records(deleteRecordRequest) {
    try {
      return await this.request('/api/dashboard/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: deleteRecordRequest.toJSON(),
      });
    } catch (error) {
      throw new APIHandlerError(`Could not delete the selected records: ${error.message}`);
    }
  }
}

export default APIHandlerDashboard;
