import APIHandlerBase from './APIHandlerBase';
import { APIHandlerError } from './Errors';
import { AuthenticateUserResponse } from '../ResponseORM/Authentication/AuthenticateUserResponse';
import { AuthenticateUserRequest } from '../RequestORM/Authentication/CheckUserRequest';
import { SignUpResponse } from '../ResponseORM/Authentication/SignUpResponse';
import { SignUpRequest } from '../RequestORM/Authentication/SignUpRequest';
import { clearSessionToken } from '../../Authentication/sessionToken';

export class APIHandlerAuthentication extends APIHandlerBase {
  /**
   * Validates credentials and stores the returned session token.
   *
   * @param {AuthenticateUserRequest} checkUserRequest
   * @param {(token: string) => void} login
   * @returns {Promise<boolean>} true when authenticated
   */
  async setSessionTokenIfUserExists(checkUserRequest, login) {
    try {
      const data = await this.request('/api/token', {
        method: 'POST',
        body: checkUserRequest.toFormData(),
        auth: false,
      });
      const authenticationResponse = new AuthenticateUserResponse(data);
      const sessionToken = authenticationResponse.session_token;

      if (!sessionToken) return false;
      login(sessionToken);
      return true;
    } catch (error) {
      console.error('Sign in failed', error);
      return false;
    }
  }

  /**
   * @param {SignUpRequest} newUserRequest
   * @returns {Promise<boolean>}
   */
  async SignUpNewUser(newUserRequest) {
    try {
      const data = await this.request('/api/createuser', {
        method: 'POST',
        body: newUserRequest.toFormData(),
        auth: false,
      });
      return new SignUpResponse(data).wasSuccessful();
    } catch (error) {
      console.error('Sign up failed', error);
      return false;
    }
  }

  /**
   * @returns {Promise<boolean>}
   */
  async isUserAuthenticated() {
    try {
      const data = await this.request('/api/authenticated');
      const isAuthenticated = Boolean(data?.is_authenticated);

      if (!isAuthenticated) {
        clearSessionToken();
      }

      return isAuthenticated;
    } catch (error) {
      console.error('Session check failed', error);
      return false;
    }
  }
}

export default APIHandlerAuthentication;
