import { apiRequest } from '../api';
import type { ApiMeta, QueryParams } from '../api/types';

export type SellRequestStatus =
  | 'draft'
  | 'new'
  | 'under_review'
  | 'accepted'
  | 'approved'
  | 'active'
  | 'negotiating'
  | 'paused'
  | 'sold'
  | 'rejected'
  | 'changes_requested'
  | string;

export type SellAddressInput = {
  street?: string;
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
};

export type SellSpecsInput = {
  bhk?: string;
  builtUpArea?: number;
  carpetArea?: number;
  floor?: string;
  totalFloors?: number;
  unitNo?: string;
  propertyAge?: string;
  facing?: string;
  furnishing?: string;
  parking?: number;
};

export type SellWizardPayload = {
  propertyType?: string;
  propertyTitle?: string;
  askingPrice?: number;
  negotiable?: boolean;
  address?: SellAddressInput;
  specifications?: SellSpecsInput;
  amenities?: string[];
  ownershipType?: string;
  description?: string;
  photos?: string[];
  draftStep?: number;
  [key: string]: unknown;
};

export type SellRequestApi = {
  _id: string;
  referenceId?: string;
  propertyTitle?: string;
  askingPrice?: number;
  status: SellRequestStatus;
  address?: SellAddressInput;
  photos?: string[];
  submittedAt?: string | null;
  rejectionReason?: string | null;
  changeRequests?: unknown;
  [key: string]: unknown;
};

export type SellEnquiryRow = {
  _id: string;
  referenceId?: string;
  buyerSnapshot?: { name?: string | null; userType?: string | null };
  interestType?: string;
  preferredContact?: string;
  preferredVisitDate?: string;
  preferredVisitTimeSlot?: string;
  status?: string;
  submittedAt?: string;
  additionalMessage?: string;
  [key: string]: unknown;
};

export type SellVisitRow = {
  _id: string;
  referenceId?: string;
  visitDate?: string;
  visitTime?: string;
  visitType?: string;
  status?: string;
  buyerName?: string;
  [key: string]: unknown;
};

export type SellActivityApi = {
  sellRequest?: SellRequestApi;
  acquisition?: Record<string, unknown>;
  offer?: Record<string, unknown>;
  payoutSchedule?: Array<Record<string, unknown>>;
  registration?: Record<string, unknown>;
  enquiries?: SellEnquiryRow[];
  visits?: SellVisitRow[];
  availability?: string[];
  messages?: Array<Record<string, unknown>>;
  metrics?: Record<string, unknown>;
  [key: string]: unknown;
};

export type ValuationEstimateApi = {
  estimatedPrice: number;
  low: number;
  high: number;
  pricePerSqft: number;
  area: number;
  basis?: string;
};

export async function createDraft(
  body: SellWizardPayload = {},
): Promise<SellRequestApi> {
  const { data } = await apiRequest<SellRequestApi>('/sell-requests/drafts', {
    method: 'POST',
    body,
  });
  return data;
}

export async function createSellRequest(
  body: SellWizardPayload,
): Promise<SellRequestApi> {
  const { data } = await apiRequest<SellRequestApi>('/sell-requests', {
    method: 'POST',
    body,
  });
  return data;
}

export async function patchSellRequest(
  sellRequestId: string,
  body: SellWizardPayload,
): Promise<SellRequestApi> {
  const { data } = await apiRequest<SellRequestApi>(
    `/me/sell-requests/${sellRequestId}`,
    { method: 'PATCH', body },
  );
  return data;
}

export async function submitSellRequest(
  sellRequestId: string,
): Promise<SellRequestApi> {
  const { data } = await apiRequest<SellRequestApi>(
    `/me/sell-requests/${sellRequestId}/submit`,
    { method: 'POST' },
  );
  return data;
}

export async function listMySellRequests(
  query: QueryParams = {},
  signal?: AbortSignal,
): Promise<{ items: SellRequestApi[]; meta?: ApiMeta }> {
  const { data, meta } = await apiRequest<SellRequestApi[]>('/me/sell-requests', {
    query,
    signal,
  });
  return { items: data || [], meta };
}

