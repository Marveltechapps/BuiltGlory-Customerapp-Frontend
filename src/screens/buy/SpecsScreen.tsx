import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from '../../components/Icon';
import { Grid } from '../../components/Layout';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { SPECS } from '../../config/catalog';
import type { ScreenProps } from '../../navigation/types';
import { palette, tw } from '../../theme';

/** B-05 Specifications & amenities: catalogue tiles lit for the amenities the listing has. */
export function SpecsScreen({ params }: ScreenProps<'specs'>) {
  const p = params.property;
  const amenities = p.amenities.map(a => a.toLowerCase());
  const has = (label: string) =>
    amenities.some(a => a.includes(label.toLowerCase().split(' ')[0]));
  const extra = p.amenities.filter(
    a =>
      !SPECS.some(s =>
        a.toLowerCase().includes(s.label.toLowerCase().split(' ')[0]),
      ),
  );
  const highlights = [...p.highlights, ...extra];
  return (
    <Screen topBar={{ title: 'Specifications & Amenities', back: true }}>
      <View style={styles.body}>
        <T style={styles.lead}>
          Everything {p.title} offers across {SPECS.length} categories.
        </T>
        <Grid cols={4} gap={8}>
          {SPECS.map(s => {
            const on = has(s.label);
            return (
              <View
                key={s.label}
                style={[styles.tile, on ? styles.on : styles.off]}
              >
                <Icon
                  name={s.icon}
                  size={20}
                  color={on ? '#1A6FFF' : '#94A3B8'}
                />
                <T style={styles.tileText}>{s.label}</T>
              </View>
            );
          })}
        </Grid>
        <View style={styles.highlights}>
          <T style={styles.h3}>Property highlights</T>
          {highlights.length === 0 ? (
            <T style={styles.none}>
              No highlights listed for this property yet.
            </T>
          ) : (
            highlights.map(h => (
              <View key={h} style={styles.hRow}>
                <Icon name="check-circle-2" size={14} color="#10B981" />
                <T style={styles.hText}>{h}</T>
              </View>
            ))
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: tw('px-4'),
  lead: tw('text-[12px] text-ink-500 mb-3'),
  tile: tw(
    'aspect-square rounded-card border p-2 items-center justify-center gap-1.5',
  ),
  on: tw('border-brand-200 bg-brand-50'),
  off: { borderColor: palette.ink[200], opacity: 0.4 },
  tileText: { ...tw('text-[9.5px] font-medium text-center leading-tight') },
  highlights: { ...tw('mt-6'), gap: 8 },
  h3: tw('text-[14px] font-semibold'),
  none: tw('text-[13px] text-ink-400'),
  hRow: tw('flex items-center gap-2'),
  hText: tw('flex-1 text-[13px] text-ink-700'),
});
