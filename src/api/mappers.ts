import type { Property } from '../types/property';
import type { PropertyApi, PropertyTypeEnum } from './types';

/** UI catalog ids (sampleData PROPERTY_TYPES) ↔ backend enum values. */
const UI_TO_API_TYPE: Record<string, PropertyTypeEnum> = {
  plot: 'plot',
  apartment: 'apartment',
  villa: 'villa',
  residential: 'residential',
  commercial: 'commercial',
  land: 'land',
  fractional: 'fractional',
  '3d-print': '3d_printing',
  '3d_printing': '3d_printing',
  organic: 'organic_home',
  organic_home: 'organic_home',
  'ceo-mansion': 'ceo_mansion',
  ceo_mansion: 'ceo_mansion',
  holiday: 'holiday_home',
  holiday_home: 'holiday_home',
  farmhouse: 'farmhouse',
  nri: 'nri',
  interior: 'interior',
};

const API_TO_UI_TYPE: Record<string, string> = {
  plot: 'plot',
  apartment: 'apartment',
  villa: 'villa',
  residential: 'residential',
  commercial: 'commercial',
  land: 'land',
  fractional: 'fractional',
  '3d_printing': '3d-print',
  organic_home: 'organic',
  ceo_mansion: 'ceo-mansion',
  holiday_home: 'holiday',
  farmhouse: 'farmhouse',
  nri: 'nri',
  interior: 'interior',
};

/** Map a UI property-type id (e.g. `3d-print`) to the backend enum (`3d_printing`). */
export function mapPropertyTypeId(uiOrApiId: string): PropertyTypeEnum {
  return UI_TO_API_TYPE[uiOrApiId] || uiOrApiId;
}

/** Map a backend type enum to the UI catalog id. */
export function mapPropertyTypeToUi(apiType: string): string {
  return API_TO_UI_TYPE[apiType] || apiType;
}

function ordinalFloor(n: number): string {
  const abs = Math.abs(n);
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (abs % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function formatFloor(
  floor: string | number | null | undefined,
  totalFloors: number | null | undefined,
): string {
  if (floor === null || floor === undefined || floor === '') {
    return totalFloors ? `of ${totalFloors}` : '—';
  }
  if (typeof floor === 'string' && Number.isNaN(Number(floor))) {
    return totalFloors ? `${floor} of ${totalFloors}` : floor;
  }
  const n = Number(floor);
  if (Number.isNaN(n)) return String(floor);
  const label = ordinalFloor(n);
  return totalFloors ? `${label} of ${totalFloors}` : label;
}

function relativeFrom(iso?: string): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Date.now() - then;
  if (diffMs < 0) return 'just now';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

function badgeFor(api: PropertyApi): string {
  if (api.isUpcoming) return 'Upcoming';
  if (api.status === 'sold') return 'Sold';
  return 'For Sale';
}

export function mapProperty(api: PropertyApi): Property {
  const specs = api.specs || {};
  const address = api.address || {};
  const media = api.media || {};
  const metrics = api.metrics || {};
  const area = Number(specs.builtUpArea || specs.plotArea || specs.carpetArea || 0) || 0;
  const price = Number(api.price) || 0;
  const photos =
    (media.photos && media.photos.length > 0
      ? media.photos
      : media.coverPhoto
        ? [media.coverPhoto]
        : []) || [];

  const verified =
    Boolean(api.isVerified ?? api.verified) || api.status === 'available';

  return {
    id: api._id,
    title: api.title || '',
    price,
    type: mapPropertyTypeToUi(api.type || ''),
    bhk: Number(specs.bhk) || 0,
    area,
    floor: formatFloor(specs.floor, specs.totalFloors),
    flatNo: specs.unitNo ? String(specs.unitNo) : '—',
    location: address.locality || '',
    city: address.city || '',
    latitude: typeof address.latitude === 'number' ? address.latitude : null,
    longitude: typeof address.longitude === 'number' ? address.longitude : null,
    images: photos,
    amenities: api.amenities || [],
    verified,
    negotiable: Boolean(api.isNegotiable),
    views: metrics.views || 0,
    enquiries: metrics.enquiries || 0,
    posted: relativeFrom(api.createdAt),
    rating: typeof api.rating === 'number' ? api.rating : 0,
    sqftPrice: area > 0 ? Math.round(price / area) : 0,
    builder: api.builder || '',
    desc: api.description || '',
    badge: badgeFor(api),
    launchDate: api.launchDate || undefined,
    soldOut: api.status === 'sold',
    soldOn: api.soldAt || undefined,
  };
}

export function mapProperties(list: PropertyApi[] | null | undefined): Property[] {
  if (!list?.length) return [];
  return list.map(mapProperty);
}
