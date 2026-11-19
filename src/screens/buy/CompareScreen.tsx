import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { mapProperties } from '../../api/mappers';
import { Icon } from '../../components/icons/Icon';
import { DockBar } from '../../components/layout/AppScreen';
import { Screen, TopBar } from '../../components/layout/Screen';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { Btn } from '../../components/ui/Btn';
import { EmptyState } from '../../components/ui/EmptyState';
import { buzz, Press } from '../../components/ui/Press';
import { Sheet } from '../../components/ui/Sheet';
import { T } from '../../components/ui/T';
import { getJ, jFind, jSet, jToggleCompare, useJ } from '../../context/journeyStore';
import type { ScreenProps } from '../../navigation/types';
import * as properties from '../../services/properties.service';
import { colors, elev, ring } from '../../theme';
import type { Property } from '../../types/property';
import { formatINR } from '../../utils/format';
import { cacheProperties, getCachedProperty } from '../../utils/propertyCache';
import { useResolvedProperty } from '../../utils/useResolvedProperty';

type RowDef = [string, (p: Property) => string | number | boolean, (v: never) => string | number, boolean?];
const ROWS: RowDef[] = [
  ['Price', p => p.price, (v: number) => formatINR(v), true],
  ['Rate / sqft', p => p.sqftPrice, (v: number) => formatINR(v), true],
  ['Area', p => p.area, (v: number) => v + ' sqft', false],
  ['Type', p => p.type, (v: string) => v[0].toUpperCase() + v.slice(1)],
  ['BHK', p => p.bhk || '—', (v: string | number) => v],
  ['Location', p => p.location, (v: string) => v],
  ['Verified', p => p.verified, (v: string) => v],
  ['Negotiable', p => p.negotiable, (v: string) => v],
  ['Rating', p => p.rating, (v: number) => v + ' ★', false],
  ['Amenities', p => (p.amenities || []).length, (v: number) => v, false],
];

const best = (vals: unknown[], low = true): number | null => {
  const nums = vals.map(Number).filter(v => !isNaN(v) && v > 0);
  if (nums.length < 2) return null;
  return low ? Math.min(...nums) : Math.max(...nums);
};

