import { apiRequest } from '../api';
import type { ApiMeta, QueryParams } from '../api/types';

export type PaymentMethod = 'bank' | 'upi' | 'cheque' | 'cash';
export type PaymentStatus =
  | 'created'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'cancelled'
  | 'rejected'
  | string;

export type CreateTokenPaymentInput = {
  dealId: string;
  propertyId: string;
  type: 'token';
  amount: number;
  currency?: string;
  method: PaymentMethod;
  transactionReference?: string;
  proofDocumentId?: string;
  notes?: string | null;
  idempotencyKey: string;
};

export type PaymentApi = {
  _id: string;
  referenceId?: string;
  status: PaymentStatus;
  amount?: number;
  method?: PaymentMethod;
  type?: string;
  dealId?: string;
  [key: string]: unknown;
};

export async function createTokenPayment(
  body: CreateTokenPaymentInput,
): Promise<PaymentApi> {
  const { data } = await apiRequest<PaymentApi>('/payments/token', {
    method: 'POST',
    body: {
      currency: 'INR',
      ...body,
      type: 'token',
    },
  });
  return data;
}

export async function cancelPayment(paymentId: string): Promise<PaymentApi> {
  const { data } = await apiRequest<PaymentApi>(`/payments/${paymentId}/cancel`, {
    method: 'POST',
  });
  return data;
}

export async function listMyPayments(
  query: QueryParams = {},
  signal?: AbortSignal,
): Promise<{ items: PaymentApi[]; meta?: ApiMeta }> {
  const { data, meta } = await apiRequest<PaymentApi[]>('/me/payments', {
    query,
    signal,
  });
  return { items: data || [], meta };
}
