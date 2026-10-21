import AsyncStorage from '@react-native-async-storage/async-storage';

// Customer session issued by POST /auth/customer/otp/verify and rotated by POST /auth/refresh.
export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

const SESSION_KEY = 'bg.session';
const DEVICE_KEY = 'bg.deviceId';

let tokens: SessionTokens | null = null;
let deviceId: string | null = null;
const expiredListeners = new Set<() => void>();

export function getSession(): SessionTokens | null {
  return tokens;
}

export async function loadSession(): Promise<SessionTokens | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    tokens = raw ? (JSON.parse(raw) as SessionTokens) : null;
  } catch {
    tokens = null;
  }
  return tokens;
}

export async function saveSession(next: SessionTokens): Promise<void> {
  tokens = next;
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next));
}

export async function clearSession(): Promise<void> {
  tokens = null;
  await AsyncStorage.removeItem(SESSION_KEY);
}

/** Stable per-install identifier sent as `x-device-id` (used by the backend for OTP cooldowns and sessions). */
export async function getDeviceId(): Promise<string> {
  if (deviceId) return deviceId;
  try {
    deviceId = await AsyncStorage.getItem(DEVICE_KEY);
  } catch {
    deviceId = null;
  }
  if (!deviceId) {
    deviceId = `bg-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
    try {
      await AsyncStorage.setItem(DEVICE_KEY, deviceId);
    } catch {
      // A new id per launch is acceptable when storage is unavailable.
    }
  }
  return deviceId;
}

/** Notified when the refresh token is rejected and the user must sign in again (G-04). */
export function onSessionExpired(listener: () => void): () => void {
  expiredListeners.add(listener);
  return () => expiredListeners.delete(listener);
}

export function emitSessionExpired() {
  expiredListeners.forEach(listener => listener());
}
