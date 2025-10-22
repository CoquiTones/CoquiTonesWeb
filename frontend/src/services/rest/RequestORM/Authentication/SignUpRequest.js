export class SignUpRequest {

    constructor (username, password) {
        this.username = username;
        this.password = password; 
        // add more fields for user; such as Name, Org, whatever else bs
    }

    toFormData() {
        const formData = new FormData();
        formData.append("username", this.username);
        formData.append("password", this.password);

        return formData;
    }


}