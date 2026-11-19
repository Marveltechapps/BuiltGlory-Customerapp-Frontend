import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { mapProperties } from '../../api/mappers';
import { Icon } from '../../components/icons/Icon';
import { CompareToggle } from '../../components/journey/BuyParts';
import { AppScreen } from '../../components/layout/AppScreen';
import { PropertyCard } from '../../components/PropertyCard';
import { Btn } from '../../components/ui/Btn';
import { Chip } from '../../components/ui/Chip';
import { EmptyState } from '../../components/ui/EmptyState';
import { RiseIn } from '../../components/ui/Motion';
import { buzz, Press } from '../../components/ui/Press';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { T } from '../../components/ui/T';
import { PROPERTY_TYPES } from '../../config/sampleData';
import { applyQuick, BF_DEFAULT, bfCount, QUICK, setBF, useBF, useJ } from '../../context/journeyStore';
import type { ScreenProps } from '../../navigation/types';
import * as properties from '../../services/properties.service';
import { colors, ring } from '../../theme';
import type { Property } from '../../types/property';
import { errorMessage } from '../../utils/errorMessage';
import { cacheProperties } from '../../utils/propertyCache';
import { filtersFromBuyFilters } from '../../utils/propertyListParams';

/** B-03 Listing results */
export function BuyListScreen({ go, back, ctx, fav, toggleFav }: ScreenProps) {
  const type: string = ctx?.type || 'apartment';
  const f = useBF();
  const js = useJ();
  const [chips, setChips] = useState<Set<string>>(new Set());
  const [raw, setRaw] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const togChip = (c: string) => { const s = new Set(chips); if (s.has(c)) s.delete(c); else s.add(c); setChips(s); buzz(); };
  const list = applyQuick(raw, chips);
  const nF = bfCount(f) + chips.size;
  const lt = f.types.length === 1 ? f.types[0] : f.types.length ? null : type;
  const label = lt ? (PROPERTY_TYPES.find(t => t.id === lt)?.label || 'Properties') : 'Properties';
  const clearAll = () => { setBF({ ...BF_DEFAULT }); setChips(new Set()); };

  const load = useCallback(() => {
    void refreshKey; // bump identity so pull-to-refresh reloads
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    const params = {
      ...filtersFromBuyFilters(f, type),
      page: 1,
      limit: 50,
      ...(chips.has('Verified') ? { verified: true } : {}),
      ...(chips.has('Negotiable') ? { negotiable: true } : {}),
    };
    properties
      .listProperties(params, ac.signal)
      .then(res => {
        if (ac.signal.aborted) return;
        let mapped = mapProperties(res.items);
        // Client-side quick chips that API may not cover exactly
        if (chips.has('Under ₹1Cr')) mapped = mapped.filter(p => p.price < 1e7);
        if (chips.has('3+ BHK')) mapped = mapped.filter(p => p.bhk >= 3);
        cacheProperties(mapped);
        setRaw(mapped);
      })
      .catch(err => {
        if (ac.signal.aborted) return;
        setRaw([]);
        setError(errorMessage(err));
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, [f, type, chips, refreshKey]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  return (
    <AppScreen
      title={label}
      sub={loading ? 'Loading…' : error ? 'Could not load' : `${list.length} properties`}
      onBack={back}
      onRefresh={!loading ? () => setRefreshKey(k => k + 1) : undefined}
      right={
        <Press onPress={() => go('mapView')} style={styles.mapBtn} accessibilityLabel="Map view">
          <Icon name="map" size={16} />
        </Press>
      }
      sticky={
        <View style={styles.gap8}>
          <View style={styles.row8}>
            <Press onPress={() => go('filters', { type, fromList: true })} style={styles.filters}>
              <Icon name="sliders-horizontal" size={14} color={colors.ink700} />
              <T s={13} w={600} c={colors.ink700}>Filters</T>
              {nF > 0 && <View style={styles.count}><T num s={10} w={700} c="#FFFFFF" lh={1}>{nF}</T></View>}
            </Press>
            <Press onPress={() => go('advancedFilters')} style={styles.advanced}>
              <Icon name="settings-2" size={14} color="#1A6FFF" />
              <T s={13} w={700} c={colors.brand700}>Advanced</T>
            </Press>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {Object.keys(QUICK).map(c => <Chip key={c} active={chips.has(c)} onPress={() => togChip(c)}>{c}</Chip>)}
            {nF > 0 && <Pressable onPress={clearAll} style={styles.clear}><T s={12} w={700} c={colors.rose600}>Clear</T></Pressable>}
          </ScrollView>
        </View>
      }
      dock={[
        <Btn key="map" variant="outline" icon="map" full onPress={() => go('mapView')}>Map</Btn>,
        js.compare.length > 0
          ? <Btn key="cmp" icon="git-compare" full onPress={() => go('compare')}>{`Compare (${js.compare.length})`}</Btn>
          : <Btn key="flt" icon="sliders-horizontal" full onPress={() => go('filters', { type, fromList: true })}>Filters</Btn>,
      ]}>
      {loading ? (
        <View style={styles.list}>{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</View>
      ) : error ? (
        <EmptyState icon="wifi-off" title="Couldn’t load properties" body={error}
          action={<Btn onPress={() => setRefreshKey(k => k + 1)}>Retry</Btn>} />
      ) : list.length === 0 ? (
        <EmptyState icon="search-x" title="No properties found"
          body="Try adjusting your filters or search a different area."
          action={
            <View style={styles.emptyActions}>
              <Btn variant="outline" onPress={() => go('filters', { type, fromList: true })}>Change filters</Btn>
              {nF > 0 && <Btn onPress={clearAll}>Clear filters</Btn>}
            </View>
          } />
      ) : (
        <View style={styles.list}>
          {list.map((p, i) => (
            <RiseIn key={p.id} delay={Math.min(i * 50, 300)} duration={550} distance={16}>
              <View>
                <PropertyCard p={p} fav={fav.has(p.id)} onFav={() => toggleFav(p.id)} onPress={() => go('propertyDetail', { p })} />
                <CompareToggle pid={p.id} />
              </View>
            </RiseIn>
          ))}
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  gap8: { gap: 8 },
  row8: { flexDirection: 'row', gap: 8 },
  mapBtn: { width: 36, height: 36, borderRadius: 9999, backgroundColor: colors.ink100, alignItems: 'center', justifyContent: 'center' },
  filters: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 40, borderRadius: 12, borderWidth: 1, borderColor: colors.ink200, backgroundColor: colors.white },
  count: { width: 18, height: 18, borderRadius: 9999, backgroundColor: colors.brand600, alignItems: 'center', justifyContent: 'center' },
  advanced: { paddingHorizontal: 14, height: 40, borderRadius: 12, backgroundColor: colors.brand50, boxShadow: ring(colors.brand100), flexDirection: 'row', alignItems: 'center', gap: 6 },
  chips: { gap: 8, alignItems: 'center' },
  clear: { paddingHorizontal: 8 },
  list: { paddingHorizontal: 16, marginTop: 12, gap: 14 },
  emptyActions: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
});
