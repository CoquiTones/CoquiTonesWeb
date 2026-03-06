export default class DeleteRecordRequest {

    /**
     * 
     * @param {Array} selected_rows 
     */
    constructor(selected_rows) {
        this.selected_rows = selected_rows;
        console.log("Delete Request rows", selected_rows);
    }

    /**
     * 
     * @returns {FormData}
     */
    toFormData() {
        let formData = new FormData();
        formData.append("list_of_records_to_be_deleted", JSON.stringify(this.selected_rows));
        return formData;
    }
}