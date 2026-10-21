import { apiRequest } from '../api';
import { getDeviceId, getSession } from '../api/session';
import type {
  LoginResponse,
  PhoneVerifiedResponse,
  SendOtpResponse,
} from '../types/auth';

const COUNTRY_CODE = '+91';

/** POST /auth/customer/otp/send */
export async function sendOtp(
  phone: string,
  purpose: 'login' | 'change_phone' = 'login',
): Promise<SendOtpResponse> {
  return apiRequest<SendOtpResponse>('/auth/customer/otp/send', {
    method: 'POST',
    auth: false,
    body: {
      phone,
      countryCode: COUNTRY_CODE,
      deviceId: await getDeviceId(),
      purpose,
    },
  });
}

/** POST /auth/customer/otp/verify (login) — returns tokens and the customer. */
export function verifyLoginOtp(
  phone: string,
  otp: string,
  requestId?: string,
): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/customer/otp/verify', {
    method: 'POST',
    auth: false,
    body: {
      phone,
      otp,
      requestId: requestId ?? '',
      countryCode: COUNTRY_CODE,
      purpose: 'login',
    },
  });
}

/** POST /auth/customer/otp/verify with `purpose: change_phone` — proves ownership of a new number. */
export function verifyPhoneChangeOtp(
  phone: string,
  otp: string,
  requestId?: string,
): Promise<PhoneVerifiedResponse> {
  return apiRequest<PhoneVerifiedResponse>('/auth/customer/otp/verify', {
    method: 'POST',
    auth: false,
    body: {
      phone,
      otp,
      requestId: requestId ?? '',
      countryCode: COUNTRY_CODE,
      purpose: 'change_phone',
    },
  });
}

/** POST /auth/logout — revokes the refresh token and blacklists the access token. */
export function logout(): Promise<{ revoked: boolean }> {
  const refreshToken = getSession()?.refreshToken ?? '';
  return apiRequest<{ revoked: boolean }>('/auth/logout', {
    method: 'POST',
    body: { refreshToken },
  });
}
