import React, { Children } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

/**
 * CSS grid-cols-N equivalent: equal-width columns, rows of `cols` items,
 * incomplete last rows keep their cell widths.
 */
export function Grid({ cols, gap = 0, rowGap, children, style, cellStyle }: { cols: number; gap?: number; rowGap?: number; children?: React.ReactNode; style?: StyleProp<ViewStyle>; cellStyle?: StyleProp<ViewStyle> }) {
  const items = Children.toArray(children).filter(Boolean);
  const rows: React.ReactNode[][] = [];
  for (let i = 0; i < items.length; i += cols) rows.push(items.slice(i, i + cols));
  return (
    <View style={[{ gap: rowGap ?? gap }, style]}>
      {rows.map((r, ri) => (
        <View key={ri} style={[styles.row, { gap }]}>
          {Array.from({ length: cols }).map((_, ci) => (
            <View key={ci} style={[styles.cell, cellStyle]}>{r[ci] ?? null}</View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch' },
  cell: { flex: 1, minWidth: 0 },
});
