import type { PropertyType } from '../types/property';

/** Buyer search filters shared by Filter (B-02), Advanced Filters and the listing screen (B-03). */
export interface BuyFilters {
  /** Reference property-type id (e.g. `3d-print`); undefined lists every type. */
  typeId?: string;
  apiType?: PropertyType;
  city?: string;
  /** Budget in lakhs, e.g. [20, 150]. */
  budget?: [number, number];
  /** Area in sqft. */
  area?: [number, number];
  /** BHK values: '1' … '4', '5+'. */
  bhk?: string[];
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'newest';
  search?: string;
  // Quick chips on B-03
  verified?: boolean;
  negotiable?: boolean;
  readyToMove?: boolean;
  underOneCrore?: boolean;
  threePlusBhk?: boolean;
  // Advanced filters
  furnishing?: string[];
  facing?: string[];
  constructionStatus?: string[];
  propertyAge?: string[];
  postedBy?: 'owner' | 'builder' | 'dealer';
  amenities?: string[];
}
