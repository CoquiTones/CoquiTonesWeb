
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}

export default class DataHandler {
    allowedEndpointTypes = ["node", "timestamp", "report", "weather", "audio"];
    web_url = import.meta.env.BASE_URL;

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
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    async get_from_id(id) {
        try {
            const response = await fetch(`${this.web_url}/api/${this.endpointType}/${id}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    async get_from_timestamp(timestamp) {
        try {
            const response = await fetch(`${this.web_url}/api/${this.endpointType}/timestamp?${timestamp}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }
}
