import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme';
import { T } from './T';

/** Section heading (17px display title, optional sub and action). */
export function SectionTitle({ children, action, sub }: { children?: React.ReactNode; action?: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        <View style={styles.titleRow}>
          <View style={styles.rule} />
          <T display s={17} w={800} ls={-0.022} truncate style={styles.title}>{children}</T>
        </View>
        {sub ? <T s={11.5} c={colors.ink500} style={styles.sub}>{sub}</T> : null}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  left: { flexShrink: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  // The design's accent class (bg-[linear-gradient(to bottom,…)]) contains a space, so Tailwind
  // never generates it: the rule renders as an empty 4px spacer. Kept invisible to match.
  rule: { width: 4, height: 16 },
  title: { flexShrink: 1 },
  sub: { marginTop: 2, marginLeft: 12 },
});
