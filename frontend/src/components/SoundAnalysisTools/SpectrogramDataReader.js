import WorkerFactory from "../../services/WorkerFactory";
import generateBasicSpecData from "../../services/SpectogramFetch"





export const handleLoad = async (file, type) => {
    try {

        const workerInstance = new WorkerFactory(generateBasicSpecData)
        workerInstance.postMessage({ file: file, type: type })
        // Remap data to a 2D matrix
        let parsed;
        let promise = new Promise((resolve, reject) => {
            workerInstance.onmessage = (event) => {
                parsed = event.data
                resolve(event.data)
            }
        })

        return promise;
    } catch (error) {
        // Handle errors
        console.error(error)
        console.error("Error loading and processing audio:", error);
        throw error;
    }
}

