import { apiRequest } from '../api';
import type { ApiMeta, QueryParams } from '../api/types';

export type ContentSection =
  | 'home'
  | 'onboarding'
  | 'faq'
  | 'legal'
  | 'about'
  | 'news'
  | 'general'
  | 'banner'
  | string;

export type ContentItemApi = {
  _id: string;
  slug: string;
  section: ContentSection;
  title: string;
  excerpt?: string;
  body?: string;
  category?: string;
  order?: number;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
};

export async function listContent(
  query: QueryParams & { section?: ContentSection } = {},
  signal?: AbortSignal,
): Promise<{ items: ContentItemApi[]; meta?: ApiMeta }> {
  const { data, meta } = await apiRequest<ContentItemApi[]>('/content', {
    query,
    signal,
  });
  return { items: data || [], meta };
}

export async function getContentBySlug(
  slug: string,
  signal?: AbortSignal,
): Promise<ContentItemApi> {
  const { data } = await apiRequest<ContentItemApi>(`/content/${slug}`, {
    signal,
  });
  return data;
}
