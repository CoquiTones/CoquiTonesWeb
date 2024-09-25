
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}

class DataHandler {
    allowedEndpointTypes = ["node", "timestamp", "report", "weather", "audio"];
    web_url = process.env.REACT_APP_WEB_URL || 'http://localhost:8080';

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

    /**
     * Fetch Classification 
     * @returns 
     */
    async fetchClassification(rawAudioFile) {
        const web_url = process.env.REACT_APP_WEB_URL || "http://localhost:8080";
        const formData = new FormData();
        formData.append("file", rawAudioFile);
        try {
            return await fetch(web_url + "/api/ml/classify", {
                method: "POST",
                body: formData,
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("Network response was not ok");
                    }
                    return response.json();
                })
                .then((data) => {
                    return data;
                })
                .catch((error) => {
                    console.error("Error:", error);
                    throw error; // Re-throw the error for further handling
                });

        } catch (error) {
            console.error("Error in Classification : ", error);
            throw error;
        }
    }
}



export default DataHandler;
