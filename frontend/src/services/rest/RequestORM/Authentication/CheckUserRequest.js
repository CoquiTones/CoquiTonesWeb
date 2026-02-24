
export class AuthenticateUserRequest {
    constructor(username, password) {
        this.username = username;
        this.password = password;
    }

    toFormData() {
        let formData = new FormData();
        formData.append("username", this.username);
        formData.append("password", this.password);
        formData.append("grant_type", "password");
        return formData;
    }
}