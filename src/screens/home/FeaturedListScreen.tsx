import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { mapProperties } from '../../api/mappers';
import { EmptyGlyph } from '../../components/hero/StatusHero';
import { Icon } from '../../components/icons/Icon';
import { Grid } from '../../components/layout/Grid';
import { Screen, TopBar } from '../../components/layout/Screen';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { PropertyCard } from '../../components/PropertyCard';
import { Badge } from '../../components/ui/Badge';
import { Btn } from '../../components/ui/Btn';
import { Heart } from '../../components/ui/Heart';
import { Sheet } from '../../components/ui/Sheet';
import { T } from '../../components/ui/T';
import type { ScreenProps } from '../../navigation/types';
import * as properties from '../../services/properties.service';
import { colors, elev } from '../../theme';
import type { Property } from '../../types/property';
import { errorMessage } from '../../utils/errorMessage';
import { formatINR } from '../../utils/format';
import { cacheProperties } from '../../utils/propertyCache';
import { mapUiSortToApi } from '../../utils/propertyListParams';

const SORT_LABELS: Record<string, string> = { newest: 'Newest First', 'price-asc': 'Price: Low → High', 'price-desc': 'Price: High → Low' };

/** H-03 Featured list */
export function FeaturedListScreen({ go, back, fav, toggleFav }: ScreenProps) {
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [sort, setSort] = useState('newest');
  const [showSort, setShowSort] = useState(false);
  const [list, setList] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    setPage(1);
    properties
      .listProperties({ featured: true, limit: 50, page: 1, sort: mapUiSortToApi(sort) }, ac.signal)
      .then(res => {
        if (ac.signal.aborted) return;
        const mapped = mapProperties(res.items);
        cacheProperties(mapped);
        setList(mapped);
        setTotalPages(res.meta?.totalPages || 1);
      })
      .catch(err => {
        if (ac.signal.aborted) return;
        setList([]);
        setError(errorMessage(err));
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, [sort]);

  const loadMore = () => {
    if (loadingMore || page >= totalPages) return;
    const next = page + 1;
    setLoadingMore(true);
    properties
      .listProperties({ featured: true, limit: 50, page: next, sort: mapUiSortToApi(sort) })
      .then(res => {
        const mapped = mapProperties(res.items);
        cacheProperties(mapped);
        setList(prev => [...prev, ...mapped]);
        setPage(next);
        setTotalPages(res.meta?.totalPages || next);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  };

  const sorted = useMemo(() => list, [list]);
  const right = (
    <View style={styles.tools}>
      <Pressable onPress={() => go('filters')} style={styles.tool} accessibilityLabel="Filters"><Icon name="sliders-horizontal" size={14} color="#334155" /></Pressable>
      <Pressable onPress={() => setShowSort(true)} style={styles.sortBtn} accessibilityRole="button">
        <Icon name="arrow-up-down" size={11} color={colors.ink700} />
        <T s={11} w={500} c={colors.ink700}>Sort</T>
      </Pressable>
      <View style={styles.seg}>
        <Pressable onPress={() => setView('list')} style={[styles.segBtn, view === 'list' && styles.segOn]} accessibilityLabel="List view"><Icon name="list" size={14} /></Pressable>
        <Pressable onPress={() => setView('grid')} style={[styles.segBtn, view === 'grid' && styles.segOn]} accessibilityLabel="Grid view"><Icon name="grid-3x3" size={14} /></Pressable>
      </View>
    </View>
  );
  return (
    <Screen
      footer={showSort ? (
        <Sheet onClose={() => setShowSort(false)} title="Sort by">
          <View style={styles.gap8}>
            {Object.entries(SORT_LABELS).map(([k, v]) => (
              <Pressable key={k} onPress={() => { setSort(k); setShowSort(false); }} style={[styles.sortRow, sort === k ? styles.sortOn : styles.sortOff]}>
                <T s={14} w={500}>{v}</T>
                {sort === k && <Icon name="check" size={16} color="#1A6FFF" />}
              </Pressable>
            ))}
          </View>
        </Sheet>
      ) : null}>
      <TopBar onBack={back} title="Featured Properties" sub={loading ? 'Loading…' : `${list.length} hand-picked listings`} right={right} />
      <View style={styles.body}>
        {loading ? (
          <View style={styles.empty}><ActivityIndicator color={colors.brand600} /></View>
        ) : error ? (
          <View style={styles.empty}>
            <EmptyGlyph name="wifi-off" />
            <T s={15} w={600} c={colors.ink700} style={styles.mt12}>{error}</T>
          </View>
        ) : sorted.length === 0 ? (
          <View style={styles.empty}>
            <EmptyGlyph name="search-x" />
            <T s={15} w={600} c={colors.ink700} style={styles.mt12}>No properties found</T>
            <T s={12} c={colors.ink500} style={styles.mt4}>Try adjusting your filters</T>
            <Btn variant="outline" size="sm" style={styles.clear} onPress={() => setSort('newest')}>Clear Filters</Btn>
          </View>
        ) : view === 'list' ? (
          <View style={styles.gap12}>
            {sorted.map(p => <PropertyCard key={p.id} p={p} fav={fav.has(p.id)} onFav={() => toggleFav(p.id)} onPress={() => go('propertyDetail', { p })} />)}
            {page < totalPages ? (
              <Btn variant="outline" onPress={loadMore} disabled={loadingMore}>{loadingMore ? 'Loading…' : 'Load more'}</Btn>
            ) : null}
          </View>
        ) : (
          <View style={styles.gap12}>
            <Grid cols={2} gap={12}>
              {sorted.map(p => (
                <Pressable key={p.id} onPress={() => go('propertyDetail', { p })} style={styles.gridCard}>
                  <PhotoPlaceholder tag={p.id} height={110}>
                    <View style={styles.tl8}><Badge color="brand">{p.type}</Badge></View>
                    <View style={styles.tr8}><Heart active={fav.has(p.id)} onPress={() => toggleFav(p.id)} /></View>
                  </PhotoPlaceholder>
                  <View style={styles.p10}>
                    <T s={12} w={600} truncate>{p.title}</T>
                    <T s={10} c={colors.ink500} truncate>{p.location}</T>
                    <T s={13} w={700} c={colors.brand600} style={styles.mt4}>{formatINR(p.price)}</T>
                  </View>
                </Pressable>
              ))}
            </Grid>
            {page < totalPages ? (
              <Btn variant="outline" onPress={loadMore} disabled={loadingMore}>{loadingMore ? 'Loading…' : 'Load more'}</Btn>
            ) : null}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mt4: { marginTop: 4 },
  mt12: { marginTop: 12 },
  gap8: { gap: 8 },
  gap12: { gap: 12 },
  p10: { padding: 10 },
  tools: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tool: { width: 32, height: 32, borderRadius: 9999, backgroundColor: colors.ink100, alignItems: 'center', justifyContent: 'center' },
  sortBtn: { height: 32, paddingHorizontal: 8, borderRadius: 9999, backgroundColor: colors.ink100, flexDirection: 'row', alignItems: 'center', gap: 4 },
  seg: { flexDirection: 'row', backgroundColor: colors.ink100, borderRadius: 9999, padding: 2 },
  segBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9999 },
  segOn: { backgroundColor: colors.white, boxShadow: elev.sm },
  body: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { paddingVertical: 64, alignItems: 'center' },
  clear: { marginTop: 16, alignSelf: 'center' },
  gridCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.ink200, borderRadius: 14, overflow: 'hidden' },
  tl8: { position: 'absolute', top: 8, left: 8 },
  tr8: { position: 'absolute', top: 8, right: 8 },
  sortRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 14, borderWidth: 1 },
  sortOn: { borderColor: colors.brand600, backgroundColor: colors.brand50 },
  sortOff: { borderColor: colors.ink200 },
});
