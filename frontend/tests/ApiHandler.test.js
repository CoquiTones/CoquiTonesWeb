import { afterEach, describe, expect, it, vi } from 'vitest';

import APIHandlerBase from '../src/services/rest/APIHandler/APIHandlerBase';

const makeRequest = (afid = 101) => ({
  toFormData: () => {
    const formData = new FormData();
    formData.append('afid', String(afid));
    return formData;
  },
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('APIHandlerBase audio endpoints', () => {
  it('downloads audio from the backend trailing-slash route', async () => {
    const blob = { type: 'audio/wav' };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      blob: async () => blob,
    });
    vi.stubGlobal('fetch', fetchMock);

    const handler = new APIHandlerBase();
    handler.web_url = 'https://example.test';

    const result = await handler.getAudioById(makeRequest());

    expect(result).toBe(blob);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('https://example.test/api/audio/');
    expect(options.method).toBe('POST');
    expect(options.body).toBeInstanceOf(FormData);
  });

  it('uploads audio to /api/audio/insert', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ afid: 1 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const handler = new APIHandlerBase();
    handler.web_url = 'https://example.test';

    await handler.insertAudio(makeRequest());

    expect(fetchMock.mock.calls[0][0]).toBe('https://example.test/api/audio/insert');
  });

  it('surfaces backend failures as errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 405,
        statusText: 'Method Not Allowed',
      }),
    );

    const handler = new APIHandlerBase();
    handler.web_url = 'https://example.test';

    await expect(handler.getAudioById(makeRequest())).rejects.toThrow(/405/);
  });

  it('preserves structured backend error details', async () => {
    const payload = {
      detail: {
        message: 'A newer manual report exists for this recording.',
        latest_report_id: 8,
      },
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        statusText: 'Conflict',
        json: async () => payload,
      }),
    );

    const handler = new APIHandlerBase();
    handler.web_url = 'https://example.test';

    await expect(handler.getAudioById(makeRequest())).rejects.toMatchObject({
      status: 409,
      detail: payload.detail,
      payload,
    });
  });

  it('aborts a request that never answers', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url, options) =>
          new Promise((_resolve, reject) => {
            options.signal.addEventListener('abort', () => {
              const error = new Error('aborted');
              error.name = 'AbortError';
              reject(error);
            });
          }),
      ),
    );

    const handler = new APIHandlerBase();
    handler.web_url = 'https://example.test';

    await expect(
      handler.request('/api/node/insert', { method: 'POST', timeoutMs: 5 }),
    ).rejects.toThrow(/timed out after 5 ms/);
  });
});
