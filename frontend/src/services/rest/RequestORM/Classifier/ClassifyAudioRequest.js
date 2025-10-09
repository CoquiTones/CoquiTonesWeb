export class ClassifyAudioRequest {
    endpoint = "/api/classifier/classify";
    constructor(rawAudioFile) {
        this.audioFile = rawAudioFile;
    }

    toFormData() {
        let formData = new FormData();
        formData.append("file", this.audioFile);
        return formData;
    }
}