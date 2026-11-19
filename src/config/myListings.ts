// Seller listing card shape + sell wizard step labels.
// Listings are loaded from GET /me/sell-requests — do not seed sample PROPERTIES.
import type { Property } from '../types/property';

export interface MyListing extends Property {
  status: 'active' | 'upcoming' | 'sold' | 'withdrawn';
  date: string;
  stage?: string;
  launch?: string;
  notify?: number;
  soldPrice?: number;
  rejected?: boolean;
}

/** Mutable cache optionally filled by My Listings; prefer screen-local API state. */
export const MY_LISTINGS: MyListing[] = [];

/** The sell flow's steps, in order (draft progress is measured against these). */
export const SELL_STEPS: [string, string][] = [
  ['sellType', 'Property type'], ['sellIntent', 'Basic details'], ['sellAddress', 'Address'], ['sellDetails', 'Property details'],
  ['sellAmenities', 'Amenities'], ['sellPhotos', 'Photos & documents'], ['sellPrice', 'Expected price'],
];
