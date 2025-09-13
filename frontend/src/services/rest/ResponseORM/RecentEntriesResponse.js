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
        this.ndescription = APIResponseObject.ndescription;
        this.ttime = APIResponseObject.ttime;
        this.coqui = APIResponseObject.coqui;
        this.wightmanae = APIResponseObject.wightmanae;
        this.gryllus = APIResponseObject.gryllus;
        this.portoricensis = APIResponseObject.portoricensis;
        this.unicolor = APIResponseObject.unicolor;
        this.hedricki = APIResponseObject.hedricki;
        this.locustus = APIResponseObject.locustus;
        this.richmondi = APIResponseObject.richmondi;
        this.wdhumidity = APIResponseObject.wdhumidity;
        this.wdpressure = APIResponseObject.wdpressure;
        this.wdtemperature = APIResponseObject.wdtemperature;
        this.wddid_rain = APIResponseObject.wddid_rain;
        this.afid = APIResponseObject.afid;
    }
}