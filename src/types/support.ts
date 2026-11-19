export type SupportCategory =
  | 'property_inquiry'
  | 'payment'
  | 'technical'
  | 'kyc'
  | 'general'
  | 'complaint';

/** POST /callbacks body (callbacks createValidator). */
export interface CreateCallbackRequest {
  source:
    | 'help_support'
    | 'profile_support'
    | 'property_detail'
    | 'payment'
    | 'interior';
  sourceScreen?: string | null;
  category?:
    | 'property_inquiry'
    | 'pricing'
    | 'technical_issue'
    | 'complaint'
    | 'general'
    | 'stage_payment'
    | 'interior';
  propertyId?: string;
  reason?: string | null;
  preferredTime?: string;
  bestTimePreference?: 'morning' | 'afternoon' | 'evening';
}

export interface Callback {
  _id: string;
  referenceId: string;
  status: string;
  bestTimePreference?: string;
  slaDeadline?: string;
}

/** POST /feedback body. */
export interface CreateFeedbackRequest {
  message: string;
  source?: string;
  sourceScreen?: string;
  metadata?: Record<string, unknown>;
}
