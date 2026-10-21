import { Platform } from 'react-native';

declare const process: { env: { API_BASE_URL?: string } };

// Inlined from API_BASE_URL (.env or the shell) by babel.config.js. Not a secret.
const configured = (process.env.API_BASE_URL || '').trim();

// Android emulator reaches the host through 10.0.2.2. iOS simulator uses localhost.
const devFallback =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:5001/api/v1'
    : 'http://localhost:5001/api/v1';

export const API_BASE_URL = (configured || devFallback).replace(/\/$/, '');

/** Abort requests that hang longer than this. */
export const REQUEST_TIMEOUT_MS = 20000;
