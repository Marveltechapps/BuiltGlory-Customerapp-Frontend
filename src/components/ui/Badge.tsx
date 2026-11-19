import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, ring } from '../../theme';
import { Icon } from '../icons/Icon';
import { T } from './T';

export type BadgeColor = 'brand' | 'green' | 'amber' | 'rose' | 'ink';

const map: Record<BadgeColor, { bg: string; fg: string; ring: string }> = {
  brand: { bg: colors.brand50, fg: colors.brand700, ring: colors.brand100 },
  green: { bg: colors.emerald50, fg: colors.emerald700, ring: colors.emerald100 },
  amber: { bg: colors.amber50, fg: colors.amber700, ring: colors.amber100 },
  rose: { bg: colors.rose50, fg: colors.rose700, ring: colors.rose100 },
  ink: { bg: colors.ink100, fg: colors.ink700, ring: colors.ink200 },
};

/** Small pill label, e.g. "apartment", "Verified". */
export function Badge({ color = 'brand', children, icon }: { color?: BadgeColor; children?: React.ReactNode; icon?: string }) {
  const m = map[color];
  return (
    <View style={[styles.badge, { backgroundColor: m.bg, boxShadow: ring(m.ring) }]}>
      {icon ? <Icon name={icon} size={10} color={m.fg} /> : null}
      <T s={10.5} w={700} c={m.fg} ls={0.01} numberOfLines={1}>{children}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
});
