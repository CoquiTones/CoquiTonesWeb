
export class CheckUserRequest {
    constructor(username, password) {
        this.username = username;
        this.password = password;
    }

    toFormData() {
        let formData = new FormData();
        formData.append("username", this.username);
        formData.append("password", this.password);
        return formData;
    }
}