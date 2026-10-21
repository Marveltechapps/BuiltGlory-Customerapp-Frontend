import { apiRequest } from '../api';
import type { ContentItem } from '../types/content';

/** GET /content (public) */
export const listContent = (
  query: {
    section?: ContentItem['section'];
    category?: string;
    search?: string;
    limit?: number;
  },
  signal?: AbortSignal,
) =>
  apiRequest<ContentItem[]>('/content', {
    query: { ...query },
    auth: false,
    signal,
  });

/** GET /content/:slug (public) */
export const getContent = (slug: string, signal?: AbortSignal) =>
  apiRequest<ContentItem>(`/content/${slug}`, { auth: false, signal });
