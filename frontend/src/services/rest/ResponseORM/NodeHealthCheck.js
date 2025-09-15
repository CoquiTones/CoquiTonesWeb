/**
 * latest_time, n.ndescription, n.ntype
 */
export class NodeHealthCheck {
    constructor(APIresponse) {

        this.latest_time = APIresponse[0].latest_time;
        this.ndescription = APIresponse[0].ndescription;
        this.ntype = APIresponse[0].ntype;
    }
}