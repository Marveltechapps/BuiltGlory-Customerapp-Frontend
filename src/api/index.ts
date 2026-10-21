import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './config';
import {
  clearSession,
  emitSessionExpired,
  getDeviceId,
  getSession,
  saveSession,
} from './session';
import type { ApiErrorDetail, PageMeta } from '../types/api';

type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number>;
type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface RequestOptions {
  method?: Method;
  query?: Record<string, QueryValue>;
  /** JSON body. */
  body?: unknown;
  /** Multipart body (document uploads). */
  formData?: FormData;
  /** Attach the bearer token when a session exists. Defaults to true. */
  auth?: boolean;
  signal?: AbortSignal;
}

/** Error raised for non-2xx responses (`{ error: { code, message, details } }`) and network failures. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ApiErrorDetail[];
  readonly requestId?: string;

  constructor(
    status: number,
    code: string,
    message: string,
    details: ApiErrorDetail[] = [],
    requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }

  get isNetwork() {
    return this.code === 'NETWORK_ERROR' || this.code === 'TIMEOUT';
  }
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const url = `${API_BASE_URL}/${path.replace(/^\//, '')}`;
  if (!query) return url;
  const parts: string[] = [];
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    const encoded = Array.isArray(value) ? value.join(',') : String(value);
    if (Array.isArray(value) && !value.length) continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(encoded)}`);
  }
  return parts.length ? `${url}?${parts.join('&')}` : url;
}

async function send(
  path: string,
  options: RequestOptions,
  accessToken: string | undefined,
) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'x-device-id': await getDeviceId(),
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  let body: string | FormData | undefined;
  if (options.formData) body = options.formData;
  else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const outer = options.signal;
  const onOuterAbort = () => controller.abort();
  outer?.addEventListener('abort', onOuterAbort);
  try {
    return await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body,
      signal: controller.signal,
    });
  } catch (error) {
    if (outer?.aborted) throw error;
    if (controller.signal.aborted) {
      throw new ApiError(
        0,
        'TIMEOUT',
        'The server took too long to respond. Please try again.',
      );
    }
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'No internet connection. Please check your network and try again.',
    );
  } finally {
    clearTimeout(timer);
    outer?.removeEventListener('abort', onOuterAbort);
  }
}

async function parse(
  response: Response,
): Promise<{
  data?: unknown;
  meta?: Partial<PageMeta> & { requestId?: string };
}> {
  if (response.status === 204) return {};
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(
      response.status,
      'INVALID_RESPONSE',
      'Received an unexpected response from the server.',
    );
  }
}

function toError(status: number, payload: any): ApiError {
  const err = payload?.error;
  const message =
    (typeof err === 'object' && err?.message) ||
    (typeof err === 'string' && err) ||
    payload?.message ||
    `Request failed (${status})`;
  const details = Array.isArray(err?.details) ? err.details : [];
  return new ApiError(
    status,
    err?.code ?? `HTTP_${status}`,
    message,
    details,
    payload?.meta?.requestId,
  );
}

// Refresh tokens rotate on every use, so concurrent 401s must share one refresh call.
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const session = getSession();
  if (!session?.refreshToken) return null;
  if (!refreshing) {
    refreshing = (async () => {
      const response = await send(
        '/auth/refresh',
        { method: 'POST', body: { refreshToken: session.refreshToken } },
        undefined,
      );
      const payload = await parse(response);
      if ([401, 403, 409].includes(response.status)) {
        // Rejected, expired or reused refresh token: the session is over.
        await clearSession();
        emitSessionExpired();
        return null;
      }
      if (!response.ok) throw toError(response.status, payload);
      const data = payload.data as {
        accessToken: string;
        refreshToken: string;
      };
      await saveSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      return data.accessToken;
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

async function execute(path: string, options: RequestOptions = {}) {
  const useAuth = options.auth !== false;
  const token = useAuth ? getSession()?.accessToken : undefined;
  let response = await send(path, options, token);
  if (response.status === 401 && token && !path.startsWith('/auth/')) {
    const next = await refreshAccessToken();
    if (!next) {
      const payload = await parse(response).catch(() => ({}));
      throw toError(401, payload);
    }
    response = await send(path, options, next);
  }
  const payload = await parse(response);
  if (!response.ok) throw toError(response.status, payload);
  return payload;
}

/** Calls `{API_BASE_URL}/{path}` and returns the `data` member of the `{ data, meta }` envelope. */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const payload = await execute(path, options);
  return payload.data as T;
}

/** Same as `apiRequest`, also returning pagination meta for list endpoints. */
export async function apiRequestPage<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: T[]; meta: PageMeta }> {
  const payload = await execute(path, options);
  const meta = payload.meta ?? {};
  return {
    data: (payload.data as T[]) ?? [],
    meta: {
      page: meta.page ?? 1,
      limit: meta.limit ?? 20,
      total: meta.total ?? 0,
      totalPages: meta.totalPages ?? 0,
    },
  };
}
