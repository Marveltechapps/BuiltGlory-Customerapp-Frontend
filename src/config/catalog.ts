import type { PropertyType } from '../types/property';
import type { IconName } from '../components/Icon';

// UI catalogs from the design reference (data.jsx). These are presentation constants, not records.

export interface PropertyTypeOption {
  /** Reference id used in navigation params. */
  id: string;
  label: string;
  sub: string;
  icon: IconName;
  /** Backend `type` (properties) / `propertyType` (sell requests). */
  apiType: PropertyType;
}

// 13 property types (B-01 / SL-01).
export const PROPERTY_TYPES: PropertyTypeOption[] = [
  { id: 'plot', label: 'Plot', sub: '', icon: 'map-pin', apiType: 'plot' },
  {
    id: 'apartment',
    label: 'Apartment',
    sub: '',
    icon: 'building-2',
    apiType: 'apartment',
  },
  { id: 'villa', label: 'Villa', sub: '', icon: 'home', apiType: 'villa' },
  {
    id: 'commercial',
    label: 'Commercial',
    sub: '',
    icon: 'briefcase',
    apiType: 'commercial',
  },
  { id: 'land', label: 'Land', sub: 'Land Bank', icon: 'map', apiType: 'land' },
  {
    id: 'fractional',
    label: 'Fractional',
    sub: 'Ownership',
    icon: 'pie-chart',
    apiType: 'fractional',
  },
  {
    id: '3d-print',
    label: '3D Print',
    sub: 'Home',
    icon: 'box',
    apiType: '3d_printing',
  },
  {
    id: 'organic',
    label: 'Organic',
    sub: 'Home',
    icon: 'leaf',
    apiType: 'organic_home',
  },
  {
    id: 'ceo-mansion',
    label: 'CEO',
    sub: 'Mansion',
    icon: 'crown',
    apiType: 'ceo_mansion',
  },
  {
    id: 'holiday',
    label: 'Holiday',
    sub: 'Home',
    icon: 'umbrella',
    apiType: 'holiday_home',
  },
  {
    id: 'farmhouse',
    label: 'Farmhouse',
    sub: '',
    icon: 'warehouse',
    apiType: 'farmhouse',
  },
  { id: 'nri', label: 'NRI', sub: 'Services', icon: 'globe', apiType: 'nri' },
  {
    id: 'interior',
    label: 'Interior',
    sub: '',
    icon: 'sofa',
    apiType: 'interior',
  },
];

export function propertyTypeById(
  id?: string | null,
): PropertyTypeOption | undefined {
  return PROPERTY_TYPES.find(t => t.id === id || t.apiType === id);
}

/** Display label for a backend property type, e.g. `organic_home` → "Organic Home". */
export function propertyTypeLabel(type?: string | null): string {
  const option = propertyTypeById(type);
  if (option)
    return option.sub &&
      option.sub !== 'Ownership' &&
      option.sub !== 'Services' &&
      option.sub !== 'Land Bank'
      ? `${option.label} ${option.sub}`
      : option.label;
  return type
    ? type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Property';
}

export interface SpecOption {
  label: string;
  icon: IconName;
}

// Amenity catalog (B-05 / SL-05 / advanced filters).
export const SPECS: SpecOption[] = [
  { label: 'Lift', icon: 'arrow-up-down' },
  { label: 'Gym', icon: 'dumbbell' },
  { label: 'Pool', icon: 'waves' },
  { label: 'Garden', icon: 'trees' },
  { label: 'Parking', icon: 'car' },
  { label: 'Security', icon: 'circle-check-big' },
  { label: 'Power Backup', icon: 'zap' },
  { label: 'CCTV', icon: 'video' },
  { label: 'Club House', icon: 'users' },
  { label: 'Wifi', icon: 'wifi' },
  { label: 'Solar', icon: 'sun' },
  { label: 'EV Charger', icon: 'plug' },
  { label: 'Servants', icon: 'user' },
  { label: 'Lounge', icon: 'sofa' },
  { label: 'Library', icon: 'book-open' },
  { label: 'Play Area', icon: 'baby' },
  { label: 'Jogging Track', icon: 'footprints' },
  { label: 'Pet Friendly', icon: 'dog' },
  { label: 'Fire Safety', icon: 'flame' },
  { label: 'Rainwater', icon: 'cloud-rain' },
];

// Extra seller amenities shown on SL-05.
export const EXTRA_AMENITIES = [
  'Modular Kitchen',
  'Marble flooring',
  'Wooden flooring',
  'AC',
  'RO water',
  'Geyser',
  'Wardrobes',
  'Balcony',
];

export interface FaqTopic {
  id: string;
  label: string;
  icon: IconName;
}

// Help & FAQ topics (A-05). Article counts come from published FAQ content per category.
export const FAQ_TOPICS: FaqTopic[] = [
  { id: 'buying', label: 'Buying', icon: 'home' },
  { id: 'selling', label: 'Selling', icon: 'tag' },
  { id: 'legal', label: 'Legal', icon: 'scale' },
  { id: 'payment', label: 'Payment', icon: 'wallet' },
  { id: 'nri', label: 'NRI', icon: 'globe' },
  { id: 'app', label: 'App Usage', icon: 'smartphone' },
  { id: 'account', label: 'Account', icon: 'user' },
  { id: 'other', label: 'Other', icon: 'circle-help' },
];

export const CITIES = [
  'Ahmedabad',
  'Bangalore',
  'Chennai',
  'Coimbatore',
  'Delhi',
  'Hyderabad',
  'Jaipur',
  'Kolkata',
  'Mumbai',
  'Pune',
  'Surat',
  'Thiruvananthapuram',
];

/** Icons for nearby-place types on B-06 (falls back to map-pin). */
export const NEARBY_ICONS: Record<string, { icon: IconName; color: string }> = {
  school: { icon: 'school', color: '#1A6FFF' },
  college: { icon: 'school', color: '#1A6FFF' },
  education: { icon: 'school', color: '#1A6FFF' },
  hospital: { icon: 'hospital', color: '#F43F5E' },
  health: { icon: 'hospital', color: '#F43F5E' },
  metro: { icon: 'train', color: '#8B5CF6' },
  transport: { icon: 'train', color: '#8B5CF6' },
  railway: { icon: 'train', color: '#8B5CF6' },
  bus: { icon: 'train', color: '#8B5CF6' },
  airport: { icon: 'plane', color: '#8B5CF6' },
  mall: { icon: 'shopping-bag', color: '#F59E0B' },
  shopping: { icon: 'shopping-bag', color: '#F59E0B' },
  market: { icon: 'shopping-bag', color: '#F59E0B' },
};
