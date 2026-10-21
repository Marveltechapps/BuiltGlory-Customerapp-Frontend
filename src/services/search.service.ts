import { apiRequest } from '../api';

/** GET /search/trending (public): recent popular terms. */
export const getTrendingSearches = (signal?: AbortSignal) =>
  apiRequest<string[]>('/search/trending', { auth: false, signal });

/** GET /me/searches: the last 10 terms this customer searched. */
export const getRecentSearches = (signal?: AbortSignal) =>
  apiRequest<string[]>('/me/searches', { signal });

/** POST /me/searches */
export const recordSearch = (term: string, resultCount: number) =>
  apiRequest<string[]>('/me/searches', {
    method: 'POST',
    body: { term, resultCount },
  });

/** DELETE /me/searches */
export const clearRecentSearches = () =>
  apiRequest<string[]>('/me/searches', { method: 'DELETE' });
