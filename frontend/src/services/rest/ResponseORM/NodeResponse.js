class Node {
    constructor(nid, ntype, nlatitude, nlongitude, ndescription) {
        this.nid = nid;
        this.ntype = ntype;
        this.nlatitude = nlatitude;
        this.nlongitude = nlongitude;
        this.ndescription = ndescription;
    }

    printNodeInfo() {
        console.log("Node ID: ", this.nid);
        console.log("Node type: ", this.ntype)
        console.log(`Node Location: (lat,lon): [", ${this.lat}, ${this.lon}]`);
        console.log("Node Description: ", this.ndescription);
    }
}

export class NodeList {
    constructor(apiResponse) {
        this.nodeList = apiResponse.map((nodeObject) => (
            new Node(nodeObject.nid, nodeObject.ntype, nodeObject.nlatitude, nodeObject.nlongitude, nodeObject.ndescription)
        ))
    }

    map(callback) {
        return this.nodeList.map(callback)
    }
}
