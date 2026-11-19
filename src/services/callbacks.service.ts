import { apiRequest } from '../api';

export type CallbackSource =
  | 'help_support'
  | 'profile_support'
  | 'property_detail'
  | 'payment'
  | 'interior'
  | string;

export type CallbackCategory =
  | 'property_inquiry'
  | 'pricing'
  | 'technical_issue'
  | 'complaint'
  | 'general'
  | 'stage_payment'
  | 'interior'
  | string;

export type CreateCallbackInput = {
  source: CallbackSource;
  sourceScreen?: string;
  category: CallbackCategory;
  bestTimePreference: 'morning' | 'afternoon' | 'evening';
  propertyId?: string;
  reason?: string;
};

export type CallbackApi = {
  _id: string;
  status?: string;
  [key: string]: unknown;
};

export async function requestCallback(
  body: CreateCallbackInput,
): Promise<CallbackApi> {
  const { data } = await apiRequest<CallbackApi>('/callbacks', {
    method: 'POST',
    body,
  });
  return data;
}
