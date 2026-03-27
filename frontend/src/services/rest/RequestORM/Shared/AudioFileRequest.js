export default class AudioFileRequest {
    constructor(id) {
        this.afid = id;
    }

    toFormData() {
        let formdata = new FormData();
        formdata.append("afid", this.afid);
        return formdata
    }
}