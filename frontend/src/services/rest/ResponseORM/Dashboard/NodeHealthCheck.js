import { parseApiDate } from '../../../../utils/format';

/**
 * Wrapper for `/api/dashboard/node-health-check`.
 */
export class NodeHealthCheck {
  constructor(APIresponse = []) {
    this.nodeReports = Array.isArray(APIresponse)
      ? APIresponse.map((report) => new NodeReport(report))
      : [];
  }

  map(callback) {
    return this.nodeReports.map(callback);
  }

  get length() {
    return this.nodeReports.length;
  }

  toArray() {
    return [...this.nodeReports];
  }
}

class NodeReport {
  constructor(APIReponseReport) {
    this.latest_time = APIReponseReport.latest_time;
    this.node_description = APIReponseReport.ndescription;
    this.node_type = APIReponseReport.ntype;

    const parsed = parseApiDate(this.latest_time);
    this.latestTimestamp = Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
  }
}

export default NodeHealthCheck;
