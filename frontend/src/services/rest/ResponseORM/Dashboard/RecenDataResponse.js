import { parseApiDate } from '../../../../utils/format';

/**
 * Wrapper for the `/api/dashboard/recent-data` response.
 */
export class RecentData {
  constructor(APIResponseObject = []) {
    let id = 1;
    this.recentData = Array.isArray(APIResponseObject)
      ? APIResponseObject.map((entry) => new RecentDataEntry(entry, id++))
      : [];
  }

  map(callback) {
    return this.recentData.map(callback);
  }

  getData() {
    return this.recentData;
  }

  get length() {
    return this.recentData.length;
  }
}

class RecentDataEntry {
  constructor(APIResponseObjectRecentDataEntry, id) {
    this.id = id;
    // Timestamp-index id: deleting it cascades to audio + weather rows.
    this.tid = APIResponseObjectRecentDataEntry.tid;
    this.nid = APIResponseObjectRecentDataEntry.nid;
    this.afid = APIResponseObjectRecentDataEntry.afid;
    this.humidity = APIResponseObjectRecentDataEntry.humidity;
    this.temperature = APIResponseObjectRecentDataEntry.temperature;
    this.pressure = APIResponseObjectRecentDataEntry.pressure;
    this.rain = APIResponseObjectRecentDataEntry.rain;

    const parsed = parseApiDate(APIResponseObjectRecentDataEntry.time);
    this.timestamp = Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
    this.time = Number.isNaN(parsed.getTime())
      ? String(APIResponseObjectRecentDataEntry.time ?? '—')
      : parsed.toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        });
  }
}
