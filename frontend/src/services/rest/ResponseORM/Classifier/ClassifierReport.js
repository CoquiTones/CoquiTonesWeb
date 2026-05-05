/**
 * Encapsulation of API response for classification endpoint (/api/report/classify)
 * 
 * @param (json response object)
 */
export default class ClassifierReport {

    constructor(APIResponseJsonData) {
        this.slices = Object.keys(APIResponseJsonData).map((slice) => (
            new SliceReport(APIResponseJsonData[slice])
        ))
    }

    map(callback) {
        return this.slices.map(callback);
    }

    slice(start, end) {
        return this.slices.slice(start, end);
    }

    get length() {
        return this.slices.length;
    }
}

class SliceReport {
    constructor(APIReponseJsonDataSlice) {
        this.start_time = APIReponseJsonDataSlice.start_time;
        this.end_time = APIReponseJsonDataSlice.end_time;
        this.coqui = APIReponseJsonDataSlice.coqui;
        this.wightmanae = APIReponseJsonDataSlice.wightmanae;
        this.gryllus = APIReponseJsonDataSlice.gryllus;
        this.portoricensis = APIReponseJsonDataSlice.portoricensis;
        this.unicolor = APIReponseJsonDataSlice.unicolor;
        this.hedricki = APIReponseJsonDataSlice.hedricki;
        this.locustus = APIReponseJsonDataSlice.locustus;
        this.richmondi = APIReponseJsonDataSlice.richmondi;
    }
}
