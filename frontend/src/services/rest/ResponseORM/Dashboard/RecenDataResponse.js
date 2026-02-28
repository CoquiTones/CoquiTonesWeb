/**
 * @export 
 * @class RecentData
 * @typedef {RecentData}
 */
export class RecentData {
    constructor(APIResponseObject) {
        let id = 1;
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
        this.id = id;
        this.nid = APIResponseObjectRecentDataEntry.nid;
        this.afid = APIResponseObjectRecentDataEntry.afid;
        this.humidity = APIResponseObjectRecentDataEntry.humidity;
        this.temperature = APIResponseObjectRecentDataEntry.temperature;
        this.pressure = APIResponseObjectRecentDataEntry.pressure;
        this.rain = APIResponseObjectRecentDataEntry.rain;
        this.time = new Date(APIResponseObjectRecentDataEntry.time).toLocaleString();
    }
}

