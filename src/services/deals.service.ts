import { apiRequest } from '../api';
import type { ApiMeta, QueryParams } from '../api/types';

export type DealSide = 'buyer' | 'seller';

export type DealApi = {
  side: DealSide;
  id: string;
  title: string;
  price: number;
  stage: string;
  stageLabel?: string;
  progressPercent?: number;
  enquiryId?: string | null;
  sellRequestId?: string | null;
  updatedAt?: string;
  [key: string]: unknown;
};

export type BuyerDealDocument = {
  _id?: string;
  documentId: string;
  referenceId?: string | null;
  name: string;
  meta?: string;
  purpose?: string | null;
  documentType?: string | null;
  url?: string | null;
  status?: string | null;
  createdAt?: string | null;
};

export type BuyerDealRegistration = {
  appointment?: {
    date?: string | null;
    time?: string | null;
    office?: string | null;
    address?: string | null;
  };
  status?: string | null;
  checklist?: string[];
};

export type BuyerDealDocumentsApi = {
  dealId: string;
  propertyId?: string | null;
  propertyTitle?: string | null;
  stage?: string;
  documents: BuyerDealDocument[];
  registration?: BuyerDealRegistration | null;
  documentation?: Record<string, unknown> | null;
};

export type BuyerDealDetailApi = {
  _id: string;
  referenceId?: string | null;
  stage?: string;
  propertyId?: string | null;
  propertySnapshot?: { title?: string; price?: number; [key: string]: unknown } | null;
  financials?: Record<string, unknown> | null;
  sourceEnquiryId?: string | null;
  registration?: BuyerDealRegistration | null;
  documents?: BuyerDealDocument[];
  lastActivityAt?: string | null;
};

export async function listMyDeals(
  query: QueryParams = {},
  signal?: AbortSignal,
): Promise<{ items: DealApi[]; meta?: ApiMeta }> {
  const { data, meta } = await apiRequest<DealApi[]>('/me/deals', {
    query,
    signal,
  });
  return { items: data || [], meta };
}

export async function getMyDeal(
  dealId: string,
  signal?: AbortSignal,
): Promise<BuyerDealDetailApi> {
  const { data } = await apiRequest<BuyerDealDetailApi>(`/me/deals/${dealId}`, { signal });
  return data;
}

export async function listBuyerDealDocuments(
  dealId: string,
  signal?: AbortSignal,
): Promise<BuyerDealDocumentsApi> {
  const { data } = await apiRequest<BuyerDealDocumentsApi>(
    `/me/deals/${dealId}/documents`,
    { signal },
  );
  return data;
}
