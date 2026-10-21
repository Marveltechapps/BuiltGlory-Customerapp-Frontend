import type { BuyFilters } from '../interfaces/BuyFilters';
import type { PropertyQuery } from '../types/property';

export const BUDGET_RANGE: [number, number] = [0, 300]; // lakhs (₹0 – ₹3 Cr), reference slider scale
export const AREA_RANGE: [number, number] = [0, 3000]; // sqft, reference slider scale
export const DEFAULT_BUDGET: [number, number] = [20, 150];
export const DEFAULT_AREA: [number, number] = [400, 2000];

/** Translate UI filters into GET /properties query params (properties listValidator). */
export function toPropertyQuery(
  f: BuyFilters,
  page = 1,
  limit = 20,
): PropertyQuery {
  const q: PropertyQuery = { page, limit };
  if (f.apiType) q.type = f.apiType;
  if (f.city?.trim()) q.city = f.city.trim();
  if (f.search?.trim()) q.search = f.search.trim();
  if (f.budget) {
    if (f.budget[0] > BUDGET_RANGE[0]) q.minPrice = f.budget[0] * 100000;
    if (f.budget[1] < BUDGET_RANGE[1]) q.maxPrice = f.budget[1] * 100000;
  }
  if (f.underOneCrore) q.maxPrice = Math.min(q.maxPrice ?? Infinity, 10000000);
  if (f.area) {
    if (f.area[0] > AREA_RANGE[0]) q.minArea = f.area[0];
    if (f.area[1] < AREA_RANGE[1]) q.maxArea = f.area[1];
  }
  const bhk = new Set(f.bhk ?? []);
  if (f.threePlusBhk) ['3', '4', '5+'].forEach(b => bhk.add(b));
  if (bhk.size) q.bhk = [...bhk].join(',');
  if (f.verified) q.verified = true;
  if (f.negotiable) q.negotiable = true;
  const possession = new Set(f.constructionStatus ?? []);
  if (f.readyToMove) possession.add('Ready to move');
  if (possession.size) q.possession = [...possession].join(',');
  if (f.furnishing?.length) q.furnishing = f.furnishing.join(',');
  if (f.facing?.length) q.facing = f.facing.join(',');
  if (f.propertyAge?.length) q.propertyAge = f.propertyAge.join(',');
  if (f.postedBy) q.postedBy = f.postedBy;
  if (f.amenities?.length) q.amenities = f.amenities.join(',');
  if (f.sort && f.sort !== 'relevance') q.sort = f.sort;
  else if (f.sort === 'relevance' && q.search) q.sort = 'relevance';
  return q;
}

/** Number of filter groups set on Filters / Advanced Filters (badge on the listing screen). */
export function activeFilterCount(f: BuyFilters): number {
  let n = 0;
  if (f.city?.trim()) n++;
  if (
    f.budget &&
    (f.budget[0] > BUDGET_RANGE[0] || f.budget[1] < BUDGET_RANGE[1])
  )
    n++;
  if (f.area && (f.area[0] > AREA_RANGE[0] || f.area[1] < AREA_RANGE[1])) n++;
  if (f.bhk?.length) n++;
  if (f.furnishing?.length) n++;
  if (f.facing?.length) n++;
  if (f.constructionStatus?.length) n++;
  if (f.propertyAge?.length) n++;
  if (f.postedBy) n++;
  if (f.amenities?.length) n++;
  return n;
}

export function advancedFilterCount(f: BuyFilters): number {
  return (
    (f.apiType ? 1 : 0) +
    (f.furnishing?.length ?? 0) +
    (f.facing?.length ?? 0) +
    (f.constructionStatus?.length ?? 0) +
    (f.propertyAge?.length ?? 0) +
    (f.postedBy ? 1 : 0) +
    (f.amenities?.length ?? 0)
  );
}
