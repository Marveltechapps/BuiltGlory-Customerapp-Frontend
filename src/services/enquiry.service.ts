import { apiRequest, apiRequestPage } from '../api';
import type {
  BuyEnquiry,
  BuyEnquiryStatus,
  CreateBuyEnquiryRequest,
} from '../types/enquiry';

/** POST /buy-enquiries */
export const createBuyEnquiry = (body: CreateBuyEnquiryRequest) =>
  apiRequest<BuyEnquiry>('/buy-enquiries', { method: 'POST', body });

/** GET /me/buy-enquiries — each item includes its visits and linked sales deal. */
export const listMyEnquiries = (
  query: {
    page?: number;
    limit?: number;
    status?: BuyEnquiryStatus;
    sort?: 'newest' | 'oldest';
  } = {},
  signal?: AbortSignal,
) =>
  apiRequestPage<BuyEnquiry>('/me/buy-enquiries', {
    query: { limit: 100, ...query },
    signal,
  });

/** GET /me/buy-enquiries/:enquiryId */
export const getMyEnquiry = (enquiryId: string, signal?: AbortSignal) =>
  apiRequest<BuyEnquiry>(`/me/buy-enquiries/${enquiryId}`, { signal });

/** PATCH /me/buy-enquiries/:enquiryId/cancel (no body; closes the enquiry). */
export const cancelMyEnquiry = (enquiryId: string) =>
  apiRequest<BuyEnquiry>(`/me/buy-enquiries/${enquiryId}/cancel`, {
    method: 'PATCH',
  });
