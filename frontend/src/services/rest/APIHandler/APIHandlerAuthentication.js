import APIHandlerBase from "./APIHandlerBase";
import { APIHandlerError, BackendError } from "./Errors";
 import { AuthenticateUserResponse } from "../ResponseORM/Authentication/AuthenticateUserResponse";
export class APIHandlerAuthentication extends APIHandlerBase {

    async getSessionTokenIfUserExists(checkUserRequest) {
        try {
            const response = await fetch(this.web_url + "/api/token", {
                method: "POST",
                body: checkUserRequest.toFormData(),
            });

            if (!response.ok) {
                throw new BackendError('Unable to check if user exists: ' + response.statusText)
            }
            const validateUserExists = await response.json();
            const token = new AuthenticateUserResponse(validateUserExists);
            return token;
        } catch (error) {
            throw new APIHandlerError("Incorrect Username or Password")
            // return false;
        }
    };
}