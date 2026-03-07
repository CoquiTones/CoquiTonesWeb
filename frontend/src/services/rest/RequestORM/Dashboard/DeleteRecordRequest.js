export default class DeleteRecordRequest {

    /**
     * 
     * @param {Array} selected_row_ids : Array with timestampindex id's that are to be deleted, cascading deltion of audiofile, audioslice, weatherdata
     */
    constructor(selected_row_ids) {
        this.selected_row_ids = selected_row_ids;
        console.log("Delete Request rows", selected_row_ids);
    }

    /**
     * 
     * @returns {FormData}
     */
    toFormData() {
        let formData = new FormData();
        formData.append("list_of_records_to_be_deleted", JSON.stringify(this.selected_row_ids));
        return formData;
    }
}