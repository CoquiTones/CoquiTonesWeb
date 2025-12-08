/**
 * latest_time, n.ndescription, n.ntype
 */
export class NodeHealthCheck {
    constructor(APIresponse) {
        this.nodeReports = APIresponse.map((report) => (new NodeReport(report)))
    }

    map(callback) {
        return this.nodeReports.map(callback);
    }
}

class NodeReport {
    constructor(APIReponseReport) {
        this.latest_time = APIReponseReport.latest_time;
        this.node_description = APIReponseReport.ndescription;
        this.node_type = APIReponseReport.ntype;

    }
}