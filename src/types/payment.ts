export type PaymentStatus =
  | 'created'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'cancelled'
  | 'rejected';
export type PaymentMethod = 'bank' | 'upi' | 'cheque' | 'cash';

/** POST /payments/token body (payments createValidator). */
export interface CreateTokenPaymentRequest {
  dealId: string;
  propertyId?: string;
  type?: 'token';
  amount: number;
  currency?: 'INR';
  method?: PaymentMethod;
  transactionReference?: string | null;
  proofDocumentId?: string | null;
  notes?: string | null;
  idempotencyKey?: string;
}

export interface Payment {
  _id: string;
  referenceId: string;
  dealId?: string;
  propertyId?: string;
  type: 'token' | 'full' | 'stage' | 'seller_payout' | 'refund';
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod | 'razorpay';
  failureReason?: string;
  verificationNotes?: string;
  createdAt: string;
}
