import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserApi } from '../api/types';

const KEYS = {
  accessToken: 'bg_access_token',
  refreshToken: 'bg_refresh_token',
  user: 'bg_user',
} as const;

export type AuthMode = 'signin' | 'signup';
export type OtpPurpose = 'login' | 'change_phone' | 'password_reset';

export type SessionUser = Partial<UserApi> & { _id?: string };

type SessionState = {
  authMode: AuthMode;
  authName: string;
  phone: string;
  countryCode: string;
  otpRequestId: string | null;
  otpPurpose: OtpPurpose | null;
  otpCanResendAt: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  user: SessionUser | null;
};

const state: SessionState = {
  authMode: 'signin',
  authName: '',
  phone: '',
  countryCode: '+91',
  otpRequestId: null,
  otpPurpose: null,
  otpCanResendAt: null,
  accessToken: null,
  refreshToken: null,
  user: null,
};

/** Sync in-memory session used by screens and the API client. */
export const session: SessionState & {
  /** @deprecated Prefer accessToken; kept for existing screen reads. */
  get token(): string | null;
  set token(value: string | null);
} = {
  get authMode() {
    return state.authMode;
  },
  set authMode(value: AuthMode) {
    state.authMode = value;
  },
  get authName() {
    return state.authName;
  },
  set authName(value: string) {
    state.authName = value;
  },
  get phone() {
    return state.phone;
  },
  set phone(value: string) {
    state.phone = value;
  },
  get countryCode() {
    return state.countryCode;
  },
  set countryCode(value: string) {
    state.countryCode = value;
  },
  get otpRequestId() {
    return state.otpRequestId;
  },
  set otpRequestId(value: string | null) {
    state.otpRequestId = value;
  },
  get otpPurpose() {
    return state.otpPurpose;
  },
  set otpPurpose(value: OtpPurpose | null) {
    state.otpPurpose = value;
  },
  get otpCanResendAt() {
    return state.otpCanResendAt;
  },
  set otpCanResendAt(value: string | null) {
    state.otpCanResendAt = value;
  },
  get accessToken() {
    return state.accessToken;
  },
  set accessToken(value: string | null) {
    state.accessToken = value;
  },
  get refreshToken() {
    return state.refreshToken;
  },
  set refreshToken(value: string | null) {
    state.refreshToken = value;
  },
  get user() {
    return state.user;
  },
  set user(value: SessionUser | null) {
    state.user = value;
  },
  get token() {
    return state.accessToken;
  },
  set token(value: string | null) {
    state.accessToken = value;
  },
};

export function getAccessToken(): string | null {
  return state.accessToken;
}

export function getRefreshToken(): string | null {
  return state.refreshToken;
}

export async function loadSession(): Promise<SessionState> {
  const [accessToken, refreshToken, userRaw] = await Promise.all([
    AsyncStorage.getItem(KEYS.accessToken),
    AsyncStorage.getItem(KEYS.refreshToken),
    AsyncStorage.getItem(KEYS.user),
  ]);

  state.accessToken = accessToken;
  state.refreshToken = refreshToken;

  if (userRaw) {
    try {
      state.user = JSON.parse(userRaw) as SessionUser;
      if (state.user?.name) state.authName = state.user.name;
    } catch {
      state.user = null;
    }
  } else {
    state.user = null;
  }

  return { ...state };
}

export async function saveTokens(
  accessToken: string,
  refreshToken: string,
  user?: SessionUser | null,
): Promise<void> {
  state.accessToken = accessToken;
  state.refreshToken = refreshToken;
  if (user !== undefined) {
    state.user = user;
    if (user?.name) state.authName = user.name;
  }

  const writes: Promise<void>[] = [
    AsyncStorage.setItem(KEYS.accessToken, accessToken),
    AsyncStorage.setItem(KEYS.refreshToken, refreshToken),
  ];

  if (user !== undefined) {
    writes.push(
      user
        ? AsyncStorage.setItem(KEYS.user, JSON.stringify(user))
        : AsyncStorage.removeItem(KEYS.user),
    );
  }

  await Promise.all(writes);
}

export async function updateUser(partial: SessionUser): Promise<void> {
  const next: SessionUser = { ...(state.user || {}), ...partial };
  state.user = next;
  if (next.name) state.authName = next.name;
  await AsyncStorage.setItem(KEYS.user, JSON.stringify(next));
}

export function setPendingOtp(input: {
  phone: string;
  countryCode?: string;
  requestId: string;
  purpose: OtpPurpose;
  canResendAt?: string | null;
  authMode?: AuthMode;
  authName?: string;
}): void {
  state.phone = input.phone;
  state.countryCode = input.countryCode ?? state.countryCode ?? '+91';
  state.otpRequestId = input.requestId;
  state.otpPurpose = input.purpose;
  state.otpCanResendAt = input.canResendAt ?? null;
  if (input.authMode) state.authMode = input.authMode;
  if (input.authName !== undefined) state.authName = input.authName;
}

export async function clearSession(): Promise<void> {
  state.accessToken = null;
  state.refreshToken = null;
  state.user = null;
  state.otpRequestId = null;
  state.otpPurpose = null;
  state.otpCanResendAt = null;
  state.phone = '';
  await Promise.all([
    AsyncStorage.removeItem(KEYS.accessToken),
    AsyncStorage.removeItem(KEYS.refreshToken),
    AsyncStorage.removeItem(KEYS.user),
  ]);
}
