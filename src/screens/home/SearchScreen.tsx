import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, Input } from '../../components/Form';
import { Icon } from '../../components/Icon';
import { Grid } from '../../components/Layout';
import { PropertyCard } from '../../components/PropertyCard';
import { Press } from '../../components/Press';
import { Screen } from '../../components/Screen';
import { ErrorState, LoadingState } from '../../components/States';
import { T } from '../../components/T';
import { PROPERTY_TYPES } from '../../config/catalog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useDebounced, useResource } from '../../lib/useResource';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { listProperties } from '../../services/property.service';
import {
  clearRecentSearches,
  getRecentSearches,
  getTrendingSearches,
  recordSearch,
} from '../../services/search.service';
import { tw } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { toPropertyView } from '../../utils/property';

/** H-02 Search. */
export function SearchScreen({ params }: ScreenProps<'search'>) {
  const nav = useNav();
  const toast = useToast();
  const { isSignedIn, user } = useAuth();
  const [q, setQ] = useState(params?.q ?? '');
  const term = useDebounced(q.trim(), 350);
  const recents = useResource(
    signal => getRecentSearches(signal),
    [isSignedIn],
    isSignedIn,
  );
  const trending = useResource(signal => getTrendingSearches(signal), []);
  const results = useResource(
    signal =>
      listProperties({ search: term, limit: 20 }, signal).then(r => ({
        items: r.data.map(toPropertyView),
        total: r.meta.total,
      })),
    [term],
    term.length > 0,
  );

  const remember = (value: string, count: number) => {
    if (isSignedIn && value.trim().length >= 2)
      recordSearch(value.trim(), count)
        .then(list => recents.setData(list))
        .catch(() => undefined);
  };
  const clear = async () => {
    try {
      recents.setData(await clearRecentSearches());
    } catch (e) {
      toast.show(errorMessage(e), 'error');
    }
  };

  const list = results.data?.items ?? [];
  return (
    <Screen>
      <View style={styles.header}>
        <Press onPress={nav.back} accessibilityLabel="Back" style={styles.back}>
          <Icon name="arrow-left" size={20} />
        </Press>
        <Input
          icon="search"
          autoFocus
          placeholder="Search city, area or property"
          value={q}
          onChangeText={setQ}
          returnKeyType="search"
          onSubmitEditing={() => remember(q, results.data?.total ?? 0)}
          containerStyle={styles.flex}
        />
        {q ? (
          <Press
            onPress={() => nav.go('filters', { filters: { search: q.trim() } })}
            style={styles.filter}
            accessibilityLabel="Filters"
          >
            <Icon name="sliders-horizontal" size={16} color="#1A6FFF" />
          </Press>
        ) : null}
      </View>
      <View style={styles.body}>
        {!q ? (
          <>
            {isSignedIn && (
              <View style={styles.block}>
                <View style={styles.blockHead}>
                  <T style={styles.h3}>Recent searches</T>
                  {(recents.data?.length ?? 0) > 0 && (
                    <Press onPress={clear} pressScale={1}>
                      <T style={styles.clear}>Clear</T>
                    </Press>
                  )}
                </View>
                {recents.loading ? (
                  <LoadingState style={styles.miniLoad} />
                ) : (recents.data ?? []).length === 0 ? (
                  <T style={styles.none}>No recent searches yet</T>
                ) : (
                  <View style={styles.recentList}>
                    {(recents.data ?? []).map(r => (
                      <Press
                        key={r}
                        onPress={() => setQ(r)}
                        pressScale={1}
                        pressedStyle={styles.rowPressed}
                        style={styles.recentRow}
                      >
                        <Icon name="clock" size={14} color="#94A3B8" />
                        <T style={styles.recentText}>{r}</T>
                        <Icon name="arrow-up-left" size={14} color="#94A3B8" />
                      </Press>
                    ))}
                  </View>
                )}
              </View>
            )}
            <View style={styles.block}>
              <T style={[styles.h3, styles.mb2]}>
                Trending in {user?.city || 'Chennai'}
              </T>
              {trending.error ? (
                <ErrorState
                  compact
                  message={trending.error}
                  onRetry={trending.reload}
                />
              ) : (
                <View style={styles.chips}>
                  {(trending.data ?? []).map(t => (
                    <Chip key={t} icon="trending-up" onPress={() => setQ(t)}>
                      {t}
                    </Chip>
                  ))}
                </View>
              )}
            </View>
            <View>
              <T style={[styles.h3, styles.mb2]}>Browse by type</T>
              <Grid cols={4} gap={8}>
                {PROPERTY_TYPES.slice(0, 8).map(t => (
                  <Press
                    key={t.id}
                    onPress={() =>
                      nav.go('buyList', {
                        filters: { typeId: t.id, apiType: t.apiType },
                      })
                    }
                    style={styles.typeTile}
                  >
                    <Icon name={t.icon} size={20} color="#1A6FFF" />
                    <T style={styles.typeLabel}>{t.label}</T>
                  </Press>
                ))}
              </Grid>
            </View>
          </>
        ) : (
          <View style={styles.results}>
            {results.loading ? (
              <LoadingState label="Searching…" />
            ) : results.error ? (
              <ErrorState message={results.error} onRetry={results.reload} />
            ) : (
              <>
                <T style={styles.count}>
                  {results.data?.total ?? 0} results for "{q.trim()}"
                </T>
                {list.length === 0 ? (
                  <View style={styles.empty}>
                    <Icon name="search-x" size={36} color="#CBD5E1" />
                    <T style={styles.emptyText}>No results found</T>
                  </View>
                ) : (
                  list.map(p => (
                    <PropertyCard
                      key={p.id}
                      p={p}
                      variant="compact"
                      onPress={() => {
                        remember(q, results.data?.total ?? 0);
                        nav.go('propertyDetail', { id: p.id, property: p });
                      }}
                    />
                  ))
                )}
              </>
            )}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: tw('flex-1'),
  header: tw('px-4 pt-2 pb-3 flex items-center gap-2'),
  back: { ...tw('p-2 rounded-full'), marginLeft: -4 },
  filter: tw('w-10 h-10 rounded-card bg-brand-50 items-center justify-center'),
  body: tw('px-4'),
  block: tw('mb-5'),
  blockHead: tw('flex items-center justify-between mb-2'),
  h3: tw('text-[13px] font-semibold text-ink-700'),
  mb2: tw('mb-2'),
  clear: tw('text-[11px] text-ink-500'),
  miniLoad: tw('py-4'),
  none: tw('text-[12px] text-ink-400 py-2'),
  recentList: { gap: 4 },
  recentRow: tw('w-full flex items-center gap-3 p-3 rounded-card'),
  rowPressed: tw('bg-ink-50'),
  recentText: tw('flex-1 text-[14px]'),
  chips: tw('flex flex-wrap gap-2'),
  typeTile: tw(
    'aspect-square rounded-card border border-ink-200 items-center justify-center gap-1',
  ),
  typeLabel: tw('text-[10px] font-medium text-center px-1'),
  results: { ...tw('mt-2'), gap: 8 },
  count: tw('text-[11px] text-ink-500'),
  empty: tw('py-12 items-center'),
  emptyText: tw('mt-2 text-[13px] text-ink-400'),
});
