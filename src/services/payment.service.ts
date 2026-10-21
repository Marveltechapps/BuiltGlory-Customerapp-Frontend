import { apiRequest, apiRequestPage } from '../api';
import type { CreateTokenPaymentRequest, Payment } from '../types/payment';

/** POST /payments/token: records a manual escrow token payment for admin verification. */
export const createTokenPayment = (body: CreateTokenPaymentRequest) =>
  apiRequest<Payment>('/payments/token', {
    method: 'POST',
    body: { type: 'token', currency: 'INR', ...body },
  });

/** POST /payments/:paymentId/cancel */
export const cancelPayment = (paymentId: string) =>
  apiRequest<Payment>(`/payments/${paymentId}/cancel`, { method: 'POST' });

/** GET /me/payments */
export const listMyPayments = (
  query: {
    dealId?: string;
    type?: Payment['type'];
    status?: Payment['status'];
  } = {},
  signal?: AbortSignal,
) =>
  apiRequestPage<Payment>('/me/payments', {
    query: { limit: 50, ...query },
    signal,
  });
