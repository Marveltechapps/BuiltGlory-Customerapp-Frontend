export type PropertyType =
  | 'plot'
  | 'apartment'
  | 'residential'
  | 'commercial'
  | 'organic_home'
  | '3d_printing'
  | 'fractional'
  | 'ceo_mansion'
  | 'holiday_home'
  | 'land'
  | 'farmhouse'
  | 'nri'
  | 'interior'
  | 'villa';
export type PropertyStatus =
  | 'draft'
  | 'available'
  | 'reserved'
  | 'under_construction'
  | 'sold';

export interface PropertyAddress {
  line1?: string;
  line2?: string;
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
}

export interface PropertyMedia {
  photos?: string[];
  coverPhoto?: string;
  videoUrl?: string;
  droneImageUrl?: string;
  tour3dUrl?: string;
  floorPlanUrl?: string;
}

export interface NearbyPlace {
  name?: string;
  type?: string;
  distance?: string;
}

/** Property document returned by GET /properties and GET /properties/:id. */
export interface Property {
  _id: string;
  referenceId: string;
  title: string;
  description?: string;
  type: PropertyType;
  status: PropertyStatus;
  isFeatured?: boolean;
  isUpcoming?: boolean;
  isVisibleOnApp?: boolean;
  address?: PropertyAddress;
  price: number;
  isNegotiable?: boolean;
  specs?: Record<string, unknown>;
  amenities?: string[];
  media?: PropertyMedia;
  advantages?: {
    investment?: string[];
    location?: string[];
    connectivity?: string[];
  };
  nearbyPlaces?: NearbyPlace[];
  highlights?: string[];
  metrics?: {
    savedCount?: number;
    views?: number;
    enquiries?: number;
    visits?: number;
  };
  savedByUsers?: string[];
  launchDate?: string;
  possessionDate?: string;
  soldAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** GET /properties query (properties listValidator). */
export interface PropertyQuery {
  type?: PropertyType;
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
  propertyAge?: string;
  possession?: string;
  constructionStatus?: string;
  postedBy?: 'owner' | 'builder' | 'dealer';
  verified?: boolean;
  negotiable?: boolean;
  recentlySold?: boolean;
  featured?: boolean;
  upcoming?: boolean;
  search?: string;
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'oldest';
  page?: number;
  limit?: number;
}
