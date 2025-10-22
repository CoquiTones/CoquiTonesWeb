export class SignUpResponse {

    constructor(apiResponse) {
        this.success = apiResponse.message === "success"
    }

    wasSuccessful() {
        return this.success;
    }
}