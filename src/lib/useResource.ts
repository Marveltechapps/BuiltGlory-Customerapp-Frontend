import { useCallback, useEffect, useRef, useState } from 'react';
import type { PageMeta } from '../types/api';
import { ApiError } from '../api';
import { errorMessage, isAbort } from '../utils/errorMessage';

export interface Resource<T> {
  data: T | undefined;
  error: string | null;
  /** HTTP status of the last failure (404 = gone), when the failure came from the API. */
  errorStatus: number | null;
  loading: boolean;
  refreshing: boolean;
  /** Re-run with the loading state (after a mutation). */
  reload(): void;
  /** Re-run keeping current data (pull-to-refresh). */
  refresh(): void;
  setData(updater: T | ((prev: T | undefined) => T)): void;
}

/**
 * Screen-owned data loading, the pattern from the architecture's SampleScreen: each run creates an
 * AbortController, failures go through `errorMessage`, and unmount aborts the in-flight request.
 */
export function useResource<T>(
  loader: (signal: AbortSignal) => Promise<T>,
  deps: unknown[],
  enabled = true,
): Resource<T> {
  const [data, setDataState] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);
  const mode = useRef<'load' | 'refresh'>('load');
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    if (mode.current === 'refresh') setRefreshing(true);
    else setLoading(true);
    setError(null);
    setErrorStatus(null);
    loaderRef
      .current(controller.signal)
      .then(result => {
        if (!controller.signal.aborted) setDataState(result);
      })
      .catch(reason => {
        if (!controller.signal.aborted && !isAbort(reason)) {
          setError(errorMessage(reason));
          setErrorStatus(reason instanceof ApiError ? reason.status : null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
          mode.current = 'load';
        }
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick, enabled]);

  const reload = useCallback(() => {
    mode.current = 'load';
    setTick(t => t + 1);
  }, []);
  const refresh = useCallback(() => {
    mode.current = 'refresh';
    setTick(t => t + 1);
  }, []);
  const setData = useCallback((updater: T | ((prev: T | undefined) => T)) => {
    setDataState(prev =>
      typeof updater === 'function'
        ? (updater as (p: T | undefined) => T)(prev)
        : updater,
    );
  }, []);

  return {
    data,
    error,
    errorStatus,
    loading,
    refreshing,
    reload,
    refresh,
    setData,
  };
}

export interface PagedResource<T> {
  items: T[];
  total: number;
  error: string | null;
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  loadMore(): void;
  refresh(): void;
  reload(): void;
}

/** Paginated list (`page`/`limit` + `meta.totalPages`) with load-more and pull-to-refresh. */
export function usePaged<T>(
  loader: (
    page: number,
    signal: AbortSignal,
  ) => Promise<{ data: T[]; meta: PageMeta }>,
  deps: unknown[],
): PagedResource<T> {
  const [items, setItems] = useState<T[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);
  const mode = useRef<'load' | 'refresh'>('load');
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const busy = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    if (mode.current === 'refresh') setRefreshing(true);
    else {
      setLoading(true);
      setItems([]);
    }
    setError(null);
    busy.current = true;
    loaderRef
      .current(1, controller.signal)
      .then(res => {
        if (controller.signal.aborted) return;
        setItems(res.data);
        setMeta(res.meta);
      })
      .catch(reason => {
        if (!controller.signal.aborted && !isAbort(reason))
          setError(errorMessage(reason));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
          busy.current = false;
          mode.current = 'load';
        }
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const loadMore = useCallback(() => {
    if (busy.current || !meta || meta.page >= meta.totalPages) return;
    busy.current = true;
    setLoadingMore(true);
    const controller = new AbortController();
    loaderRef
      .current(meta.page + 1, controller.signal)
      .then(res => {
        setItems(prev => [...prev, ...res.data]);
        setMeta(res.meta);
      })
      .catch(reason => setError(errorMessage(reason)))
      .finally(() => {
        busy.current = false;
        setLoadingMore(false);
      });
  }, [meta]);

  return {
    items,
    total: meta?.total ?? 0,
    error,
    loading,
    loadingMore,
    refreshing,
    loadMore,
    refresh: () => {
      mode.current = 'refresh';
      setTick(t => t + 1);
    },
    reload: () => {
      mode.current = 'load';
      setTick(t => t + 1);
    },
  };
}

/** Debounce a changing value (search-as-you-type). */
export function useDebounced<T>(value: T, ms = 350): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Ticks every `ms` while mounted (countdowns). */
export function useNow(ms = 1000): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}