/** Compare up to 3 properties side by side */
export function CompareScreen({ go, back, ctx }: ScreenProps) {
  const s = useJ();
  const [picker, setPicker] = useState(false);
  const [catalog, setCatalog] = useState<Property[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const { property: ctxProperty } = useResolvedProperty(ctx);

  useEffect(() => {
    const J = getJ();
    const p = ctxProperty || ctx?.p;
    if (p && !J.compare.includes(p.id) && J.compare.length < 3) jToggleCompare(p.id);
    // once when property resolves
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctxProperty?.id]);

  useEffect(() => {
    if (!picker) return;
    const ac = new AbortController();
    setLoadingCatalog(true);
    properties
      .listProperties({ limit: 50, page: 1 }, ac.signal)
      .then(res => {
        if (ac.signal.aborted) return;
        const mapped = mapProperties(res.items);
        cacheProperties(mapped);
        setCatalog(mapped);
      })
      .catch(() => {
        if (!ac.signal.aborted) setCatalog([]);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoadingCatalog(false);
      });
    return () => ac.abort();
  }, [picker]);

  // Resolve compare ids from cache (and fetch missing)
  const [sel, setSel] = useState<Property[]>([]);
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      const resolved: Property[] = [];
      for (const id of s.compare) {
        const local = jFind(id) || getCachedProperty(id);
        if (local) {
          resolved.push(local);
          continue;
        }
        try {
          const api = await properties.getPropertyById(id, ac.signal);
          if (ac.signal.aborted) return;
          const mapped = mapProperties([api])[0];
          cacheProperties([mapped]);
          resolved.push(mapped);
        } catch {
          // skip missing
        }
      }
      if (!ac.signal.aborted) setSel(resolved);
    })();
    return () => ac.abort();
  }, [s.compare]);

  return (
    <Screen
      footer={
        <>
          {sel.length > 0 && (
            <DockBar legacy>
              <Btn variant="outline" full icon="plus" disabled={sel.length >= 3} onPress={() => setPicker(true)}>{sel.length >= 3 ? 'Max 3' : 'Add property'}</Btn>
              <Btn variant="outline" full icon="trash-2" onPress={() => jSet(x => ({ ...x, compare: [] }))}>Clear</Btn>
            </DockBar>
          )}
          {picker && (
            <Sheet title="Select properties" onClose={() => setPicker(false)}>
              {loadingCatalog ? (
                <View style={styles.load}><ActivityIndicator color={colors.brand600} /></View>
              ) : (
                <ScrollView style={styles.pickList} contentContainerStyle={styles.gap8} showsVerticalScrollIndicator={false}>
                  {catalog.map(p => {
                    const on = s.compare.includes(p.id), full = !on && s.compare.length >= 3;
                    return (
                      <Pressable key={p.id} disabled={full} onPress={() => { jToggleCompare(p.id); buzz(); }}
                        style={[styles.pick, on ? styles.pickOn : styles.pickOff, full && styles.faded]}>
                        <PhotoPlaceholder tag={p.id} style={styles.pickImg} />
                        <View style={styles.flex1}>
                          <T s={13} w={700} truncate>{p.title}</T>
                          <T num s={12} w={700} c={colors.brand700}>{formatINR(p.price)}</T>
                        </View>
                        <View style={[styles.tick, on ? styles.tickOn : styles.tickOff]}>{on && <Icon name="check" size={14} color="white" strokeWidth={3} />}</View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}
              <Btn full style={styles.mt16} onPress={() => setPicker(false)}>Done · {s.compare.length} selected</Btn>
            </Sheet>
          )}
        </>
      }>
      <TopBar onBack={back} title="Compare" sub={`${sel.length} of 3 selected`} />
      <View style={styles.body}>
        {sel.length === 0 ? (
          <EmptyState icon="git-compare" title="Pick properties to compare" body="Add up to 3 properties. Tick Compare on any listing, or add them here."
            action={<Btn icon="plus" style={styles.selfCenter} onPress={() => setPicker(true)}>Add properties</Btn>} />
        ) : (
          <>
            <View style={styles.cols}>
              {sel.map(p => (
                <View key={p.id} style={styles.card}>
                  <Pressable onPress={() => go('propertyDetail', { p })}>
                    <PhotoPlaceholder tag={p.id} height={84} />
                    <View style={styles.p8}><T s={11.5} w={700} lh={1.25} numberOfLines={2}>{p.title}</T></View>
                  </Pressable>
                  <Press onPress={() => jToggleCompare(p.id)} accessibilityLabel="Remove" style={styles.remove}><Icon name="x" size={12} /></Press>
                </View>
              ))}
            </View>
            {sel.length < 2 && (
              <View style={styles.hint}><T s={12} c={colors.brand800}>Add at least one more property to see a side-by-side comparison.</T></View>
            )}
            {sel.length >= 2 && (
              <View style={styles.table}>
                {ROWS.map(([k, get, fmt, low], ri) => {
                  const vals = sel.map(get);
                  const b = low === undefined ? null : best(vals, low);
                  return (
                    <View key={k} style={ri ? styles.rowDivider : null}>
                      <T s={10} w={700} upper ls={0.08} c={colors.ink400} style={styles.rowLabel}>{k}</T>
                      <View style={styles.rowVals}>
                        {vals.map((v, i) => {
                          const isBest = b !== null && Number(v) === b;
                          return (
                            <View key={i} style={styles.cell}>
                              {typeof v === 'boolean'
                                ? <Icon name={v ? 'check' : 'x'} size={15} color={v ? '#10B981' : '#94A3B8'} />
                                : (
                                  <T s={12.5} w={600} c={isBest ? colors.emerald600 : colors.ink900}>
                                    {(fmt as (x: unknown) => string | number)(v)}
                                    {isBest ? <T s={9} w={700} upper c={colors.emerald600} style={styles.bestTag}>{' '}best</T> : null}
                                  </T>
                                )}
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  gap8: { gap: 8 },
  mt16: { marginTop: 16 },
  p8: { padding: 8 },
  selfCenter: { alignSelf: 'center' },
  faded: { opacity: 0.45 },
  load: { paddingVertical: 32, alignItems: 'center' },
  body: { paddingHorizontal: 16, paddingBottom: 112 },
  cols: { flexDirection: 'row', gap: 8 },
  card: { flex: 1, minWidth: 0, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.white, boxShadow: elev.e1 },
  remove: { position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.72)', alignItems: 'center', justifyContent: 'center' },
  hint: { marginTop: 12, borderRadius: 16, backgroundColor: colors.brand50, boxShadow: ring(colors.brand100), padding: 12 },
  table: { marginTop: 16, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.white, boxShadow: ring(colors.ink200) },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.ink100 },
  rowLabel: { paddingHorizontal: 12, paddingTop: 8 },
  rowVals: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingBottom: 8, paddingTop: 4 },
  cell: { flex: 1, minWidth: 0 },
  bestTag: { backgroundColor: colors.emerald50 },
  pickList: { maxHeight: 420, marginHorizontal: -4, paddingHorizontal: 4 },
  pick: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8, borderRadius: 16 },
  pickOn: { boxShadow: ring(colors.brand400), backgroundColor: colors.brand50 },
  pickOff: { boxShadow: ring(colors.ink200), backgroundColor: colors.white },
  pickImg: { width: 48, height: 48, borderRadius: 12 },
  tick: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tickOn: { backgroundColor: colors.brand600 },
  tickOff: { boxShadow: ring(colors.ink300) },
});
