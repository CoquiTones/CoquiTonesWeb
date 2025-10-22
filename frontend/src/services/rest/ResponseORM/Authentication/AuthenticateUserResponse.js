export class AuthenticateUserResponse {
    constructor(apiResponse) {
        this.session_token = apiResponse.access_token;
        this.token_type = apiResponse.token_type;
    }
}