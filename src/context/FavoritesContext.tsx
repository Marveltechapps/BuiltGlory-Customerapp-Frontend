import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  listFavorites,
  saveProperty,
  unsaveProperty,
} from '../services/property.service';
import type { Property } from '../types/property';
import { errorMessage } from '../utils/errorMessage';
import { useAuth } from './AuthContext';

interface FavoritesValue {
  ids: Set<string>;
  items: Property[];
  loading: boolean;
  error: string | null;
  isSaved(id: string): boolean;
  /** Optimistic save/unsave (POST|DELETE /properties/:id/save). Rejects with the API error on failure. */
  toggle(id: string): Promise<boolean>;
  reload(): Promise<void>;
}

const FavoritesContext = createContext<FavoritesValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  const [items, setItems] = useState<Property[]>([]);
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idsRef = useRef(ids);
  idsRef.current = ids;

  const reload = useCallback(async () => {
    if (!isSignedIn) return;
    setLoading(true);
    setError(null);
    try {
      const list = await listFavorites();
      setItems(list);
      setIds(new Set(list.map(p => p._id)));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (isSignedIn) reload();
    else {
      setItems([]);
      setIds(new Set());
    }
  }, [isSignedIn, reload]);

  const toggle = useCallback(async (id: string) => {
    const wasSaved = idsRef.current.has(id);
    setIds(prev => {
      const next = new Set(prev);
      if (wasSaved) next.delete(id);
      else next.add(id);
      return next;
    });
    try {
      if (wasSaved) {
        await unsaveProperty(id);
        setItems(prev => prev.filter(p => p._id !== id));
      } else {
        const property = await saveProperty(id);
        setItems(prev => [property, ...prev.filter(p => p._id !== id)]);
      }
      return !wasSaved;
    } catch (e) {
      setIds(prev => {
        const next = new Set(prev);
        if (wasSaved) next.add(id);
        else next.delete(id);
        return next;
      });
      throw e;
    }
  }, []);

  const value = useMemo<FavoritesValue>(
    () => ({
      ids,
      items,
      loading,
      error,
      isSaved: (id: string) => ids.has(id),
      toggle,
      reload,
    }),
    [ids, items, loading, error, toggle, reload],
  );
  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx)
    throw new Error('useFavorites must be used inside FavoritesProvider');
  return ctx;
}
