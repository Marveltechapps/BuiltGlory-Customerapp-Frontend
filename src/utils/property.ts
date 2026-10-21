import type { Property } from '../types/property';
import type { PropertyView } from '../interfaces/PropertyView';
import { propertyTypeLabel } from '../config/catalog';
import { timeAgo } from './format';

const num = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const n =
    typeof value === 'number'
      ? value
      : Number(String(value).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
};
const str = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s ? s : null;
};

/** Area from the property specs, preferring built-up → carpet → plot → generic area. */
export function areaOf(specs: Record<string, unknown> = {}): number | null {
  return (
    num(specs.builtUpArea) ??
    num(specs.carpetArea) ??
    num(specs.plotArea) ??
    num(specs.area) ??
    num(specs.totalArea)
  );
}

function floorOf(specs: Record<string, unknown>): string | null {
  const floor = str(specs.floor);
  const total = str(specs.totalFloors ?? specs.floors);
  if (floor && total) return `${floor} of ${total}`;
  return floor ?? (total ? `G+${Math.max(Number(total) - 1, 0)}` : null);
}

export function toPropertyView(p: Property): PropertyView {
  const specs = (p.specs ?? {}) as Record<string, unknown>;
  const area = areaOf(specs);
  const bhkRaw = str(specs.bhk);
  const bhk = bhkRaw ? num(bhkRaw) : null;
  const photos = (p.media?.photos ?? []).filter(Boolean);
  const cover = p.media?.coverPhoto;
  const images = cover ? [cover, ...photos.filter(u => u !== cover)] : photos;
  const a = p.address ?? {};
  return {
    id: p._id,
    referenceId: p.referenceId,
    title: p.title,
    type: p.type,
    typeTag: p.type.replace(/_/g, ' '),
    typeLabel: propertyTypeLabel(p.type),
    status: p.status,
    price: p.price,
    pricePerSqft: area && p.price ? Math.round(p.price / area) : null,
    bhk,
    bhkLabel: bhkRaw,
    area,
    floor: floorOf(specs),
    age: str(specs.age ?? specs.propertyAge),
    facing: str(specs.facing),
    furnishing: str(specs.furnishing ?? specs.furnish),
    location: a.locality || a.line1 || a.city || '',
    city: a.city || '',
    fullAddress: [a.line1, a.line2, a.locality, a.city, a.state, a.pincode]
      .filter(Boolean)
      .join(', '),
    latitude: typeof a.latitude === 'number' ? a.latitude : null,
    longitude: typeof a.longitude === 'number' ? a.longitude : null,
    images,
    amenities: p.amenities ?? [],
    highlights: p.highlights ?? [],
    description: p.description ?? '',
    // The backend's `verified=true` list filter is defined as status "available".
    verified: p.status === 'available',
    negotiable: Boolean(p.isNegotiable),
    featured: Boolean(p.isFeatured),
    upcoming: Boolean(p.isUpcoming),
    launchDate: p.launchDate ?? null,
    views: p.metrics?.views ?? 0,
    enquiries: p.metrics?.enquiries ?? 0,
    savedCount: p.metrics?.savedCount ?? 0,
    posted: timeAgo(p.createdAt),
    createdAt: p.createdAt ?? null,
    soldAt: p.soldAt ?? null,
    floorPlanUrl: p.media?.floorPlanUrl || null,
    videoUrl: p.media?.videoUrl || null,
    droneImageUrl: p.media?.droneImageUrl || null,
    tour3dUrl: p.media?.tour3dUrl || null,
    advantages: {
      investment: p.advantages?.investment ?? [],
      location: p.advantages?.location ?? [],
      connectivity: p.advantages?.connectivity ?? [],
    },
    nearbyPlaces: p.nearbyPlaces ?? [],
    savedByUsers: (p.savedByUsers ?? []).map(String),
  };
}

/** "3 BHK" / "Plot" style label used in enquiry headers. */
export function bhkOrType(p: PropertyView): string {
  return p.bhk ? `${p.bhk} BHK` : p.typeLabel;
}

/** "Adyar, Chennai" */
export function placeLabel(p: Pick<PropertyView, 'location' | 'city'>): string {
  return [p.location, p.city]
    .filter((v, i, arr) => v && arr.indexOf(v) === i)
    .join(', ');
}
