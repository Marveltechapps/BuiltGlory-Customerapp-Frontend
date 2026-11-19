import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { PROPERTY_TYPES } from '../config/sampleData';
import type { PropertyType } from '../types/property';
import { colors } from '../theme';
import { Icon } from './icons/Icon';
import { Grid } from './layout/Grid';
import { T } from './ui/T';

function TypeTile({ t, onSelect, accent, hover, fixedWidth }: { t: PropertyType; onSelect: (id: string) => void; accent: string; hover: { border: string; bg: string }; fixedWidth?: boolean }) {
  return (
    <Pressable
      onPress={() => onSelect(t.id)}
      accessibilityRole="button"
      style={({ pressed }) => [styles.tile, fixedWidth && styles.fixed, pressed && { borderColor: hover.border, backgroundColor: hover.bg }]}>
      <View style={styles.icon}><Icon name={t.icon} size={20} color={accent} /></View>
      <T s={10.5} w={600} lh={1.25} align="center">{t.label}</T>
      {t.sub ? <T s={9} c={colors.ink500} lh={1} align="center">{t.sub}</T> : null}
    </Pressable>
  );
}

/** 13 property types: a 3-column grid of 12 and the last one centred below. */
export function PropertyTypeGrid({ onSelect, accentColor = '#1A6FFF', hover = { border: colors.brand300, bg: colors.brand50 } }: {
  onSelect: (id: string) => void; accentColor?: string; hover?: { border: string; bg: string };
}) {
  return (
    <View style={styles.wrap}>
      <Grid cols={3} gap={10}>
        {PROPERTY_TYPES.slice(0, 12).map(t => <TypeTile key={t.id} t={t} onSelect={onSelect} accent={accentColor} hover={hover} />)}
      </Grid>
      <View style={styles.last}>
        {PROPERTY_TYPES.slice(12).map(t => <TypeTile key={t.id} t={t} onSelect={onSelect} accent={accentColor} hover={hover} fixedWidth />)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16 },
  tile: { height: 100, borderRadius: 14, borderWidth: 1, borderColor: colors.ink200, padding: 8, alignItems: 'center', justifyContent: 'center', gap: 4 },
  fixed: { width: 105 },
  icon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.brand50, alignItems: 'center', justifyContent: 'center' },
  last: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
});
