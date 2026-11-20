import { Platform } from 'react-native';

/**
 * Optional override for physical devices or custom environments.
 * Prefer EXPO_PUBLIC_API_BASE_URL / API_BASE_URL env (OBS-10 / QA blocked mobile testing).
 * Examples:
 *   'http://192.168.1.10:5001/api/v1'   (LAN debug)
 *   'http://10.0.2.2:5101/api/v1'       (emulator → isolated QA API)
 *   'https://api.builtglory.com/api/v1' (production)
 * Leave empty to use the platform default for the current build type.
 */
declare const process: {
  env: {
    API_BASE_URL?: string;
    EXPO_PUBLIC_API_BASE_URL?: string;
  };
};

/** Inlined from the shell or this app's `.env` when Metro bundles the app. */
const envApiBase = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || '';

export const API_HOST_OVERRIDE = envApiBase;

/** Production HTTPS API (used for release builds unless overridden). */
export const PRODUCTION_API_BASE_URL = 'https://api.builtglory.com/api/v1';

const DEV_BASE =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:5001/api/v1'
    : 'http://localhost:5001/api/v1';

/**
 * Development uses cleartext localhost/emulator hosts.
 * Production / release builds use HTTPS only.
 */
export const API_BASE_URL = (
  API_HOST_OVERRIDE ||
  (__DEV__ ? DEV_BASE : PRODUCTION_API_BASE_URL)
).replace(/\/$/, '');

/** Socket.io connects to the host root (strip `/api/v1`). */
export const SOCKET_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

export const APP_VERSION = '1.0.0';

export const IS_HTTPS_API = API_BASE_URL.startsWith('https://');
