import { apiRequest } from '../api';
import type { QueryParams } from '../api/types';

export async function getTrendingSearches(
  limit = 8,
  signal?: AbortSignal,
): Promise<string[]> {
  const { data } = await apiRequest<string[]>('/search/trending', {
    query: { limit },
    signal,
  });
  return data || [];
}

export async function listRecentSearches(
  signal?: AbortSignal,
): Promise<string[]> {
  const { data } = await apiRequest<string[]>('/me/searches', { signal });
  return data || [];
}

export async function recordSearch(term: string): Promise<string[]> {
  const { data } = await apiRequest<string[]>('/me/searches', {
    method: 'POST',
    body: { term },
  });
  return data || [];
}

export async function clearRecentSearches(): Promise<string[]> {
  const { data } = await apiRequest<string[]>('/me/searches', {
    method: 'DELETE',
  });
  return data || [];
}

export async function removeRecentSearch(term: string): Promise<string[]> {
  const encoded = encodeURIComponent(term);
  const { data } = await apiRequest<string[]>(`/me/searches/${encoded}`, {
    method: 'DELETE',
  });
  return data || [];
}

export type SearchQuery = QueryParams;
