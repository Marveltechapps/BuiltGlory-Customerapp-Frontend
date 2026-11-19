import { apiRequest } from '../api';
import type { ApiMeta, QueryParams } from '../api/types';

export type CreateFeedbackInput = {
  message: string;
  source?: string;
  sourceScreen?: string;
};

export type FeedbackApi = {
  _id: string;
  message: string;
  status?: 'new' | 'reviewed' | 'archived' | string;
  source?: string;
  createdAt?: string;
  [key: string]: unknown;
};

export async function submitFeedback(
  body: CreateFeedbackInput,
): Promise<FeedbackApi> {
  const { data } = await apiRequest<FeedbackApi>('/feedback', {
    method: 'POST',
    body,
  });
  return data;
}

export async function listMyFeedback(
  query: QueryParams = {},
  signal?: AbortSignal,
): Promise<{ items: FeedbackApi[]; meta?: ApiMeta }> {
  const { data, meta } = await apiRequest<FeedbackApi[]>('/me/feedback', {
    query,
    signal,
  });
  return { items: data || [], meta };
}
