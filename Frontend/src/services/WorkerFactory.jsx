export default class WorkerFactory {
    constructor(workerFunction) {
        const workerCode = workerFunction.toString();
        const workerBlob = new Blob([`(${workerCode})()`], { type: 'application/javascript' })
        return new Worker(URL.createObjectURL(workerBlob))
    }
}