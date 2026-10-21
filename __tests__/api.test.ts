import { ApiError, apiRequest, apiRequestPage } from '../src/api';
import { API_BASE_URL } from '../src/api/config';
import {
  clearSession,
  getSession,
  onSessionExpired,
  saveSession,
} from '../src/api/session';

type Call = { url: string; init: RequestInit };

function respond(status: number, body?: unknown) {
  return Promise.resolve({
    status,
    ok: status >= 200 && status < 300,
    text: () => Promise.resolve(body === undefined ? '' : JSON.stringify(body)),
  } as unknown as Response);
}

const calls: Call[] = [];
let handler: (url: string, init: RequestInit) => Promise<Response>;

beforeEach(async () => {
  calls.length = 0;
  await clearSession();
  (globalThis as any).fetch = jest.fn((url: string, init: RequestInit) => {
    calls.push({ url, init });
    return handler(url, init);
  });
});

const header = (c: Call, name: string) =>
  (c.init.headers as Record<string, string>)[name];

describe('apiRequest', () => {
  it('unwraps { data } and sends the device id, bearer token and JSON body', async () => {
    await saveSession({ accessToken: 'A1', refreshToken: 'R1' });
    handler = () =>
      respond(200, { data: { ok: true }, meta: { requestId: 'r' } });
    const data = await apiRequest<{ ok: boolean }>('/me', {
      method: 'PATCH',
      body: { name: 'Aarav' },
      query: { a: 1, empty: '', list: ['x', 'y'] },
    });
    expect(data).toEqual({ ok: true });
    expect(calls[0].url).toBe(`${API_BASE_URL}/me?a=1&list=x%2Cy`);
    expect(calls[0].init.method).toBe('PATCH');
    expect(calls[0].init.body).toBe(JSON.stringify({ name: 'Aarav' }));
    expect(header(calls[0], 'Authorization')).toBe('Bearer A1');
    expect(header(calls[0], 'x-device-id')).toMatch(/^bg-/);
  });

  it('omits the token for public calls', async () => {
    await saveSession({ accessToken: 'A1', refreshToken: 'R1' });
    handler = () => respond(200, { data: [] });
    await apiRequest('/content', { auth: false });
    expect(header(calls[0], 'Authorization')).toBeUndefined();
  });

  it('raises ApiError with the backend error envelope', async () => {
    handler = () =>
      respond(422, {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid',
          details: [{ field: 'phone', message: 'Enter a valid number' }],
        },
      });
    const err = (await apiRequest('/auth/customer/otp/send', {
      method: 'POST',
      auth: false,
    }).catch(e => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(422);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.details[0].field).toBe('phone');
  });

  it('maps fetch failures to a network error', async () => {
    handler = () => Promise.reject(new TypeError('Network request failed'));
    const err = (await apiRequest('/app/config').catch(e => e)) as ApiError;
    expect(err.isNetwork).toBe(true);
    expect(err.code).toBe('NETWORK_ERROR');
  });

  it('refreshes once for concurrent 401s and retries with the rotated token', async () => {
    await saveSession({ accessToken: 'OLD', refreshToken: 'R1' });
    let refreshes = 0;
    handler = (url, init) => {
      if (url.endsWith('/auth/refresh')) {
        refreshes += 1;
        expect(JSON.parse(String(init.body))).toEqual({ refreshToken: 'R1' });
        return respond(200, {
          data: { accessToken: 'NEW', refreshToken: 'R2' },
        });
      }
      const auth = (init.headers as Record<string, string>).Authorization;
      return auth === 'Bearer NEW'
        ? respond(200, { data: url })
        : respond(401, { error: { code: 'UNAUTHORIZED', message: 'Expired' } });
    };
    const [a, b] = await Promise.all([
      apiRequest<string>('/me'),
      apiRequest<string>('/me/favorites'),
    ]);
    expect(a).toContain('/me');
    expect(b).toContain('/me/favorites');
    expect(refreshes).toBe(1);
    expect(getSession()).toEqual({ accessToken: 'NEW', refreshToken: 'R2' });
  });

  it('ends the session when the refresh token is rejected', async () => {
    await saveSession({ accessToken: 'OLD', refreshToken: 'BAD' });
    const expired = jest.fn();
    const off = onSessionExpired(expired);
    handler = url =>
      url.endsWith('/auth/refresh')
        ? respond(401, {
            error: { code: 'INVALID_REFRESH', message: 'Invalid' },
          })
        : respond(401, { error: { message: 'Expired' } });
    const err = (await apiRequest('/me').catch(e => e)) as ApiError;
    off();
    expect(err.status).toBe(401);
    expect(expired).toHaveBeenCalledTimes(1);
    expect(getSession()).toBeNull();
  });

  it('does not try to refresh for /auth calls', async () => {
    await saveSession({ accessToken: 'A', refreshToken: 'R' });
    handler = () => respond(401, { error: { message: 'Wrong OTP' } });
    await expect(
      apiRequest('/auth/customer/otp/verify', { method: 'POST' }),
    ).rejects.toThrow('Wrong OTP');
    expect(calls).toHaveLength(1);
  });
});

describe('apiRequestPage', () => {
  it('returns list data with pagination meta defaults', async () => {
    handler = () =>
      respond(200, {
        data: [{ id: 1 }],
        meta: { page: 2, total: 41, totalPages: 3 },
      });
    const res = await apiRequestPage<{ id: number }>('/properties', {
      query: { page: 2 },
    });
    expect(res.data).toEqual([{ id: 1 }]);
    expect(res.meta).toEqual({ page: 2, limit: 20, total: 41, totalPages: 3 });
  });
});
