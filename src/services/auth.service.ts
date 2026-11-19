import { apiRequest, getDeviceId } from '../api';
import type {
  AuthSessionApi,
  AuthTokensApi,
  OtpSendResultApi,
} from '../api/types';
import type { OtpPurpose } from '../lib/session';

export type SendOtpInput = {
  countryCode: string;
  phone: string;
  purpose: OtpPurpose;
  deviceId?: string;
};

export type VerifyOtpInput = {
  countryCode: string;
  phone: string;
  otp: string;
  requestId: string;
  purpose: OtpPurpose;
};

export async function sendOtp(input: SendOtpInput): Promise<OtpSendResultApi> {
  const deviceId = input.deviceId || (await getDeviceId());
  const { data } = await apiRequest<OtpSendResultApi>('/auth/customer/otp/send', {
    method: 'POST',
    body: {
      countryCode: input.countryCode,
      phone: input.phone,
      purpose: input.purpose,
      deviceId,
    },
    skipAuthRefresh: true,
  });
  return data;
}

export async function verifyOtp(
  input: VerifyOtpInput,
): Promise<AuthSessionApi | { verified: true; phone: string; phoneNormalized?: string }> {
  const { data } = await apiRequest<
    AuthSessionApi | { verified: true; phone: string; phoneNormalized?: string }
  >('/auth/customer/otp/verify', {
    method: 'POST',
    body: input,
    skipAuthRefresh: true,
  });
  return data;
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokensApi> {
  const { data } = await apiRequest<AuthTokensApi>('/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
    skipAuthRefresh: true,
  });
  return data;
}

export async function logout(refreshToken: string): Promise<{ revoked: boolean }> {
  const { data } = await apiRequest<{ revoked: boolean }>('/auth/logout', {
    method: 'POST',
    body: { refreshToken },
    skipAuthRefresh: true,
  });
  return data;
}

export async function passwordLogin(
  identifier: string,
  password: string,
): Promise<AuthSessionApi> {
  const { data } = await apiRequest<AuthSessionApi>('/auth/customer/password/login', {
    method: 'POST',
    body: { identifier, password },
    skipAuthRefresh: true,
  });
  return data;
}

export async function forgotPassword(input: {
  countryCode: string;
  phone: string;
  deviceId?: string;
}): Promise<OtpSendResultApi> {
  const deviceId = input.deviceId || (await getDeviceId());
  const { data } = await apiRequest<OtpSendResultApi>('/auth/customer/password/forgot', {
    method: 'POST',
    body: {
      countryCode: input.countryCode,
      phone: input.phone,
      deviceId,
    },
    skipAuthRefresh: true,
  });
  return data;
}

export async function resetPassword(input: {
  countryCode: string;
  phone: string;
  otp: string;
  requestId: string;
  newPassword: string;
}): Promise<{ reset: boolean } | AuthSessionApi> {
  const { data } = await apiRequest<{ reset: boolean } | AuthSessionApi>(
    '/auth/customer/password/reset',
    {
      method: 'POST',
      body: input,
      skipAuthRefresh: true,
    },
  );
  return data;
}

export async function sendEmailOtp(email: string): Promise<OtpSendResultApi> {
  const { data } = await apiRequest<OtpSendResultApi>('/auth/email/otp/send', {
    method: 'POST',
    body: { email },
    skipAuthRefresh: true,
  });
  return data;
}

export async function resendEmailOtp(email: string): Promise<OtpSendResultApi> {
  const { data } = await apiRequest<OtpSendResultApi>('/auth/email/otp/resend', {
    method: 'POST',
    body: { email },
    skipAuthRefresh: true,
  });
  return data;
}

export async function verifyEmailOtp(input: {
  email: string;
  otp: string;
  requestId: string;
}): Promise<{ verified: boolean }> {
  const { data } = await apiRequest<{ verified: boolean }>('/auth/email/otp/verify', {
    method: 'POST',
    body: input,
    skipAuthRefresh: true,
  });
  return data;
}
