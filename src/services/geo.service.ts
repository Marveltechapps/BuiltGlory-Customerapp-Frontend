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
