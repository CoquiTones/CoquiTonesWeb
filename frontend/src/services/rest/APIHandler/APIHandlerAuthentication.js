import APIHandlerBase from "./APIHandlerBase";
import { APIHandlerError, BackendError } from "./Errors";
export class APIHandlerAuthentication extends APIHandlerBase {

    async validateUserExists(checkUserRequest) {
        try {
            const response = await fetch(this.web_url + "/api/authentication/checkuser", {
                method: "POST",
                body: checkUserRequest.toFormData(),
            });

            if (!response.ok) {
                throw new BackendError('Unable to check if user exists: ' + response.statusText)
            }
            const validateUserExists = await response.json()
            const getUser = new (validateUserExists);
            return getUser;
        } catch (error) {
            throw new APIHandlerError('Error with validating user in Handler: ' + error.message);
        }
    };
}