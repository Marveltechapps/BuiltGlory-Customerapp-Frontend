import React, { Children, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, elev, ring } from '../../theme';
import { Icon } from '../icons/Icon';
import { T } from '../ui/T';

/** White card holding grouped content (rounded-2xl, ring, elev-1, p-4). */
export function Card({ children, style, pad = 16 }: { children?: React.ReactNode; style?: StyleProp<ViewStyle>; pad?: number }) {
  return <View style={[styles.card, { padding: pad }, style]}>{children}</View>;
}

/** Settings-style inset group with an optional label and footer. */
export function InsetGroup({ label, children, footer, style }: { label?: React.ReactNode; children?: React.ReactNode; footer?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const items = Children.toArray(children).filter(Boolean);
  return (
    <View style={style}>
      {label ? <T s={11} w={700} upper ls={0.07} c={colors.ink400} style={styles.groupLabel}>{label}</T> : null}
      <View style={styles.group}>
        {items.map((c, i) => (
          <View key={i} style={i > 0 ? styles.divider : null}>{c}</View>
        ))}
      </View>
      {footer ? <T s={11} c={colors.ink400} lh={1.625} style={styles.groupFooter}>{footer}</T> : null}
    </View>
  );
}

export type RowTone = 'brand' | 'green' | 'amber' | 'rose' | 'ink';
const tones: Record<RowTone, { bg: string; fg: string }> = {
  brand: { bg: colors.brand50, fg: colors.brand600 },
  green: { bg: colors.emerald50, fg: colors.emerald600 },
  amber: { bg: colors.amber50, fg: colors.amber600 },
  rose: { bg: colors.rose50, fg: colors.rose600 },
  ink: { bg: colors.ink100, fg: colors.ink600 },
};

export interface RowProps {
  icon?: string;
  iconTone?: RowTone;
  label: React.ReactNode;
  sub?: React.ReactNode;
  value?: React.ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  danger?: boolean;
  trailing?: React.ReactNode;
}

/** Menu row: tinted icon tile, label + sub, value, trailing element or chevron. */
export function Row({ icon, iconTone = 'brand', label, sub, value, onPress, chevron = true, danger, trailing }: RowProps) {
  const tone = danger ? tones.rose : tones[iconTone];
  const body = (
    <>
      {icon ? (
        <View style={[styles.rowIcon, { backgroundColor: tone.bg }]}>
          <Icon name={icon} size={17} color={danger ? '#E11D48' : tone.fg} />
        </View>
      ) : null}
      <View style={styles.rowText}>
        <T s={14} w={600} c={danger ? colors.rose600 : colors.ink900} truncate>{label}</T>
        {sub ? <T s={11.5} c={colors.ink500} truncate style={styles.mt2}>{sub}</T> : null}
      </View>
      {value ? <T s={12.5} c={colors.ink500}>{value}</T> : null}
      {trailing}
      {onPress && chevron && !trailing ? <Icon name="chevron-right" size={17} color="#CBD5E1" /> : null}
    </>
  );
  if (!onPress) return <View style={styles.row}>{body}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      {body}
    </Pressable>
  );
}

export interface SpecItem { icon?: string; value: React.ReactNode; label: React.ReactNode }

/** Key attributes grid with 1px dividers. */
export function SpecGrid({ items, cols = 4 }: { items: SpecItem[]; cols?: number }) {
  const rows: SpecItem[][] = [];
  for (let i = 0; i < items.length; i += cols) rows.push(items.slice(i, i + cols));
  return (
    <View style={styles.spec}>
      {rows.map((r, ri) => (
        <View key={ri} style={styles.specRow}>
          {Array.from({ length: cols }).map((_, ci) => {
            const it = r[ci];
            if (!it) return <View key={ci} style={styles.specEmpty} />;
            return (
              <View key={ci} style={styles.specCell}>
                {it.icon ? <Icon name={it.icon} size={15} color="#1A6FFF" /> : null}
                <T num s={14} w={800} ls={-0.02} truncate align="center" style={styles.mt4}>{it.value}</T>
                <T s={10} c={colors.ink500} truncate align="center" style={styles.mt2}>{it.label}</T>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/** Marketplace price hierarchy: big price, per-unit line, green note. */
export function PriceBlock({ price, per, note, align = 'left' }: { price: React.ReactNode; per?: React.ReactNode; note?: React.ReactNode; align?: 'left' | 'right' }) {
  const a = align === 'right' ? 'right' : 'left';
  return (
    <View>
      <T display num s={24} w={800} ls={-0.035} lh={1} align={a}>{price}</T>
      {per ? <T s={11} c={colors.ink500} align={a} style={styles.mt4}>{per}</T> : null}
      {note ? <T s={11} w={600} c={colors.emerald600} align={a} style={styles.mt4}>{note}</T> : null}
    </View>
  );
}

/** Horizontal rail that bleeds to the screen edges and snaps each item to the start. */
export function Rail({ children, style, gap = 12, contentStyle }: { children?: React.ReactNode; style?: StyleProp<ViewStyle>; gap?: number; contentStyle?: StyleProp<ViewStyle> }) {
  const xs = useRef<number[]>([]);
  const [offsets, setOffsets] = useState<number[]>([]);
  const items = Children.toArray(children).filter(Boolean);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.rail, style]}
      contentContainerStyle={[styles.railContent, { gap }, contentStyle]}
      snapToOffsets={offsets.length ? offsets : undefined}
      decelerationRate="fast">
      {items.map((c, i) => (
        <View
          key={i}
          onLayout={e => {
            xs.current[i] = e.nativeEvent.layout.x - 16;
            if (xs.current.filter(v => v != null).length === items.length) setOffsets([...xs.current]);
          }}>
          {c}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: 16, boxShadow: elev.e1 },
  groupLabel: { paddingHorizontal: 4, marginBottom: 8 },
  group: { backgroundColor: colors.white, borderRadius: 16, overflow: 'hidden', boxShadow: elev.e1 },
  divider: { borderTopWidth: 1, borderTopColor: colors.ink100 },
  groupFooter: { paddingHorizontal: 4, marginTop: 8 },
  row: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  rowPressed: { backgroundColor: colors.ink50 },
  rowIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, minWidth: 0 },
  mt2: { marginTop: 2 },
  mt4: { marginTop: 4 },
  spec: { gap: 1, backgroundColor: 'rgba(226,232,240,0.7)', borderRadius: 16, overflow: 'hidden', boxShadow: ring('rgba(226,232,240,0.7)') },
  specRow: { flexDirection: 'row', gap: 1 },
  specCell: { flex: 1, minWidth: 0, backgroundColor: colors.white, paddingHorizontal: 8, paddingVertical: 12, alignItems: 'center' },
  specEmpty: { flex: 1 },
  rail: { marginHorizontal: -16 },
  railContent: { paddingHorizontal: 16 },
});
