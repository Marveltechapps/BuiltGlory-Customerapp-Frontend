import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../../components/icons/Icon';
import { DockBar } from '../../components/layout/AppScreen';
import { Grid } from '../../components/layout/Grid';
import { Screen, TopBar } from '../../components/layout/Screen';
import { Btn } from '../../components/ui/Btn';
import { Chip } from '../../components/ui/Chip';
import { DualRange } from '../../components/ui/DualRange';
import { Field, Input } from '../../components/ui/Field';
import { FadeIn, PopIn } from '../../components/ui/Motion';
import { buzz, Press } from '../../components/ui/Press';
import { T } from '../../components/ui/T';
import { BF_DEFAULT, getBF, setBF, type BuyFilters } from '../../context/journeyStore';
import type { ScreenProps } from '../../navigation/types';
import * as properties from '../../services/properties.service';
import { colors } from '../../theme';
import { filtersFromBuyFilters } from '../../utils/propertyListParams';

const FILTER_TYPES: [string, string, string][] = [['land', 'Land', 'trees'], ['plot', 'Plot', 'land-plot'], ['villa', 'Villa', 'home'], ['apartment', 'Apartment', 'building-2'], ['commercial', 'Commercial', 'store']];
const SORTS: [string, string][] = [['relevance', 'Most relevant'], ['price-asc', 'Price: Low–High'], ['price-desc', 'Price: High–Low'], ['new', 'Newest first']];
const fmtL = (v: number) => (v >= 100 ? '₹' + (v / 100).toFixed(v % 100 ? 1 : 0) + ' Cr' : '₹' + v + ' L');

