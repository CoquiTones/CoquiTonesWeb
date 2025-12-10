import { NodeHealthCheck } from "../ResponseORM/Dashboard/NodeHealthCheck";
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
            console.log("week species summary api response: ",  latestWeekSpeciesSummaryApiResponse)
            return new WeekSpeciesSummary(latestWeekSpeciesSummaryApiResponse);
        } catch (error) {
            throw new APIHandlerError('Error with latest week summary in Handler: ' + error.message)
        }
    }

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
            console.log("node health checkapi response: ", nodeHealthCheckApiResponse)
            return new NodeHealthCheck(nodeHealthCheckApiResponse);
        } catch (error) {
            throw new APIHandlerError('Error with node health check in Handler: ' + error.message)
        }
    }

    async get_recent_reports(recentReportsRequest) {
        try {
            const response = await fetch(this.web_url + "/api/dashboard/recent-reports", {
                method: "GET",
                headers: this.getAuthenticationHeader(),
                body: recentReportsRequest.toFormData()
            })

            if (!response.ok) {
                throw new BackendError('Unable to retrieve recent reports due to network error');
            }

            const recentReportsApiResponse = await response.json();
            console.log("recent reports api response: ", recentReportsApiResponse)
            return new RecentReports(recentReportsApiResponse);
        } catch (error) {
            throw new APIHandlerError('Error with recent reports in Handler: ' + error.message)
        }
    }
}   