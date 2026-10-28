import Cookies from 'js-cookie';

/**
 * Session cookie storage isolated from React/API modules.
 *
 * Keeping this dependency-free breaks the import cycle
 * APIHandlerBase -> GlobalStateManager -> APIHandlerAuthentication -> APIHandlerBase.
 */
export const SESSION_TOKEN_KEY = 'session_token';
export const ACCESS_TOKEN_EXPIRE_HOURS = 24;

export const getSessionToken = () => Cookies.get(SESSION_TOKEN_KEY);

export const hasSessionToken = () => {
  const token = getSessionToken();
  return Boolean(token && token.length > 0);
};

export const setSessionToken = (sessionToken) => {
  Cookies.set(SESSION_TOKEN_KEY, sessionToken, {
    expires: ACCESS_TOKEN_EXPIRE_HOURS / 24,
    secure: window.location.protocol === 'https:',
    sameSite: 'strict',
  });
};

export const clearSessionToken = () => {
  Cookies.remove(SESSION_TOKEN_KEY);
};
