import { Form } from "react-router-dom";

export default class RecentDataRequest {
    constructor(minTimestamp, maxTimestamp) {
        this.minTimestamp = minTimestamp;
        this.maxTimestamp = maxTimestamp;
    }

    toFormData() {
        const formData = new FormData();
        formData.append("minTimestamp", this.minTimestamp);
        formData.append("maxTimestamp", this.maxTimestamp);

        return formData;
    }
}