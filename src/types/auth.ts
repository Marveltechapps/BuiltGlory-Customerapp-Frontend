import type { User } from './user';

/** POST /auth/customer/otp/send */
export interface SendOtpRequest {
  phone: string;
  countryCode?: string;
  deviceId?: string;
  purpose?: 'login' | 'change_phone';
}
export interface SendOtpResponse {
  requestId: string;
  expiresInSeconds: number;
  canResendAt: string;
}

/** POST /auth/customer/otp/verify */
export interface VerifyOtpRequest {
  phone: string;
  otp: string;
  requestId?: string;
  countryCode?: string;
  purpose?: 'login' | 'change_phone';
}
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  user: User;
}
/** `purpose: 'change_phone'` verification result. */
export interface PhoneVerifiedResponse {
  verified: true;
  phone: string;
  phoneNormalized: string;
}
