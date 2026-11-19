import type {
  NearbyPlace,
  PropertyStatus,
  PropertyType,
} from '../types/property';

/** Presentation model for property cards and detail screens, derived from the API `Property`. */
export interface PropertyView {
  id: string;
  referenceId: string;
  title: string;
  type: PropertyType;
  /** Lower-case type tag shown on photo badges (reference shows `p.type`). */
  typeTag: string;
  typeLabel: string;
  status: PropertyStatus;
  price: number;
  pricePerSqft: number | null;
  bhk: number | null;
  bhkLabel: string | null;
  area: number | null;
  floor: string | null;
  age: string | null;
  facing: string | null;
  furnishing: string | null;
  location: string;
  city: string;
  fullAddress: string;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  amenities: string[];
  highlights: string[];
  description: string;
  verified: boolean;
  negotiable: boolean;
  featured: boolean;
  upcoming: boolean;
  launchDate: string | null;
  views: number;
  enquiries: number;
  savedCount: number;
  posted: string;
  createdAt: string | null;
  soldAt: string | null;
  floorPlanUrl: string | null;
  videoUrl: string | null;
  droneImageUrl: string | null;
  tour3dUrl: string | null;
  advantages: {
    investment: string[];
    location: string[];
    connectivity: string[];
  };
  nearbyPlaces: NearbyPlace[];
  savedByUsers: string[];
}
