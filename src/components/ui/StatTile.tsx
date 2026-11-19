import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, ring } from '../../theme';
import { Icon } from '../icons/Icon';
import { T } from './T';

type Tone = 'brand' | 'green' | 'amber' | 'ink';
const tones: Record<Tone, { from: string; ring: string; fg: string }> = {
  brand: { from: colors.brand50, ring: colors.brand100, fg: colors.brand700 },
  green: { from: colors.emerald50, ring: colors.emerald100, fg: colors.emerald700 },
  amber: { from: colors.amber50, ring: colors.amber100, fg: colors.amber700 },
  ink: { from: colors.ink50, ring: colors.ink200, fg: colors.ink700 },
};

/** Metric tile with a soft vertical gradient. */
export function StatTile({ label, value, icon, tone = 'brand', style }: { label: React.ReactNode; value: React.ReactNode; icon?: string; tone?: Tone; style?: StyleProp<ViewStyle> }) {
  const t = tones[tone];
  return (
    <View style={[styles.tile, { experimental_backgroundImage: `linear-gradient(180deg, ${t.from}, #FFFFFF)`, boxShadow: ring(t.ring) }, style]}>
      {icon ? <Icon name={icon} size={16} color={t.fg} /> : null}
      <T display num s={20} w={800} ls={-0.03} style={styles.value}>{value}</T>
      <T s={11} w={500} c={colors.ink500} style={styles.label}>{label}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { borderRadius: 14, padding: 12 },
  value: { marginTop: 4 },
  label: { marginTop: 2 },
});
