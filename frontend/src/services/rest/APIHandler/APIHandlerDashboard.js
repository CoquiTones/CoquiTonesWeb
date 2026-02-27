import RecentDataRequest from "../RequestORM/Dashboard/RecentDataRequest";
import { NodeHealthCheck } from "../ResponseORM/Dashboard/NodeHealthCheck";
import { RecentData } from "../ResponseORM/Dashboard/RecenDataResponse";
import { RecentReports } from "../ResponseORM/Dashboard/RecentEntriesResponse";
import { WeekSpeciesSummary } from "../ResponseORM/Dashboard/WeekSpeciesSummary";
import APIHandlerBase from "./APIHandlerBase";
import { APIHandlerError, BackendError } from "./Errors";

export class APIHandlerDashboard extends APIHandlerBase {

    async get_week_species_summary() {
        try {
            const response = await fetch(this.web_url + "/api/dashboard/week-species-summary", {
                method: "GET",
                headers: this.getAuthenticationHeader()
            })

            if (!response.ok) {
                throw new BackendError('Unable to retrieve weekly summary due to network error');
            }

            const latestWeekSpeciesSummaryApiResponse = await response.json();
            return new WeekSpeciesSummary(latestWeekSpeciesSummaryApiResponse);
        } catch (error) {
            throw new APIHandlerError('Error with latest week summary in Handler: ' + error.message)
        }
    }
    // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VybmFtZTp0ZXN0dXNlciIsImF1aWQiOjEsImV4cCI6MTc2MDEyMjY4MH0.pyOlThe_J53TDI6s9kLmsSXySYowypXiOL9X4zbevhs
    async get_node_health_check() {
        try {
            const response = await fetch(this.web_url + "/api/dashboard/node-health-check", {
                method: "GET",
                headers: this.getAuthenticationHeader()
            })

            if (!response.ok) {
                throw new BackendError('Unable to retrieve node health check due to network error');
            }

            const nodeHealthCheckApiResponse = await response.json();
            return new NodeHealthCheck(nodeHealthCheckApiResponse);
        } catch (error) {
            throw new APIHandlerError('Error with node health check in Handler: ' + error.message)
        }
    }

    async get_recent_reports() {
        try {
            const response = await fetch(this.web_url + "/api/dashboard/recent-reports", {
                method: "GET",
                headers: this.getAuthenticationHeader()
            })

            if (!response.ok) {
                throw new BackendError('Unable to retrieve recent reports due to network error');
            }

            const recentReportsApiResponse = await response.json();
            return new RecentReports(recentReportsApiResponse);
        } catch (error) {
            throw new APIHandlerError('Error with recent reports in Handler: ' + error.message)
        }
    }

    /**
     * 
     * @param {RecentDataRequest} recentDataRequest 
     * @returns {RecentData}
     */
    async get_recent_data(recentDataRequest) {
        try {
            const response = await fetch(this.web_url + "/api/dashboard/recent-data", {
                method: "POST",
                headers: this.getAuthenticationHeader(),
                body: recentDataRequest.toFormData()
            })

            if (!response.ok) {
                throw new BackendError('Unable to retrieve recent reports due to network error');
            }

            const recentDataAPIResponse = await response.json();
            console.log(recentDataAPIResponse)
            return new RecentData(recentDataAPIResponse);
        } catch (error) {
            throw new APIHandlerError('Error with recent reports in Handler: ' + error.message)
        }
    }
}   