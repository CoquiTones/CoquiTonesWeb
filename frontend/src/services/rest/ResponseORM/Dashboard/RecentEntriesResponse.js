/** @file 
 * 
 * 
 *         class ReportTableEntry:
            ndescription:   str
            ttime:          datetime
            coqui:          int
            wightmanae:     int
            gryllus:        int
            portoricensis:  int
            unicolor:       int
            hedricki:       int
            locustus:       int
            richmondi:      int
            wdhumidity:     float
            wdtemperature:  float
            wdpressure:     float
            wddid_rain:     bool
            afid:           int # Front end should generate URL to audio file by using get audio file endpoint

 */




/**
 * Encapsulation of expected API response to recent entries endpoint
 *
 * @export
 * @class RecentEntries
 * @typedef {RecentReports}
 */
export class RecentReports {
    constructor(APIResponseObject) {
        // this  is proabably a list that needs to map to this 
        this.recentReports = APIResponseObject.map((report) => (
            new Report(report)
        ));
    }

    map(callback) {
        return this.recentReports.map(callback);
    }
}

class Report {
    constructor(APIResponseObjectReport) {

        this.ndescription = APIResponseObjectReport.ndescription;
        this.ttime = APIResponseObjectReport.ttime;
        this.coqui = APIResponseObjectReport.coqui;
        this.wightmanae = APIResponseObjectReport.wightmanae;
        this.gryllus = APIResponseObjectReport.gryllus;
        this.portoricensis = APIResponseObjectReport.portoricensis;
        this.unicolor = APIResponseObjectReport.unicolor;
        this.hedricki = APIResponseObjectReport.hedricki;
        this.locustus = APIResponseObjectReport.locustus;
        this.richmondi = APIResponseObjectReport.richmondi;
        this.wdhumidity = APIResponseObjectReport.wdhumidity;
        this.wdpressure = APIResponseObjectReport.wdpressure;
        this.wdtemperature = APIResponseObjectReport.wdtemperature;
        this.wddid_rain = APIResponseObjectReport.wddid_rain;
        this.afid = APIResponseObjectReport.afid;
    }


}