import APIHandlerBase from "./APIHandlerBase";
import { APIHandlerError, BackendError } from "./Errors";
import { AuthenticateUserResponse } from "../ResponseORM/Authentication/AuthenticateUserResponse";
import { AuthenticateUserRequest } from "../RequestORM/Authentication/CheckUserRequest";
import { SignUpResponse } from "../ResponseORM/Authentication/SignUpResponse";
import { SignUpRequest } from "../RequestORM/Authentication/SignUpRequest";
import Cookies from 'js-cookie';
export class APIHandlerAuthentication extends APIHandlerBase {

    ACCESS_TOKEN_EXPIRE_MINUTES = 30

    /**
     * Sets session token in if user is successfully authenticated. 
     * 
     * @param {AuthenticateUserRequest} checkUserRequest 
     * @returns true if authenticated else false
     */
    async setSessionTokenIfUserExists(checkUserRequest) {
        try {
            const response = await fetch(this.web_url + "/api/token", {
                method: "POST",
                body: checkUserRequest.toFormData(),
            });

            if (!response.ok) {
                throw new BackendError('Unable to check if user exists: ' + response.statusText)
            }
            const validateUserExists = await response.json();
            const authenticationResponse = new AuthenticateUserResponse(validateUserExists);
            Cookies.set('session_token', authenticationResponse.session_token, {
                expires: this.ACCESS_TOKEN_EXPIRE_MINUTES, 
                secure: true,
                sameSite: 'strict'
            })
            return true;
        } catch (error) {
            // catch error and output something to UI?
            // log / register auth attempts
            console.error(error)
            return false;
        }
    };

    /**
     * 
     * @param {SignUpRequest} newUserRequest 
     * @returns true if was success else false
     */
    async SignUpNewUser(newUserRequest) {
        try {
            const response = await fetch (this.web_url + "/api/createuser", {
                method: "POST",
                body: newUserRequest.toFormData()
            })
                        if (!response.ok) {
                throw new BackendError('Unable to check if user exists: ' + response.statusText)
            }
            const apiResponse = await response.json();
            const authenticationResponse = new SignUpResponse(apiResponse);
            return authenticationResponse.wasSuccessful();
        } catch (error) {
            console.error(error)
            return false;
        }
    }


}