export class InsertNewNodeRequest {
    endpoint = "/api/node/insert"
    constructor(node_type, node_longitude, node_latitude, node_description, node_name, node_client_password) {
        this.node_type = node_type;
        this.node_longitude = node_longitude;
        this.node_latitude = node_latitude;
        this.node_description = node_description;
        this.node_name = node_name;
        this.node_client_password = node_client_password;
    }

    toFormData() {
        let formData = new FormData();
        formData.append("ntype", this.node_type);
        formData.append("nlongitude", this.node_longitude);
        formData.append("nlatitude", this.node_latitude);
        formData.append("ndescription", this.node_description);
        formData.append("nname", this.node_name)
        formData.append("node_client_password", this.node_client_password)
        return formData;
    }
}