/** B-02 Filters (applies to the listing results) */
export function FilterScreen({ go, back, ctx }: ScreenProps) {
  const BF = getBF();
  const start: BuyFilters = BF.types.length ? BF : { ...BF, types: FILTER_TYPES.some(t => t[0] === ctx?.type) ? [ctx.type] : [] };
  const [f, setF] = useState<BuyFilters>(start);
  const [count, setCount] = useState<number | null>(null);
  const [counting, setCounting] = useState(false);
  const up = <K extends keyof BuyFilters>(k: K, v: BuyFilters[K]) => setF(x => ({ ...x, [k]: v }));
  const tog = (k: 'types' | 'bhk', v: string | number) => setF(x => {
    const arr = x[k] as (string | number)[];
    return { ...x, [k]: arr.includes(v) ? arr.filter(y => y !== v) : [...arr, v] };
  });
  const showBHK = f.types.length === 0 || f.types.includes('villa') || f.types.includes('apartment');
  const eff: BuyFilters = showBHK ? f : { ...f, bhk: [] };

  const filterKey = JSON.stringify({
    types: eff.types,
    budget: eff.budget,
    area: eff.area,
    bhk: eff.bhk,
    sort: eff.sort,
    location: eff.location,
    type: ctx?.type,
  });

  useEffect(() => {
    const ac = new AbortController();
    setCounting(true);
    const t = setTimeout(() => {
      properties
        .listProperties({ ...filtersFromBuyFilters(eff, ctx?.type), page: 1, limit: 1 }, ac.signal)
        .then(res => {
          if (!ac.signal.aborted) setCount(res.meta?.total ?? res.items.length);
        })
        .catch(() => {
          if (!ac.signal.aborted) setCount(null);
        })
        .finally(() => {
          if (!ac.signal.aborted) setCounting(false);
        });
    }, 280);
    return () => {
      clearTimeout(t);
      ac.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filterKey serializes eff + type
  }, [filterKey]);

  const apply = () => {
    setBF(eff);
    buzz();
    if (ctx?.fromList) back();
    else go('buyList', { type: eff.types[0] || ctx?.type || 'apartment', fromFilter: true });
  };
  const countLabel = counting
    ? 'Counting…'
    : count === null
      ? 'Show results'
      : count === 0
        ? 'No matches'
        : `Show ${count} ${count === 1 ? 'result' : 'results'}`;

  return (
    <Screen
      footer={
        <DockBar legacy>
          <Btn variant="outline" full onPress={() => setF({ ...BF_DEFAULT })}>Clear all</Btn>
          <Btn full onPress={apply} disabled={count === 0}>{countLabel}</Btn>
        </DockBar>
      }>
      <TopBar onBack={back} title="Filters" right={
        <Pressable onPress={() => { setF({ ...BF_DEFAULT }); buzz(); }} style={styles.reset}><T s={14} w={600} c={colors.brand600}>Reset</T></Pressable>
      } />
      <View style={styles.body}>
        <Field label="Location">
          <Input icon="map-pin" placeholder="Area, locality or city" value={f.location} onChangeText={v => up('location', v)} />
        </Field>
        <View>
          <View style={styles.labelRow}>
            <T s={13} w={600}>Property type</T>
            <T s={12} c={colors.ink500}>{f.types.length === 0 ? 'Any' : `${f.types.length} selected`}</T>
          </View>
          <Grid cols={5} gap={8}>
            {FILTER_TYPES.map(([id, l, ic]) => {
              const on = f.types.includes(id);
              return (
                <Press key={id} onPress={() => { tog('types', id); buzz(); }} accessibilityState={{ selected: on }} style={[styles.type, on ? styles.typeOn : styles.typeOff]}>
                  {on && <PopIn style={styles.check}><Icon name="check" size={10} color="white" strokeWidth={3} /></PopIn>}
                  <Icon name={ic} size={20} color={on ? '#1A6FFF' : '#64748B'} />
                  <T s={10.5} w={600} lh={1} c={on ? colors.brand700 : colors.ink600}>{l}</T>
                </Press>
              );
            })}
          </Grid>
        </View>
        <View>
          <View style={[styles.labelRow, styles.mb4]}>
            <T s={13} w={600}>Budget</T>
            <T num s={12} w={700} c={colors.brand600}>{fmtL(f.budget[0])} – {f.budget[1] >= 300 ? '₹3 Cr+' : fmtL(f.budget[1])}</T>
          </View>
          <DualRange min={10} max={300} step={5} value={f.budget} onChange={v => up('budget', v)} />
        </View>
        <View>
          <View style={[styles.labelRow, styles.mb4]}>
            <T s={13} w={600}>Area (sqft)</T>
            <T num s={12} w={700} c={colors.brand600}>{f.area[0]} – {f.area[1] >= 4000 ? '4000+' : f.area[1]}</T>
          </View>
          <DualRange min={0} max={4000} step={100} value={f.area} onChange={v => up('area', v)} />
        </View>
        {showBHK && (
          <FadeIn>
            <T s={13} w={600} style={styles.mb8}>BHK</T>
            <View style={styles.wrap}>
              {([1, 2, 3, 4, '5+'] as (number | string)[]).map(b => <Chip key={b} active={f.bhk.includes(b)} onPress={() => tog('bhk', b)}>{b} BHK</Chip>)}
            </View>
          </FadeIn>
        )}
        <View>
          <T s={13} w={600} style={styles.mb8}>Sort by</T>
          <Grid cols={2} gap={8}>
            {SORTS.map(([id, l]) => (
              <Press key={id} onPress={() => up('sort', id)} style={[styles.sort, f.sort === id ? styles.sortOn : styles.sortOff]}>
                <T s={12} w={f.sort === id ? 600 : 400} c={f.sort === id ? colors.brand700 : colors.ink900}>{l}</T>
              </Press>
            ))}
          </Grid>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  reset: { paddingHorizontal: 8 },
  body: { paddingHorizontal: 16, paddingBottom: 112, gap: 24 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  mb4: { marginBottom: 4 },
  mb8: { marginBottom: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  type: { alignItems: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  typeOn: { borderColor: colors.brand600, backgroundColor: colors.brand50 },
  typeOff: { borderColor: colors.ink200, backgroundColor: colors.white },
  check: { position: 'absolute', top: -6, right: -6, width: 16, height: 16, borderRadius: 9999, backgroundColor: colors.brand600, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  sort: { padding: 10, borderRadius: 12, borderWidth: 1 },
  sortOn: { borderColor: colors.brand600, backgroundColor: colors.brand50 },
  sortOff: { borderColor: colors.ink200 },
});
