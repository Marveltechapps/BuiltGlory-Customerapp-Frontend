import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PROPERTY_TYPES, type PropertyTypeOption } from '../config/catalog';
import { tw } from '../theme';
import { Icon } from './Icon';
import { Grid } from './Layout';
import { Press } from './Press';
import { T } from './T';

function TypeTile({
  t,
  onSelect,
  accent,
  width,
}: {
  t: PropertyTypeOption;
  onSelect: (t: PropertyTypeOption) => void;
  accent: string;
  width?: number;
}) {
  return (
    <Press
      onPress={() => onSelect(t)}
      style={[styles.tile, width ? { width } : null]}
      accessibilityLabel={`${t.label} ${t.sub}`.trim()}
    >
      <View style={styles.iconTile}>
        <Icon name={t.icon} size={20} color={accent} />
      </View>
      <T style={styles.label}>{t.label}</T>
      {t.sub ? <T style={styles.sub}>{t.sub}</T> : null}
    </Press>
  );
}

/** 13 property types in a 3-column grid with Interior centred below (B-01 / SL-01). */
export function PropertyTypeGrid({
  onSelect,
  accentColor = '#1A6FFF',
}: {
  onSelect: (t: PropertyTypeOption) => void;
  accentColor?: string;
}) {
  return (
    <View style={styles.wrap}>
      <Grid cols={3} gap={10}>
        {PROPERTY_TYPES.slice(0, 12).map(t => (
          <TypeTile key={t.id} t={t} onSelect={onSelect} accent={accentColor} />
        ))}
      </Grid>
      <View style={styles.last}>
        {PROPERTY_TYPES.slice(12).map(t => (
          <TypeTile
            key={t.id}
            t={t}
            onSelect={onSelect}
            accent={accentColor}
            width={105}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: tw('px-4'),
  tile: {
    ...tw(
      'rounded-card border border-ink-200 p-2 items-center justify-center gap-1',
    ),
    height: 100,
  },
  iconTile: tw('w-11 h-11 rounded-xl bg-brand-50 items-center justify-center'),
  label: tw('text-[10.5px] font-semibold text-center leading-tight'),
  sub: tw('text-[9px] text-ink-500 leading-none text-center'),
  last: tw('flex justify-center mt-2.5'),
});
