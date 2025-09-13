
/**
 * 
 * As of now, this is the response of classify endpont: 
 * 
 * example: 
 * {
  *"slice1": { 
   *   "start_time": 0,
   *   "end_time": 10,
   *   "E. coqui": true,
   *   ...
   *},
   *"slice2": ...
}
 */


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
    getSlices() {
        return this.slices;
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