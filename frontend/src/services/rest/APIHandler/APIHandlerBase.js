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
    this.timeout_ms = 60000;
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
   *   timeoutMs?: number,
   * }} [options]
   */
  async request(
    path,
    {
      method = 'GET',
      body,
      headers = {},
      auth = true,
      expect = 'json',
      timeoutMs = this.timeout_ms,
    } = {},
  ) {
    if (!this.web_url) {
      throw new BackendError('The API URL is not configured. Set VITE_BACKEND_API_URL.');
    }

    // Always bound the request: a backend stall or a proxy that never answers
    // must not leave the UI stuck on a loading state forever.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.web_url}${path}`, {
        method,
        body,
        headers: {
          ...(auth ? this.getAuthenticationHeader() : {}),
          ...headers,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const detail = response.statusText ? ` ${response.statusText}` : '';
        throw new BackendError(`${method} ${path} failed (${response.status}${detail}).`);
      }

      if (expect === 'none') return null;
      if (expect === 'blob') return response.blob();
      if (expect === 'text') return response.text();
      return response.json();
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw new BackendError(`${method} ${path} timed out after ${timeoutMs} ms.`);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
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
