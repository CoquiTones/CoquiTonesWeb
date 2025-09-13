import APIHandlerBase from "./APIHandlerBase";
import { APIHandlerError, BackendError } from "./Errors";

export class APIHandlerDashboard extends APIHandlerBase {

    async get_week_species_summary() {
        try {
            const response = await fetch(this.web_url + "/api/dashboard/week-species-summary", {
                method: "GET"
            })

            if (!response.ok) {
                throw new BackendError('Unable to retrieve weekly summary due to network error');
            }

            const latestWeekSpeciesSummaryApiResponse = await response.json();
            return latestWeekSpeciesSummaryApiResponse;
        } catch (error) {
            console.error("Error fetching latest week species summary");
            throw new APIHandlerError('Error with latest week summary in Handler: ' + error.message)
        }
    }

    async get_node_health_check() {
        try {
            const response = await fetch(this.web_url + "/api/dashboard/node-health-check", {
                method: "GET"
            })

            if (!response.ok) {
                throw new BackendError('Unable to retrieve node health check due to network error');
            }

            const nodeHealthCheckApiResponse = await response.json();
            return nodeHealthCheckApiResponse;
        } catch (error) {
            console.error("Error fetching latest node health check");
            throw new APIHandlerError('Error with node health check in Handler: ' + error.message)
        }
    }

    async get_recent_reports() {
        try {
            const response = await fetch(this.web_url + "/api/dashboard/recent-reports", {
                method: "GET"
            })

            if (!response.ok) {
                throw new BackendError('Unable to retrieve recent reports due to network error');
            }

            const recentReportsApiResponse = await response.json();
            return recentReportsApiResponse;
        } catch (error) {
            console.error("Error fetching latest recent reports");
            throw new APIHandlerError('Error with recent reports in Handler: ' + error.message)
        }
    }
}   