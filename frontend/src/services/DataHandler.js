
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}

export default class DataHandler {
    allowedEndpointTypes = ["node", "timestamp", "report", "weather", "audio"];
    web_url = import.meta.env.VITE_BACKEND_API_URL;

    constructor(endpointType) {
        if (this.allowedEndpointTypes.includes(endpointType)) {
            this.endpointType = endpointType;
        } else {
            throw new ValidationError(`Endpoint "${endpointType}" is not one of the defined endpoints`);
        }
    }

    async get_all() {
        try {
            const response = await fetch(`${this.web_url}/api/${this.endpointType}/all`);
            if (!response.ok) {
                throw new Error(`Unable to fetch all ${this.endpointType}s `);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Error fetch all ${this.endpointType}s: `, error);
            throw error;
        }
    }

    async get_from_id(id) {
        try {
            const response = await fetch(`${this.web_url}/api/${this.endpointType}/${id}`);
            if (!response.ok) {
                throw new Error(`Unable to fetch all ${this.endpointType}s `);

            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Error fetch from ${this.endpointType}s: with id: ${id}`, error);
            throw error;
        }
    }

    async get_from_timestamp(timestamp) {
        try {
            const response = await fetch(`${this.web_url}/api/${this.endpointType}/timestamp?${timestamp}`);
            if (!response.ok) {
                throw new Error(`Unable to fetch all ${this.endpointType}s `);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }
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


