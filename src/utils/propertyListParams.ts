import { mapPropertyTypeId } from '../api/mappers';
import type { PropertyListFilters } from '../services/properties.service';
import type { BuyFilters } from '../context/journeyStore';

export function mapUiSortToApi(sort?: string): PropertyListFilters['sort'] {
  switch (sort) {
    case 'price-asc':
      return 'price_asc';
    case 'price-desc':
      return 'price_desc';
    case 'newest':
    case 'new':
      return 'newest';
    case 'oldest':
      return 'oldest';
    default:
      return 'relevance';
  }
}

/** Build GET /properties query from buy-filter UI state. */
export function filtersFromBuyFilters(
  f: BuyFilters,
  fallbackType?: string,
): PropertyListFilters {
  const types = f.types.length
    ? f.types
    : fallbackType
      ? [fallbackType]
      : [];
  const q = f.location.trim();
  const params: PropertyListFilters = {
    sort: mapUiSortToApi(f.sort),
  };
  if (types.length === 1) params.type = mapPropertyTypeId(types[0]);
  if (q) {
    // Locality/city free-text — API accepts locality or search.
    params.locality = q;
  }
  if (f.budget[0] !== 10) params.minPrice = f.budget[0] * 1e5;
  if (f.budget[1] < 300) params.maxPrice = f.budget[1] * 1e5;
  if (f.area[0] > 0) params.minArea = f.area[0];
  if (f.area[1] < 4000) params.maxArea = f.area[1];
  if (f.bhk.length) {
    params.bhk = f.bhk.map(b => (b === '5+' ? '5' : String(b))).join(',');
  }
  return params;
}
