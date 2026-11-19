import { mapPropertyTypeId } from '../api/mappers';
import type { MyListing } from '../config/myListings';
import type { ListingRecord } from '../context/journeyStore';
import type { SellDraft } from '../context/sellStore';
import type {
  SellActivityApi,
  SellRequestApi,
  SellWizardPayload,
} from '../services/sellRequests.service';
import { formatDateShort } from './dates';

/** Build the sell-wizard API body from the in-memory draft. */
export function buildSellWizardPayload(
  SD: SellDraft,
  opts: { draftStep?: number; photos?: string[]; askingPrice?: number; negotiable?: boolean } = {},
): SellWizardPayload {
  const details = (SD.details || {}) as Record<string, unknown>;
  const address = (SD.address || {}) as Record<string, unknown>;
  const price = (SD.price || {}) as Record<string, unknown>;
  const amenities = Array.isArray(SD.amenities)
    ? (SD.amenities as string[])
    : SD.amenities instanceof Set
      ? [...(SD.amenities as Set<string>)]
      : [];

  const streetParts = [address.door, address.street].filter(Boolean).map(String);
  const street = streetParts.join(', ') || String(address.street || '');
  const builtUp = Number(details.builtUp || details.area || details.landArea || details.plotArea) || undefined;
  const asking =
    opts.askingPrice ??
    (price.price != null || price.expected != null
      ? Number(price.price ?? price.expected)
      : undefined);

  const payload: SellWizardPayload = {
    propertyType: mapPropertyTypeId(String(SD.type || 'apartment')),
    propertyTitle: String(details.title || '') || undefined,
    askingPrice: asking && !Number.isNaN(asking) ? asking : undefined,
    negotiable:
      opts.negotiable ??
      (typeof price.negotiable === 'boolean' ? price.negotiable : undefined),
    address: {
      street: street || undefined,
      locality: String(address.area || address.locality || '') || undefined,
      city: String(address.city || '') || undefined,
      state: String(address.state || '') || undefined,
      pincode: String(address.pin || address.pincode || '') || undefined,
      latitude: typeof address.latitude === 'number' ? address.latitude : undefined,
      longitude: typeof address.longitude === 'number' ? address.longitude : undefined,
    },
    specifications: {
      bhk: details.bhk != null ? String(details.bhk) : undefined,
      builtUpArea: builtUp,
      carpetArea: Number(details.carpetArea) || undefined,
      floor: details.floor != null && details.floor !== '' ? String(details.floor) : undefined,
      totalFloors: Number(details.totalFloors) || undefined,
      unitNo: details.unitNo != null ? String(details.unitNo) : undefined,
      propertyAge: details.age != null ? String(details.age) : undefined,
      facing: details.facing != null ? String(details.facing) : undefined,
      furnishing: details.furnish != null ? String(details.furnish) : undefined,
      parking: details.parking != null ? Number(details.parking) : undefined,
    },
    amenities: amenities.length ? amenities : undefined,
    ownershipType: details.ownership != null ? String(details.ownership) : undefined,
    description: details.description != null ? String(details.description) : undefined,
    photos: opts.photos ?? (Array.isArray(SD.photos) ? (SD.photos as string[]) : []),
    draftStep: opts.draftStep,
  };

  return payload;
}

export function mapSellStatusToUi(
  status?: string,
): MyListing['status'] {
  switch (status) {
    case 'draft':
      return 'upcoming';
    case 'sold':
      return 'sold';
    case 'rejected':
    case 'paused':
      return 'withdrawn';
    default:
      return 'active';
  }
}

export function stageFromSellStatus(
  status?: string,
  activity?: SellActivityApi | null,
): number {
  const reg = activity?.registration as
    | { status?: string; appointment?: unknown }
    | undefined;
  if (status === 'sold' || reg?.status === 'completed') return 12;
  if (reg?.appointment) return 11;
  if (Array.isArray(activity?.payoutSchedule) && activity!.payoutSchedule!.length) return 10;

  const offer = activity?.offer as
    | { status?: string; amount?: number }
    | undefined;
  if (offer) {
    if (offer.status === 'accepted') return 8;
    if (offer.status === 'negotiation' || offer.status === 'countered') return 7;
    return 6;
  }

  switch (status) {
    case 'draft':
      return 0;
    case 'new':
      return 1;
    case 'under_review':
    case 'changes_requested':
      return 2;
    case 'accepted':
    case 'approved':
      return 5;
    case 'active':
      return 6;
    case 'negotiating':
      return 7;
    case 'sold':
      return 12;
    case 'rejected':
      return 2;
    default:
      return 1;
  }
}

