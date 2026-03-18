export default class DeleteRecordRequest {

    /**
     * 
     * @param {int[]} selected_row_ids : Array with timestampindex id's that are to be deleted, cascading deltion of audiofile, audioslice, weatherdata
     */
    constructor(selected_row_ids) {
        this.selected_row_ids = selected_row_ids;
        this.listOfRecords = selected_row_ids.map((timestampindex_id) => (
            {
                "timestamp_index_id": timestampindex_id
            }
        ))
    }

    /**
     * 
     * @returns {FormData}
     */
    toFormData() {
        let formData = new FormData();
        formData.append("list_of_records_to_be_deleted", JSON.stringify(this.listOfRecords));
        return formData;
    }

    toJSON() {
        return JSON.stringify(this.listOfRecords)
    }
}