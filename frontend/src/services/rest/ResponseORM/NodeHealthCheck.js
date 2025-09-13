/**
 * latest_time, n.ndescription, n.ntype
 */
export class NodeHealthCheck {
    constructor(APIresponse) {
        this.latest_time = APIresponse.latest_time;
        this.ndescription = APIresponse.ndescription;
        this.ntype = APIresponse.ntype;
    }
}