export function mapSellRequestToMyListing(sr: SellRequestApi): MyListing {
  const photos = Array.isArray(sr.photos) ? sr.photos : [];
  const specs = (sr.specifications || {}) as Record<string, unknown>;
  const addr = sr.address || {};
  const status = mapSellStatusToUi(sr.status);
  const bhkRaw = specs.bhk;
  const bhk = typeof bhkRaw === 'number' ? bhkRaw : parseInt(String(bhkRaw || '0'), 10) || 0;
  const area = Number(specs.builtUpArea || specs.carpetArea || specs.plotArea || 0) || 0;
  const price = Number(sr.askingPrice || 0) || 0;

  return {
    id: sr._id,
    title: sr.propertyTitle || 'Untitled property',
    price,
    type: String(sr.propertyType || 'apartment'),
    bhk,
    area,
    floor: specs.floor != null ? String(specs.floor) : '',
    flatNo: specs.unitNo != null ? String(specs.unitNo) : '',
    location: String(addr.locality || ''),
    city: String(addr.city || ''),
    images: photos,
    amenities: Array.isArray(sr.amenities) ? (sr.amenities as string[]) : [],
    verified: ['active', 'accepted', 'approved', 'negotiating', 'sold'].includes(
      String(sr.status),
    ),
    negotiable: Boolean(sr.negotiable),
    views: Number((sr as { views?: number }).views || 0),
    enquiries: Number((sr as { enquiries?: number }).enquiries || 0),
    posted: sr.submittedAt ? formatDateShort(new Date(sr.submittedAt)) : '',
    rating: 0,
    sqftPrice: area > 0 && price > 0 ? Math.round(price / area) : 0,
    builder: '',
    desc: String(sr.description || ''),
    badge: '',
    status,
    date: sr.submittedAt
      ? formatDateShort(new Date(sr.submittedAt))
      : formatDateShort(new Date()),
    stage: statusLabel(sr),
    rejected: sr.status === 'rejected',
    soldPrice: status === 'sold' ? price : undefined,
    soldOn:
      status === 'sold' && sr.submittedAt
        ? formatDateShort(new Date(sr.submittedAt))
        : undefined,
  };
}

function statusLabel(sr: SellRequestApi): string {
  if (sr.status === 'rejected') {
    return String(sr.rejectionReason || 'Rejected');
  }
  const labels: Record<string, string> = {
    draft: 'Draft',
    new: 'Submitted',
    under_review: 'Under review',
    changes_requested: 'Changes requested',
    accepted: 'Accepted',
    approved: 'Approved',
    active: 'Active',
    negotiating: 'Offer / negotiation',
    paused: 'Paused',
    sold: 'Sold',
  };
  return labels[String(sr.status)] || String(sr.status || 'In progress');
}

export function listingRecordFromSellRequest(
  sr: SellRequestApi,
  activity?: SellActivityApi | null,
): ListingRecord {
  const listing = mapSellRequestToMyListing(sr);
  const offer = activity?.offer as { amount?: number; status?: string } | undefined;
  return {
    id: sr._id,
    pid: sr._id,
    title: listing.title,
    location: listing.location,
    city: listing.city,
    price: listing.price,
    area: listing.area,
    type: listing.type,
    bhk: listing.bhk,
    photo: listing.images[0] || sr._id,
    submittedAt: sr.submittedAt ? new Date(sr.submittedAt).getTime() : Date.now(),
    stage: stageFromSellStatus(sr.status, activity),
    at: {},
    rejected: sr.status === 'rejected',
    offer: offer?.amount,
    referenceId: sr.referenceId,
    sellRequestId: sr._id,
    apiDriven: true,
  };
}

export function relativeNotifTime(iso?: string): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return formatDateShort(new Date(iso));
}

/** Best-effort support hours check (Mon–Sat 9–19 IST). */
export function isSupportOpenNow(now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(now);
  const weekday = parts.find(p => p.type === 'weekday')?.value || '';
  const hour = Number(parts.find(p => p.type === 'hour')?.value || '0');
  if (weekday === 'Sun') return false;
  return hour >= 9 && hour < 19;
}
