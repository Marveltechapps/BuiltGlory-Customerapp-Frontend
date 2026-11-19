import { apiRequest, apiRequestPage } from '../api';
import type { Property, PropertyQuery } from '../types/property';

/** GET /properties (public) — visible, unsold listings with filters and pagination. */
export const listProperties = (
  query: PropertyQuery = {},
  signal?: AbortSignal,
) => apiRequestPage<Property>('/properties', { query: { ...query }, signal });

/** GET /properties/:propertyId (public) — 404 once the listing is sold or withdrawn. */
export const getProperty = (propertyId: string, signal?: AbortSignal) =>
  apiRequest<Property>(`/properties/${propertyId}`, { signal });

/** POST /properties/:propertyId/save */
export const saveProperty = (propertyId: string) =>
  apiRequest<Property>(`/properties/${propertyId}/save`, { method: 'POST' });

/** DELETE /properties/:propertyId/save (204) */
export const unsaveProperty = (propertyId: string) =>
  apiRequest<void>(`/properties/${propertyId}/save`, { method: 'DELETE' });

/** GET /me/favorites */
export const listFavorites = (signal?: AbortSignal) =>
  apiRequest<Property[]>('/me/favorites', { signal });
