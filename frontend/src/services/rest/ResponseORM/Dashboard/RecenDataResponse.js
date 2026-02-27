/**
 * @export 
 * @class RecentData
 * @typedef {RecentData}
 */
export class RecentData {
    constructor(APIResponseObject) {
        this.recentData = APIResponseObject.map((recentDataEntry) => (
            new recentDataEntry(recentDataEntry)
        ))
    }

    map(callback) {
        return this.recentData.map(callback);
    }
}

class RecentDataEntry {
    constructor(APIResponseObjectRecentDataEntry) {
        this.nid = APIResponseObjectRecentDataEntry.nid;
        this.afid = APIResponseObjectRecentDataEntry.afid;
        this.humidity = APIResponseObjectRecentDataEntry.humidity;
        this.temperature = APIResponseObjectRecentDataEntry.temperature;
        this.pressure = APIResponseObjectRecentDataEntry.pressure;
        this.rain = APIResponseObjectRecentDataEntry.rain;
    }
}

