import { apiRequest } from '../api';
import type { ApiMeta, QueryParams } from '../api/types';

export type SupportCategory =
  | 'property_inquiry'
  | 'payment'
  | 'technical'
  | 'kyc'
  | 'general'
  | 'complaint'
  | string;

export type SupportTicketStatus =
  | 'open'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | string;

export type SupportResponseApi = {
  _id: string;
  message: string;
  responderType?: string;
  createdAt?: string;
};

export type SupportTicketApi = {
  _id: string;
  referenceId?: string;
  category: SupportCategory;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  channel?: string;
  attachments?: string[];
  responses?: SupportResponseApi[];
  [key: string]: unknown;
};

export type CreateTicketInput = {
  category: SupportCategory;
  subject: string;
  message: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  channel?: string;
  attachments?: string[];
};

export async function createTicket(
  body: CreateTicketInput,
): Promise<SupportTicketApi> {
  const { data } = await apiRequest<SupportTicketApi>('/support/tickets', {
    method: 'POST',
    body,
  });
  return data;
}

export async function listMyTickets(
  query: QueryParams = {},
  signal?: AbortSignal,
): Promise<{ items: SupportTicketApi[]; meta?: ApiMeta }> {
  const { data, meta } = await apiRequest<SupportTicketApi[]>(
    '/me/support/tickets',
    { query, signal },
  );
  return { items: data || [], meta };
}

export async function getTicket(
  ticketId: string,
  signal?: AbortSignal,
): Promise<SupportTicketApi> {
  const { data } = await apiRequest<SupportTicketApi>(
    `/me/support/tickets/${ticketId}`,
    { signal },
  );
  return data;
}

export async function replyToTicket(
  ticketId: string,
  body: { message: string; clientMessageId?: string },
): Promise<SupportTicketApi> {
  const { data } = await apiRequest<SupportTicketApi>(
    `/me/support/tickets/${ticketId}/responses`,
    { method: 'POST', body },
  );
  return data;
}

export async function markTicketRead(ticketId: string): Promise<SupportTicketApi> {
  const { data } = await apiRequest<SupportTicketApi>(
    `/me/support/tickets/${ticketId}/read`,
    { method: 'POST' },
  );
  return data;
}

export async function closeTicket(ticketId: string): Promise<SupportTicketApi> {
  const { data } = await apiRequest<SupportTicketApi>(
    `/me/support/tickets/${ticketId}/close`,
    { method: 'POST' },
  );
  return data;
}

export async function reopenTicket(ticketId: string): Promise<SupportTicketApi> {
  const { data } = await apiRequest<SupportTicketApi>(
    `/me/support/tickets/${ticketId}/reopen`,
    { method: 'POST' },
  );
  return data;
}

export async function getLiveChat(
  signal?: AbortSignal,
): Promise<SupportTicketApi | null> {
  const { data } = await apiRequest<SupportTicketApi | null>(
    '/me/support/live-chat',
    { signal },
  );
  return data;
}

export async function startLiveChat(body: {
  category?: SupportCategory;
  subject?: string;
  message: string;
}): Promise<SupportTicketApi> {
  const { data } = await apiRequest<SupportTicketApi>('/me/support/live-chat', {
    method: 'POST',
    body: {
      category: body.category || 'general',
      subject: body.subject || 'Live chat',
      message: body.message,
    },
  });
  return data;
}
