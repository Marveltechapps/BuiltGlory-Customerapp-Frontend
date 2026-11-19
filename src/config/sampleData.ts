// UI catalogues for Builtglory screens (not live listing data).
import type { Faq, FaqTopic, PropertyType, Spec } from '../types/property';

/** 13 property types (B-01 / SL-01). */
export const PROPERTY_TYPES: PropertyType[] = [
  { id: 'plot', label: 'Plot', sub: '', icon: 'map-pin' },
  { id: 'apartment', label: 'Apartment', sub: '', icon: 'building-2' },
  { id: 'villa', label: 'Villa', sub: '', icon: 'home' },
  { id: 'commercial', label: 'Commercial', sub: '', icon: 'briefcase' },
  { id: 'land', label: 'Land', sub: 'Land Bank', icon: 'map' },
  { id: 'fractional', label: 'Fractional', sub: 'Ownership', icon: 'pie-chart' },
  { id: '3d-print', label: '3D Print', sub: 'Home', icon: 'box' },
  { id: 'organic', label: 'Organic', sub: 'Home', icon: 'leaf' },
  { id: 'ceo-mansion', label: 'CEO', sub: 'Mansion', icon: 'crown' },
  { id: 'holiday', label: 'Holiday', sub: 'Home', icon: 'umbrella' },
  { id: 'farmhouse', label: 'Farmhouse', sub: '', icon: 'warehouse' },
  { id: 'nri', label: 'NRI', sub: 'Services', icon: 'globe' },
  { id: 'interior', label: 'Interior', sub: '', icon: 'sofa' },
];

export const SPECS: Spec[] = [
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

/** Last-resort FAQ fallback when content API returns empty. */
export const FAQS: Faq[] = [
  { q: 'How are listings verified?', a: 'Our team conducts legal verification, title checks and a site visit before publishing any listing on Builtglory.' },
  { q: 'What payment options are available?', a: 'We support UPI, NEFT/RTGS, bank transfer and home loans from partner banks.' },
  { q: 'Can I schedule a visit to the property?', a: 'Yes, pick a date and time from the visit calendar — our agent will confirm within an hour.' },
  { q: 'Do you charge brokerage?', a: 'No middlemen, no commissions. The price you see is the price you pay.' },
  { q: 'How is my data secured?', a: 'All your personal data is encrypted at rest with AES-256 and only shared with verified sellers after your consent.' },
];

/** Help & FAQ topics (A-05). */
export const FAQ_TOPICS: FaqTopic[] = [
  { id: 'buying', label: 'Buying', icon: 'home', count: 12 },
  { id: 'selling', label: 'Selling', icon: 'tag', count: 9 },
  { id: 'legal', label: 'Legal', icon: 'scale', count: 7 },
  { id: 'payment', label: 'Payment', icon: 'wallet', count: 8 },
  { id: 'nri', label: 'NRI', icon: 'globe', count: 6 },
  { id: 'app', label: 'App Usage', icon: 'smartphone', count: 10 },
  { id: 'account', label: 'Account', icon: 'user', count: 5 },
  { id: 'other', label: 'Other', icon: 'circle-help', count: 4 },
];
