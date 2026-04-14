export class Node {
    constructor(nid, ntype, nlatitude, nlongitude, ndescription, nname) {
        this.nid = nid;
        this.nname = nname;
        this.ntype = ntype;
        this.nlatitude = nlatitude;
        this.nlongitude = nlongitude;
        this.ndescription = ndescription;
    }

    printNodeInfo() {
        console.log("Node ID: ", this.nid);
        console.log("Node name: ", this.nname)
        console.log("Node type: ", this.ntype)
        console.log(`Node Location: (lat,lon): [", ${this.lat}, ${this.lon}]`);
        console.log("Node Description: ", this.ndescription);
    }

    getNodeIdFormData() {
        let formData = new FormData();
        formData.append("nid", this.nid);
        return formData;
    }
}

/**
 * Array of Node {Node} Objects
 */
export class NodeList {
    constructor(apiResponse) {
        this.nodeList = []
        this.nodeList = apiResponse.map((nodeObject) => (
            new Node(nodeObject.nid, nodeObject.ntype, nodeObject.nlatitude, nodeObject.nlongitude, nodeObject.ndescription, nodeObject.nname)
        ))
    }

    map(callback) {
        return this.nodeList.map(callback)
    }

    isEmpty() {
        return this.nodeList.length === 0;
    }

    find(callback) {
        return this.nodeList.find(callback)
    }
}


