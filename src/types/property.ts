export type PropertyKind = 'apartment' | 'villa' | 'plot' | 'commercial' | string;

export interface Property {
  id: string;
  title: string;
  price: number;
  type: PropertyKind;
  bhk: number;
  area: number;
  floor: string;
  flatNo: string;
  location: string;
  city: string;
  images: string[];
  amenities: string[];
  verified: boolean;
  negotiable: boolean;
  views: number;
  enquiries: number;
  posted: string;
  rating: number;
  sqftPrice: number;
  builder: string;
  desc: string;
  badge: string;
  launchDate?: string;
  soldOut?: boolean;
  soldOn?: string;
}

export interface PropertyType {
  id: string;
  label: string;
  sub: string;
  icon: string;
}

export interface Spec {
  label: string;
  icon: string;
}

export interface Faq {
  q: string;
  a: string;
}

export interface SharedDoc {
  id: string;
  name: string;
  meta: string;
}

export interface FaqTopic {
  id: string;
  label: string;
  icon: string;
  count: number;
}
