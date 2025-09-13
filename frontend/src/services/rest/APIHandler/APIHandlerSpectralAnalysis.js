import APIHandlerBase from "./APIHandlerBase";

export class APIHandlerSpectralAnalysis extends APIHandlerBase {

    async insertAudio(file, nid, timestamp) {
        let formData = new FormData();
        formData.append("nid", nid);
        formData.append("file", file);
        formData.append("timestamp", timestamp)
        console.log(`${this.web_url}/api/${this.endpointType}/insert`);
        try {
            const response = await fetch(`${this.web_url}/api/${this.endpointType}/insert`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Unable to fetch all ${this.endpointType}s `);
            }

            const audioId = await response.json();
            return audioId;
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }
}