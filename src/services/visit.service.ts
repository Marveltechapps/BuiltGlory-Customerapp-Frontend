import { apiRequest, apiRequestPage } from '../api';
import type {
  CreateVisitRequest,
  UpdateVisitRequest,
  Visit,
  VisitAvailability,
  VisitType,
} from '../types/visit';

/** GET /visits/availability */
export const getAvailability = (
  query: {
    propertyId: string;
    visitType?: VisitType;
    from?: string;
    days?: number;
  },
  signal?: AbortSignal,
) =>
  apiRequest<VisitAvailability>('/visits/availability', {
    query: { ...query },
    signal,
  });

/** POST /visits */
export const createVisit = (body: CreateVisitRequest) =>
  apiRequest<Visit>('/visits', { method: 'POST', body });

/** PATCH /visits/:visitId/reschedule — requires a future date + time. */
export const rescheduleVisit = (visitId: string, body: UpdateVisitRequest) =>
  apiRequest<Visit>(`/visits/${visitId}/reschedule`, { method: 'PATCH', body });

/** GET /me/visits — every visit for the signed-in buyer, including ones with no enquiry. */
export const listMyVisits = (
  query: {
    page?: number;
    limit?: number;
    status?: Visit['status'];
    visitType?: VisitType;
    sort?: 'newest' | 'oldest';
  } = {},
  signal?: AbortSignal,
) =>
  apiRequestPage<Visit>('/me/visits', {
    query: { limit: 20, sort: 'newest', ...query },
    signal,
  });

/** PATCH /visits/:visitId/cancel — requires a reason. */
export const cancelVisit = (visitId: string, reason: string) =>
  apiRequest<Visit>(`/visits/${visitId}/cancel`, {
    method: 'PATCH',
    body: { reason },
  });
