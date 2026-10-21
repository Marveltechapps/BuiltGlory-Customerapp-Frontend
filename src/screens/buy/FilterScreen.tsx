import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Btn } from '../../components/Btn';
import { Chip, Field, Input } from '../../components/Form';
import { RangeSlider } from '../../components/Interactive';
import { Grid } from '../../components/Layout';
import { Press } from '../../components/Press';
import { Screen, ScreenFooter } from '../../components/Screen';
import { T } from '../../components/T';
import type { BuyFilters } from '../../interfaces/BuyFilters';
import { useDebounced, useResource } from '../../lib/useResource';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { listProperties } from '../../services/property.service';
import { tw } from '../../theme';
import {
  AREA_RANGE,
  BUDGET_RANGE,
  DEFAULT_AREA,
  DEFAULT_BUDGET,
  toPropertyQuery,
} from '../../utils/filters';

const BHKS = ['1', '2', '3', '4', '5+'];
const SORTS: Array<[NonNullable<BuyFilters['sort']>, string]> = [
  ['relevance', 'Most relevant'],
  ['price_asc', 'Price: Low–High'],
  ['price_desc', 'Price: High–Low'],
  ['newest', 'Newest first'],
];

/** B-02 Filters. "Show N results" is the live total from GET /properties with these filters. */
export function FilterScreen({ params }: ScreenProps<'filters'>) {
  const nav = useNav();
  const initial = params.filters;
  const [city, setCity] = useState(initial.city ?? 'Chennai');
  const [budget, setBudget] = useState<[number, number]>(
    initial.budget ?? DEFAULT_BUDGET,
  );
  const [area, setArea] = useState<[number, number]>(
    initial.area ?? DEFAULT_AREA,
  );
  const [bhk, setBhk] = useState<Set<string>>(
    new Set(initial.bhk ?? ['2', '3']),
  );
  const [sort, setSort] = useState<NonNullable<BuyFilters['sort']>>(
    initial.sort ?? 'relevance',
  );

  const next: BuyFilters = {
    ...initial,
    city,
    budget,
    area,
    bhk: [...bhk],
    sort,
  };
  const debounced = useDebounced(JSON.stringify(next), 400);
  const count = useResource(
    signal =>
      listProperties(
        { ...toPropertyQuery(JSON.parse(debounced) as BuyFilters), limit: 1 },
        signal,
      ).then(r => r.meta.total),
    [debounced],
  );

  const toggleBhk = (b: string) =>
    setBhk(prev => {
      const s = new Set(prev);
      if (s.has(b)) s.delete(b);
      else s.add(b);
      return s;
    });
  const reset = () => {
    setBudget(DEFAULT_BUDGET);
    setArea(DEFAULT_AREA);
    setBhk(new Set());
  };
  const apply = () => nav.popTo('buyList', { filters: next });

  return (
    <Screen
      topBar={{
        title: 'Filters',
        back: true,
        right: (
          <Press onPress={reset} pressScale={1}>
            <T style={styles.reset}>Reset</T>
          </Press>
        ),
      }}
      footer={
        <ScreenFooter style={styles.footer}>
          <Btn variant="outline" onPress={nav.back}>
            Clear all
          </Btn>
          <Btn
            style={styles.flex}
            onPress={apply}
            loading={count.loading && count.data === undefined}
          >
            {count.data === undefined
              ? 'Show results'
              : `Show ${count.data} results`}
          </Btn>
        </ScreenFooter>
      }
    >
      <View style={styles.body}>
        <Field label="Location">
          <Input
            icon="map-pin"
            placeholder="Chennai, Bengaluru…"
            value={city}
            onChangeText={setCity}
          />
        </Field>
        <View>
          <View style={styles.rowHead}>
            <T style={styles.label}>Budget</T>
            <T style={styles.value}>
              ₹{budget[0]}L – ₹{budget[1]}L
            </T>
          </View>
          <RangeSlider
            min={BUDGET_RANGE[0]}
            max={BUDGET_RANGE[1]}
            step={5}
            value={budget}
            onChange={setBudget}
          />
        </View>
        <View>
          <View style={styles.rowHead}>
            <T style={styles.label}>Area (sqft)</T>
            <T style={styles.value}>
              {area[0]} – {area[1]}
            </T>
          </View>
          <RangeSlider
            min={AREA_RANGE[0]}
            max={AREA_RANGE[1]}
            step={50}
            value={area}
            onChange={setArea}
          />
        </View>
        <View>
          <T style={[styles.label, styles.mb2]}>BHK</T>
          <View style={styles.chips}>
            {BHKS.map(b => (
              <Chip key={b} active={bhk.has(b)} onPress={() => toggleBhk(b)}>
                {b} BHK
              </Chip>
            ))}
          </View>
        </View>
        <View>
          <T style={[styles.label, styles.mb2]}>Sort by</T>
          <Grid cols={2} gap={8}>
            {SORTS.map(([id, l]) => (
              <Press
                key={id}
                onPress={() => setSort(id)}
                style={[
                  styles.sortBtn,
                  sort === id ? styles.sortOn : styles.sortOff,
                ]}
              >
                <T style={[styles.sortText, sort === id && styles.sortTextOn]}>
                  {l}
                </T>
              </Press>
            ))}
          </Grid>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  reset: tw('text-brand-600 text-sm font-semibold'),
  footer: tw('flex gap-3'),
  body: { ...tw('px-4'), gap: 20 },
  rowHead: tw('flex items-center justify-between mb-2'),
  label: tw('text-[13px] font-medium'),
  value: tw('text-[12px] text-brand-600 font-semibold'),
  mb2: tw('mb-2'),
  chips: tw('flex flex-wrap gap-2'),
  sortBtn: tw('p-2.5 rounded-card border'),
  sortOn: tw('border-brand-600 bg-brand-50'),
  sortOff: tw('border-ink-200'),
  sortText: tw('text-[12px]'),
  sortTextOn: tw('text-brand-700 font-semibold'),
});
