export class insertAuudioRequest {
    endpoint = "/api/audio/insert"
    constructor(audioFile, nodeID, timestamp) {
        this.audioFile = audioFile;
        this.nodeID = nodeID;
        this.timestamp = timestamp;
    }

    toFormData() {
        let formData = new FormData();
        formData.append("nid", this.nodeID);
        formData.append("file", this.audioFile);
        formData.append("timestamp", this.timestamp);

        return formData;
    }
}