/**
 * @export 
 * @class RecentData
 * @typedef {RecentData}
 */
export class RecentData {
    constructor(APIResponseObject) {
        let id = 1
        this.recentData = APIResponseObject.map((recentDataEntry) => (
            new RecentDataEntry(recentDataEntry, id++)
        ))
    }

    map(callback) {
        return this.recentData.map(callback);
    }

    getData() {
        return this.recentData;
    }
}

class RecentDataEntry {
    constructor(APIResponseObjectRecentDataEntry, id) {
        this.id = id
        this.tid = APIResponseObjectRecentDataEntry.tid; // record id is timestampindex id, can be then used to delete entire record since this table is what we use to basically bind the audio and weather data
        this.nid = APIResponseObjectRecentDataEntry.nid;
        this.afid = APIResponseObjectRecentDataEntry.afid;
        this.humidity = APIResponseObjectRecentDataEntry.humidity;
        this.temperature = APIResponseObjectRecentDataEntry.temperature;
        this.pressure = APIResponseObjectRecentDataEntry.pressure;
        this.rain = APIResponseObjectRecentDataEntry.rain;
        this.time = new Date(APIResponseObjectRecentDataEntry.time).toLocaleString();
    }
}

