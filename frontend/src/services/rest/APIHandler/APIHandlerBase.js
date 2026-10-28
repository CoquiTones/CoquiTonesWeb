import { getSessionToken } from '../../Authentication/sessionToken';
import { BackendError } from './Errors';

/**
 * Small fetch wrapper shared by every API handler.
 *
 * Keeps authentication, base URL resolution, error normalization and response
 * decoding in one place instead of repeating `fetch(...)` per endpoint.
 */
export default class APIHandlerBase {
  constructor() {
    this.web_url = import.meta.env.VITE_BACKEND_API_URL ?? '';
  }

  getAuthenticationHeader() {
    const token = getSessionToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * @param {string} path
   * @param {{
   *   method?: string,
   *   body?: BodyInit,
   *   headers?: Record<string,string>,
   *   auth?: boolean,
   *   expect?: 'json'|'blob'|'text'|'none',
   * }} [options]
   */
  async request(path, { method = 'GET', body, headers = {}, auth = true, expect = 'json' } = {}) {
    if (!this.web_url) {
      throw new BackendError('The API URL is not configured. Set VITE_BACKEND_API_URL.');
    }

    const response = await fetch(`${this.web_url}${path}`, {
      method,
      body,
      headers: {
        ...(auth ? this.getAuthenticationHeader() : {}),
        ...headers,
      },
    });

    if (!response.ok) {
      const detail = response.statusText ? ` ${response.statusText}` : '';
      throw new BackendError(`${method} ${path} failed (${response.status}${detail}).`);
    }

    if (expect === 'none') return null;
    if (expect === 'blob') return response.blob();
    if (expect === 'text') return response.text();
    return response.json();
  }

  /**
   * Persist an uploaded audio file.
   * @param {import('../RequestORM/SpectralAnalysis/insertAudioRequest').default} insertAudioRequest
   */
  async insertAudio(insertAudioRequest) {
    return this.request('/api/audio/insert', {
      method: 'POST',
      body: insertAudioRequest.toFormData(),
    });
  }

  /**
   * The backend exposes this route at `/api/audio/` (trailing slash). Calling
   * `/api/audio` without it returns 405 instead of redirecting for POST.
   * @param {import('../RequestORM/Shared/AudioFileRequest').default} audioFileRequest
   * @returns {Promise<Blob>}
   */
  async getAudioById(audioFileRequest) {
    return this.request('/api/audio/', {
      method: 'POST',
      body: audioFileRequest.toFormData(),
      expect: 'blob',
    });
  }
}
