import { apiRequest } from '../api';
import type { ApiMeta, QueryParams } from '../api/types';

export type VisitType = 'physical' | 'virtual';
export type VisitStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'missed'
  | 'rescheduled'
  | string;

export type VisitSlotApi = {
  time: string;
  available: boolean;
  status?: string;
  remainingCapacity?: number;
};

export type VisitAvailabilityApi = {
  days: Array<{
    date: string;
    slots: VisitSlotApi[];
  }>;
};

export type CreateVisitInput = {
  propertyId: string;
  enquiryId?: string;
  visitDate: string;
  visitTime: string;
  visitType?: VisitType;
  preferredLanguage?: string;
  virtualPlatform?: string;
  meetingLink?: string;
};

export type VisitApi = {
  _id: string;
  referenceId?: string;
  propertyId?: string;
  enquiryId?: string;
  visitDate: string;
  visitTime: string;
  visitType?: VisitType;
  status?: VisitStatus;
  [key: string]: unknown;
};

export async function getVisitAvailability(
  query: {
    propertyId: string;
    visitType?: VisitType;
    from?: string;
    days?: number;
  },
  signal?: AbortSignal,
): Promise<VisitAvailabilityApi> {
  const { data } = await apiRequest<VisitAvailabilityApi>('/visits/availability', {
    query,
    signal,
  });
  return data;
}

export async function createVisit(body: CreateVisitInput): Promise<VisitApi> {
  const { data } = await apiRequest<VisitApi>('/visits', {
    method: 'POST',
    body,
  });
  return data;
}

export async function listMyVisits(
  query: QueryParams = {},
  signal?: AbortSignal,
): Promise<{ items: VisitApi[]; meta?: ApiMeta }> {
  const { data, meta } = await apiRequest<VisitApi[]>('/me/visits', {
    query,
    signal,
  });
  return { items: data || [], meta };
}

export async function rescheduleVisit(
  visitId: string,
  body: { visitDate: string; visitTime: string },
): Promise<VisitApi> {
  const { data } = await apiRequest<VisitApi>(`/visits/${visitId}/reschedule`, {
    method: 'PATCH',
    body,
  });
  return data;
}

export async function cancelVisit(
  visitId: string,
  body: { reason?: string } = {},
): Promise<VisitApi> {
  const { data } = await apiRequest<VisitApi>(`/visits/${visitId}/cancel`, {
    method: 'PATCH',
    body,
  });
  return data;
}
