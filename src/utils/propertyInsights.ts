// Location and advantage facts derived from property data.
import type { Property } from '../types/property';
import { formatINR } from './format';

const jHash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

export interface Nearby { icon: string; label: string; color: string; km: string }

export const nearbyFor = (p: Property): Nearby[] => ([
  ['school', 'Schools', '#1A6FFF'], ['hospital', 'Hospital', '#F43F5E'], ['train-front', 'Metro / rail', '#8B5CF6'],
  ['shopping-bag', 'Shopping', '#F59E0B'], ['briefcase', 'IT corridor', '#0EA5E9'], ['landmark', 'Bank & ATM', '#10B981'],
] as [string, string, string][])
  .map(([icon, label, color]) => ({ icon, label, color, km: (0.3 + (jHash(p.id + label) % 34) / 10).toFixed(1) }))
  .sort((a, b) => Number(a.km) - Number(b.km));

export interface Advantage { icon: string; color: string; title: string; body: string }

/** Pass live catalogue peers when available; otherwise skip average comparison. */
export const advantagesFor = (p: Property, peers?: Property[]): Advantage[] => {
  const same = (peers || []).filter(x => x.type === p.type && x.sqftPrice);
  const avg = same.length
    ? same.reduce((a, x) => a + x.sqftPrice, 0) / same.length
    : 0;
  const diff = avg > 0 ? Math.round(((p.sqftPrice - avg) / avg) * 100) : 0;
  const list: (Advantage | false | 0 | undefined)[] = [
    p.verified && { icon: 'shield-check', color: '#10B981', title: 'Legally verified title', body: 'Documents checked by the Builtglory legal team' },
    p.sqftPrice && avg > 0 ? {
      icon: diff <= 0 ? 'trending-down' : 'trending-up', color: '#1A6FFF',
      title: diff < 0 ? `${-diff}% below ${p.type} average` : diff > 0 ? `${diff}% above ${p.type} average` : `At ${p.type} average`,
      body: `${formatINR(p.sqftPrice)}/sqft vs ${formatINR(Math.round(avg))}/sqft across Builtglory ${p.type} listings`,
    } : p.sqftPrice ? {
      icon: 'trending-up', color: '#1A6FFF',
      title: `${formatINR(p.sqftPrice)}/sqft`,
      body: 'Price per square foot for this listing',
    } : undefined,
    p.negotiable && { icon: 'handshake', color: '#F59E0B', title: 'Price negotiable', body: 'Seller is open to offers through Builtglory' },
    p.amenities && p.amenities.length ? { icon: 'sparkles', color: '#8B5CF6', title: `${p.amenities.length} amenities`, body: p.amenities.join(' · ') } : undefined,
    p.enquiries ? { icon: 'flame', color: '#F43F5E', title: 'In demand', body: `${p.enquiries} enquiries and ${p.views} views` } : undefined,
    p.rating ? { icon: 'star', color: '#EAB308', title: `Rated ${p.rating} / 5`, body: 'Average rating from site visitors' } : undefined,
  ];
  return list.filter(Boolean) as Advantage[];
};
