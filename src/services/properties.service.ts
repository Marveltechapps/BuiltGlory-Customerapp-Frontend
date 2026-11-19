import { apiRequest } from '../api';
import type { ApiMeta, PropertyApi, QueryParams } from '../api/types';

export type PropertyListFilters = QueryParams & {
  type?: string;
  city?: string;
  locality?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bhk?: string;
  amenities?: string;
  facing?: string;
  furnishing?: string;
  verified?: boolean;
  negotiable?: boolean;
  featured?: boolean;
  upcoming?: boolean;
  recentlySold?: boolean;
  search?: string;
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'oldest' | string;
  page?: number;
  limit?: number;
};

export async function listProperties(
  filters: PropertyListFilters = {},
  signal?: AbortSignal,
): Promise<{ items: PropertyApi[]; meta?: ApiMeta }> {
  const { data, meta } = await apiRequest<PropertyApi[]>('/properties', {
    query: filters,
    signal,
  });
  return { items: data || [], meta };
}

export async function getPropertyById(
  propertyId: string,
  signal?: AbortSignal,
): Promise<PropertyApi> {
  const { data } = await apiRequest<PropertyApi>(`/properties/${propertyId}`, {
    signal,
  });
  return data;
}

export async function saveProperty(propertyId: string): Promise<unknown> {
  const { data } = await apiRequest(`/properties/${propertyId}/save`, {
    method: 'POST',
  });
  return data;
}

export async function unsaveProperty(propertyId: string): Promise<unknown> {
  const { data } = await apiRequest(`/properties/${propertyId}/save`, {
    method: 'DELETE',
  });
  return data;
}

export async function listFavorites(
  query: QueryParams = {},
  signal?: AbortSignal,
): Promise<{ items: PropertyApi[]; meta?: ApiMeta }> {
  const { data, meta } = await apiRequest<PropertyApi[]>('/me/favorites', {
    query,
    signal,
  });
  return { items: data || [], meta };
}
