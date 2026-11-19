import { useEffect, useState } from 'react';
import { mapProperty } from '../api/mappers';
import * as properties from '../services/properties.service';
import type { Property } from '../types/property';
import { errorMessage } from './errorMessage';
import { cacheProperty, getCachedProperty } from './propertyCache';

type CtxLike = {
  p?: Property;
  propertyId?: string;
  pid?: string;
} | null | undefined;

export function resolvePropertyId(ctx: CtxLike): string | undefined {
  return ctx?.p?.id || ctx?.propertyId || ctx?.pid || undefined;
}

/** Prefer ctx.p / cache; otherwise fetch by id. */
export function useResolvedProperty(ctx: CtxLike): {
  property: Property | null;
  loading: boolean;
  error: string | null;
  propertyId: string | undefined;
} {
  const propertyId = resolvePropertyId(ctx);
  const seeded = ctx?.p || (propertyId ? getCachedProperty(propertyId) : undefined) || null;
  const [property, setProperty] = useState<Property | null>(seeded);
  const [loading, setLoading] = useState(!seeded && !!propertyId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ctx?.p) {
      cacheProperty(ctx.p);
      setProperty(ctx.p);
      setLoading(false);
      setError(null);
      return;
    }
    if (!propertyId) {
      setProperty(null);
      setLoading(false);
      setError(null);
      return;
    }
    const cached = getCachedProperty(propertyId);
    if (cached) {
      setProperty(cached);
      setLoading(false);
      setError(null);
      return;
    }

    const ac = new AbortController();
    setLoading(true);
    setError(null);
    properties
      .getPropertyById(propertyId, ac.signal)
      .then(api => {
        const mapped = mapProperty(api);
        cacheProperty(mapped);
        setProperty(mapped);
      })
      .catch(err => {
        if (ac.signal.aborted) return;
        setProperty(null);
        setError(errorMessage(err));
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => ac.abort();
  }, [ctx?.p, propertyId]);

  return { property, loading, error, propertyId };
}
