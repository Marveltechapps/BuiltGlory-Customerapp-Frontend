import { apiRequest } from '../api';

export interface ReverseGeocode {
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
}

/** GET /geo/reverse — nearest Builtglory city for a GPS point. */
export const reverseGeocode = (latitude: number, longitude: number) =>
  apiRequest<ReverseGeocode>('/geo/reverse', {
    auth: false,
    query: { latitude, longitude },
  });
