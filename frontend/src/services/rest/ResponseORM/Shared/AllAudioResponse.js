/**
 * @export 
 * @class AllAudio
 * @typedef {AllAudio}
 */
export class AllAudioResponse {
    constructor(APIResponseObject) {
        let id = 1
        this.allAudio = APIResponseObject.map((allAudioEntry) => (
            new AllAudioEntry(allAudioEntry, id++)
        ))
    }

    map(callback) {
        return this.allAudio.map(callback);
    }

    getData() {
        return this.allAudio;
    }
}
// list of audio id's with timestamp, node id and 
class AllAudioEntry {
    constructor(APIResponseObjectAllAudioEntry, id) {
        this.id = id;
        this.nid = APIResponseObjectAllAudioEntry.nid;
        this.afid = APIResponseObjectAllAudioEntry.afid;
        this.time = new Date(APIResponseObjectAllAudioEntry.time).toLocaleString();
    }
}

