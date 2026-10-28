export class Node {
  constructor(nid, ntype, nlatitude, nlongitude, ndescription, nname) {
    this.nid = nid;
    this.nname = nname;
    this.ntype = ntype;
    this.nlatitude = nlatitude;
    this.nlongitude = nlongitude;
    this.ndescription = ndescription;
  }

  get hasLocation() {
    const latitude = Number(this.nlatitude);
    const longitude = Number(this.nlongitude);
    return Number.isFinite(latitude) && Number.isFinite(longitude);
  }

  getNodeIdFormData() {
    const formData = new FormData();
    formData.append('nid', this.nid);
    return formData;
  }
}

/**
 * Immutable-ish list wrapper around the `/api/node/*` responses.
 */
export class NodeList {
  constructor(apiResponse = []) {
    this.nodeList = Array.isArray(apiResponse)
      ? apiResponse.map(
          (nodeObject) =>
            new Node(
              nodeObject.nid,
              nodeObject.ntype,
              nodeObject.nlatitude,
              nodeObject.nlongitude,
              nodeObject.ndescription,
              nodeObject.nname,
            ),
        )
      : [];
  }

  get length() {
    return this.nodeList.length;
  }

  map(callback) {
    return this.nodeList.map(callback);
  }

  filter(callback) {
    return this.nodeList.filter(callback);
  }

  find(callback) {
    return this.nodeList.find(callback);
  }

  toArray() {
    return [...this.nodeList];
  }

  isEmpty() {
    return this.nodeList.length === 0;
  }

  [Symbol.iterator]() {
    return this.nodeList[Symbol.iterator]();
  }
}

export default NodeList;
