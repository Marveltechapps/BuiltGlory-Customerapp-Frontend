import { apiRequest } from '../api';

export type ReverseGeoApi = {
  city?: string;
  state?: string;
  country?: string;
  street?: string;
  locality?: string;
  pincode?: string;
  latitude: number;
  longitude: number;
};

export async function forwardGeocode(query: string, signal?: AbortSignal): Promise<ReverseGeoApi | null> {
  const q = query.trim();
  if (q.length < 3) return null;
  const { data } = await apiRequest<ReverseGeoApi>('/geo/forward', { query: { q }, signal, skipAuthRefresh: true });
  return data;
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<ReverseGeoApi> {
  const { data } = await apiRequest<ReverseGeoApi>('/geo/reverse', {
    query: { latitude, longitude },
    signal,
    skipAuthRefresh: true,
  });
  return data;
}
