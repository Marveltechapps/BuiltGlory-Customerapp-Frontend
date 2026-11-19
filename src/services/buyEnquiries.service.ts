import { apiRequest } from '../api';
import type { ApiMeta, QueryParams } from '../api/types';

export type BuyEnquiryStatus =
  | 'new'
  | 'responded'
  | 'visit_scheduled'
  | 'negotiating'
  | 'closed'
  | string;

export type CreateBuyEnquiryInput = {
  propertyId: string;
  preferredContact: 'phone' | 'whatsapp' | 'email';
  interestType: 'schedule_visit' | 'price_negotiation' | 'more_details';
  preferredVisitTime?: string | null;
  preferredVisitDate?: string | null;
  preferredVisitTimeSlot?: string | null;
  additionalMessage?: string;
  enquiryTypes?: string[];
};

export type BuyEnquiryApi = {
  _id: string;
  referenceId?: string;
  propertyId: string;
  propertySnapshot?: {
    title?: string;
    price?: number;
    type?: string;
    location?: string;
  };
  status: BuyEnquiryStatus;
  preferredContact?: string;
  interestType?: string;
  submittedAt?: string;
  [key: string]: unknown;
};

export async function createBuyEnquiry(
  body: CreateBuyEnquiryInput,
): Promise<BuyEnquiryApi> {
  const { data } = await apiRequest<BuyEnquiryApi>('/buy-enquiries', {
    method: 'POST',
    body,
  });
  return data;
}

export async function listMyBuyEnquiries(
  query: QueryParams = {},
  signal?: AbortSignal,
): Promise<{ items: BuyEnquiryApi[]; meta?: ApiMeta }> {
  const { data, meta } = await apiRequest<BuyEnquiryApi[]>('/me/buy-enquiries', {
    query,
    signal,
  });
  return { items: data || [], meta };
}

export async function getBuyEnquiry(
  enquiryId: string,
  signal?: AbortSignal,
): Promise<BuyEnquiryApi> {
  const { data } = await apiRequest<BuyEnquiryApi>(
    `/me/buy-enquiries/${enquiryId}`,
    { signal },
  );
  return data;
}

export async function cancelBuyEnquiry(enquiryId: string): Promise<BuyEnquiryApi> {
  const { data } = await apiRequest<BuyEnquiryApi>(
    `/me/buy-enquiries/${enquiryId}/cancel`,
    { method: 'PATCH' },
  );
  return data;
}
