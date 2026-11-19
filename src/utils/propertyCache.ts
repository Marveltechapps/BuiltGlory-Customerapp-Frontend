import type { Property } from '../types/property';

const cache = new Map<string, Property>();

export function cacheProperty(p: Property): void {
  if (p?.id) cache.set(p.id, p);
}

export function cacheProperties(list: Property[]): void {
  for (const p of list) cacheProperty(p);
}

export function getCachedProperty(id: string): Property | undefined {
  return cache.get(id);
}

export function clearPropertyCache(): void {
  cache.clear();
}
