import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from '../lib/session';
import { API_BASE_URL } from './config';
import type {
  ApiErrorDetail,
  ApiErrorEnvelope,
  ApiMeta,
  ApiSuccessEnvelope,
  AuthTokensApi,
  QueryParams,
} from './types';

export type { ApiMeta, QueryParams } from './types';
export { API_BASE_URL, API_HOST_OVERRIDE, APP_VERSION, SOCKET_URL } from './config';

export interface ApiSuccess<T> {
  data: T;
  meta?: ApiMeta;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
}

export class ApiError extends Error {
  readonly code: string;
  readonly details?: ApiErrorDetail[];
  readonly status: number;

  constructor(
    code: string,
    message: string,
    status: number,
    details?: ApiErrorDetail[],
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const DEVICE_ID_KEY = 'bg_device_id';

let cachedDeviceId: string | null = null;
let refreshInFlight: Promise<boolean> | null = null;
let sessionExpiredListener: (() => void) | null = null;

/** AuthProvider registers so SESSION_EXPIRED can route to G-04. */
export function setSessionExpiredListener(listener: (() => void) | null): void {
  sessionExpiredListener = listener;
}

function emitSessionExpired(): void {
  try {
    sessionExpiredListener?.();
  } catch {
    // ignore listener errors
  }
}

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/$/, '');
  const p = path.replace(/^\//, '');
  return `${b}/${p}`;
}

export function buildQuery(params?: QueryParams): string {
  if (!params) return '';
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    let raw: string;
    if (Array.isArray(value)) {
      raw = value
        .filter((v): v is string | number | boolean => v !== undefined && v !== null)
        .map(String)
        .join(',');
      if (!raw) continue;
    } else {
      raw = String(value);
    }
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(raw)}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

function createDeviceId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36);
  return `${Platform.OS}-${ts}${rand}`;
}

export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) {
    cachedDeviceId = existing;
    return existing;
  }
  const id = createDeviceId();
  cachedDeviceId = id;
  await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

/** Used by the session module / AuthContext; thin wrappers over session getters. */
export function getStoredAccessToken(): string | null {
  return getAccessToken();
}

export function getStoredRefreshToken(): string | null {
  return getRefreshToken();
}

export type ApiRequestOptions = {
  method?: string;
  body?: unknown;
  query?: QueryParams;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  /** Skip the one-shot refresh+retry on 401. */
  skipAuthRefresh?: boolean;
};

function isFormDataBody(body: unknown): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

function parseJsonSafe(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function toApiError(status: number, payload: unknown, fallbackMessage: string): ApiError {
  const envelope = payload as ApiErrorEnvelope | null;
  const err = envelope?.error;
  if (err?.code || err?.message) {
    return new ApiError(
      err.code || 'REQUEST_FAILED',
      err.message || fallbackMessage,
      status,
      err.details,
    );
  }
  return new ApiError('REQUEST_FAILED', fallbackMessage, status);
}

function isAuthExemptPath(path: string): boolean {
  const clean = path.replace(/^\//, '').split('?')[0];
  return (
    clean === 'auth/refresh' ||
    clean === 'auth/customer/otp/send' ||
    clean === 'auth/customer/otp/verify' ||
    clean === 'auth/customer/password/login' ||
    clean === 'auth/customer/password/forgot' ||
    clean === 'auth/customer/password/reset' ||
    clean === 'auth/email/otp/send' ||
    clean === 'auth/email/otp/resend' ||
    clean === 'auth/email/otp/verify'
  );
}

async function tryRefreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      await clearSession();
      return false;
    }

    try {
      const deviceId = await getDeviceId();
      const response = await fetch(joinUrl(API_BASE_URL, 'auth/refresh'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': deviceId,
        },
        body: JSON.stringify({ refreshToken }),
      });

      const text = await response.text();
      const payload = parseJsonSafe(text);

      if (!response.ok) {
        await clearSession();
        return false;
      }

      const data = (payload as ApiSuccessEnvelope<AuthTokensApi> | null)?.data;
      if (!data?.accessToken || !data?.refreshToken) {
        await clearSession();
        return false;
      }

      await saveTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      await clearSession();
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiSuccess<T>> {
  const method = (options.method || 'GET').toUpperCase();
  const query = buildQuery(options.query);
  const url = joinUrl(API_BASE_URL, path) + query;
  const deviceId = await getDeviceId();
  const headers: Record<string, string> = {
    'x-device-id': deviceId,
    'X-Client': 'app',
    ...(options.headers || {}),
  };

  const hasBody = options.body !== undefined && options.body !== null;
  const formData = hasBody && isFormDataBody(options.body);

  if (hasBody && !formData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getAccessToken();
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  let bodyInit: string | FormData | undefined;
  if (hasBody) {
    bodyInit = formData
      ? (options.body as FormData)
      : JSON.stringify(options.body);
  }

  const response = await fetch(url, {
    method,
    headers,
    body: bodyInit,
    signal: options.signal,
  });

  const text = await response.text();
  const payload = parseJsonSafe(text);

  if (
    response.status === 401 &&
    !options.skipAuthRefresh &&
    !isAuthExemptPath(path)
  ) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, skipAuthRefresh: true });
    }
    emitSessionExpired();
    throw new ApiError(
      'SESSION_EXPIRED',
      'Your session has expired. Please sign in again.',
      401,
    );
  }

  if (!response.ok) {
    throw toApiError(
      response.status,
      payload,
      `API request failed: ${response.status}`,
    );
  }

  const envelope = payload as ApiSuccessEnvelope<T> | null;
  if (envelope && typeof envelope === 'object' && 'data' in envelope) {
    return { data: envelope.data, meta: envelope.meta };
  }

  // Some endpoints may return bare payloads; treat as data.
  return { data: payload as T };
}

export type ApiUploadFields = Record<string, string | undefined | null>;

export async function apiUpload<T>(
  path: string,
  file: {
    uri: string;
    name: string;
    type: string;
  },
  fields: ApiUploadFields = {},
  options: Omit<ApiRequestOptions, 'body' | 'method'> = {},
): Promise<ApiSuccess<T>> {
  const form = new FormData();
  form.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) form.append(key, value);
  }

  return apiRequest<T>(path, {
    ...options,
    method: 'POST',
    body: form,
  });
}
