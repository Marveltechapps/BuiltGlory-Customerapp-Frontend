import { propertyTypeById } from '../../config/catalog';

/** Matches sellRequests/validationRules.js `sellTypeCategory`. */
export type SellKind = 'home' | 'plot' | 'commercial' | 'fractional' | 'interior';

export const AREA_MIN = 50;
export const PRICE_MIN = 50_000;
export const TITLE_MIN = 8;

export function sellKind(typeId?: string): SellKind {
  const api = propertyTypeById(typeId)?.apiType ?? typeId ?? '';
  if (api === 'plot' || api === 'land') return 'plot';
  if (api === 'commercial') return 'commercial';
  if (api === 'fractional') return 'fractional';
  if (api === 'interior') return 'interior';
  return 'home';
}
