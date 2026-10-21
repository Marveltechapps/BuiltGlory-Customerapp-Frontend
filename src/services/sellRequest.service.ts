import { apiRequest, apiRequestPage } from '../api';
import type {
  SellerActivity,
  SellRequest,
  SellRequestPayload,
  ValuationEstimate,
} from '../types/sellRequest';

/** POST /sell-requests/drafts */
export const createSellDraft = (body: SellRequestPayload) =>
  apiRequest<SellRequest>('/sell-requests/drafts', { method: 'POST', body });

/** GET /me/sell-requests */
export const listMySellRequests = (
  query: { page?: number; limit?: number; status?: string } = {},
  signal?: AbortSignal,
) =>
  apiRequestPage<SellRequest>('/me/sell-requests', {
    query: { limit: 100, ...query },
    signal,
  });

/** GET /me/sell-requests/:id */
export const getMySellRequest = (id: string, signal?: AbortSignal) =>
  apiRequest<SellRequest>(`/me/sell-requests/${id}`, { signal });

/** PATCH /me/sell-requests/:id (allowed while the request is a draft or has changes requested). */
export const updateMySellRequest = (id: string, body: SellRequestPayload) =>
  apiRequest<SellRequest>(`/me/sell-requests/${id}`, { method: 'PATCH', body });

/** POST /me/sell-requests/:id/submit (validates and moves a draft to `new`). */
export const submitMySellRequest = (id: string) =>
  apiRequest<SellRequest>(`/me/sell-requests/${id}/submit`, { method: 'POST' });

/** GET /me/sell-requests/:id/activity (offer, buyer enquiries, visits, messages, payout, registration). */
export const getSellerActivity = (id: string, signal?: AbortSignal) =>
  apiRequest<SellerActivity>(`/me/sell-requests/${id}/activity`, { signal });

/** POST /me/sell-requests/:id/offer-decision */
export const decideOffer = (
  id: string,
  body: {
    decision: 'accepted' | 'countered';
    counterAmount?: number;
    notes?: string | null;
  },
) =>
  apiRequest<SellerActivity>(`/me/sell-requests/${id}/offer-decision`, {
    method: 'POST',
    body,
  });

/** POST /me/sell-requests/:id/messages */
export const sendSellerMessage = (id: string, text: string) =>
  apiRequest<SellerActivity>(`/me/sell-requests/${id}/messages`, {
    method: 'POST',
    body: { text },
  });

/** POST /me/sell-requests/:id/visits/:visitId/action */
export const actOnSellerVisit = (
  id: string,
  visitId: string,
  body: {
    action: 'confirm' | 'reschedule' | 'decline';
    visitDate?: string;
    visitTime?: string;
    reason?: string | null;
  },
) =>
  apiRequest<SellerActivity>(
    `/me/sell-requests/${id}/visits/${visitId}/action`,
    { method: 'POST', body },
  );

/** PUT /me/sell-requests/:id/availability */
export const saveSellerAvailability = (id: string, slots: string[]) =>
  apiRequest<{ sellRequestId: string; slots: string[] }>(
    `/me/sell-requests/${id}/availability`,
    { method: 'PUT', body: { slots } },
  );

/** POST /me/sell-requests/:id/withdraw — moves the listing to paused. */
export const withdrawSellRequest = (id: string) =>
  apiRequest<SellRequest>(`/me/sell-requests/${id}/withdraw`, { method: 'POST' });

/** POST /me/sell-requests/:id/valuation-estimate */
export const getValuationEstimate = (
  id: string,
  body: SellRequestPayload,
  signal?: AbortSignal,
) =>
  apiRequest<ValuationEstimate>(`/me/sell-requests/${id}/valuation-estimate`, {
    method: 'POST',
    body: {
      propertyType: body.propertyType,
      address: body.address,
      specifications: body.specifications,
      amenities: body.amenities,
      askingPrice: body.askingPrice,
    },
    signal,
  });