export async function getSellRequest(
  sellRequestId: string,
  signal?: AbortSignal,
): Promise<SellRequestApi> {
  const { data } = await apiRequest<SellRequestApi>(
    `/me/sell-requests/${sellRequestId}`,
    { signal },
  );
  return data;
}

export async function getSellRequestActivity(
  sellRequestId: string,
  signal?: AbortSignal,
): Promise<SellActivityApi> {
  const { data } = await apiRequest<SellActivityApi>(
    `/me/sell-requests/${sellRequestId}/activity`,
    { signal },
  );
  return data;
}

export async function decideOffer(
  sellRequestId: string,
  body:
    | { decision: 'accepted' }
    | { decision: 'countered'; counterAmount: number; notes?: string },
): Promise<SellActivityApi | SellRequestApi> {
  const { data } = await apiRequest<SellActivityApi | SellRequestApi>(
    `/me/sell-requests/${sellRequestId}/offer-decision`,
    { method: 'POST', body },
  );
  return data;
}

export async function sendSellMessage(
  sellRequestId: string,
  text: string,
): Promise<SellActivityApi | unknown> {
  const { data } = await apiRequest(
    `/me/sell-requests/${sellRequestId}/messages`,
    { method: 'POST', body: { text } },
  );
  return data;
}

export async function sellVisitAction(
  sellRequestId: string,
  visitId: string,
  body:
    | { action: 'confirm' }
    | { action: 'decline'; reason?: string }
    | { action: 'reschedule'; visitDate: string; visitTime: string },
): Promise<unknown> {
  const { data } = await apiRequest(
    `/me/sell-requests/${sellRequestId}/visits/${visitId}/action`,
    { method: 'POST', body },
  );
  return data;
}

export async function setSellAvailability(
  sellRequestId: string,
  slots: string[],
): Promise<unknown> {
  const { data } = await apiRequest(
    `/me/sell-requests/${sellRequestId}/availability`,
    { method: 'PUT', body: { slots } },
  );
  return data;
}

export type SellDocumentRow = {
  documentId?: string | null;
  type?: string;
  name?: string;
  status?: string;
  createdAt?: string | null;
  url?: string | null;
  meta?: string;
  [key: string]: unknown;
};

export async function listSellDocuments(
  sellRequestId: string,
  signal?: AbortSignal,
): Promise<{ items: SellDocumentRow[]; meta?: ApiMeta }> {
  const { data, meta } = await apiRequest<SellDocumentRow[] | { items?: SellDocumentRow[] }>(
    `/me/sell-requests/${sellRequestId}/documents`,
    { signal },
  );
  if (Array.isArray(data)) return { items: data, meta };
  if (data && Array.isArray(data.items)) return { items: data.items, meta };
  return { items: [], meta };
}

export async function confirmPayoutSchedule(
  sellRequestId: string,
): Promise<unknown> {
  const { data } = await apiRequest(
    `/me/sell-requests/${sellRequestId}/payout-schedule/confirm`,
    { method: 'POST' },
  );
  return data;
}

export async function confirmRegistration(
  sellRequestId: string,
  body: { documentsReady: string[] },
): Promise<unknown> {
  const { data } = await apiRequest(
    `/me/sell-requests/${sellRequestId}/registration/confirm`,
    { method: 'POST', body },
  );
  return data;
}

export async function valuationEstimate(
  sellRequestId: string,
  body: SellWizardPayload | Record<string, never> = {},
): Promise<ValuationEstimateApi> {
  const { data } = await apiRequest<ValuationEstimateApi>(
    `/me/sell-requests/${sellRequestId}/valuation-estimate`,
    { method: 'POST', body },
  );
  return data;
}

export async function withdrawSellRequest(
  sellRequestId: string,
): Promise<SellRequestApi> {
  const { data } = await apiRequest<SellRequestApi>(
    `/me/sell-requests/${sellRequestId}/withdraw`,
    { method: 'POST' },
  );
  return data;
}
