import React, { useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { colors, gradients } from '../../theme';

const THUMB = 22;

/**
 * Two-thumb range slider (the design's DualRange: two stacked range inputs with
 * 22px white thumbs and a 3px brand border).
 */
export function DualRange({ min, max, step, value, onChange }: { min: number; max: number; step: number; value: [number, number]; onChange: (v: [number, number]) => void }) {
  const [w, setW] = useState(0);
  const [a, b] = value;
  const pct = (v: number) => (v - min) / (max - min);
  const state = useRef({ value, w, onChange, start: 0 });
  state.current.value = value;
  state.current.w = w;
  state.current.onChange = onChange;

  const toValue = (x: number) => {
    const travel = Math.max(1, state.current.w - THUMB);
    const raw = min + ((x - THUMB / 2) / travel) * (max - min);
    return Math.min(max, Math.max(min, Math.round(raw / step) * step));
  };

  const make = (which: 0 | 1) => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => {
      const v = state.current.value[which];
      state.current.start = THUMB / 2 + pct(v) * (state.current.w - THUMB);
    },
    onPanResponderMove: (_, g) => {
      const [ca, cb] = state.current.value;
      const v = toValue(state.current.start + g.dx);
      if (which === 0) state.current.onChange([Math.min(v, cb - step), cb]);
      else state.current.onChange([ca, Math.max(v, ca + step)]);
    },
  });
  const panA = useRef(make(0)).current;
  const panB = useRef(make(1)).current;

  const thumbLeft = (v: number) => pct(v) * (w - THUMB);
  return (
    <View style={styles.wrap} onLayout={e => setW(e.nativeEvent.layout.width)}>
      <View style={styles.track} />
      {w > 0 && (
        <>
          <View style={[styles.fill, { left: pct(a) * w, right: (1 - pct(b)) * w }]} />
          <View {...panA.panHandlers} hitSlop={10} style={[styles.thumb, { left: thumbLeft(a) }]} accessibilityLabel="Minimum" accessibilityRole="adjustable" />
          <View {...panB.panHandlers} hitSlop={10} style={[styles.thumb, { left: thumbLeft(b) }]} accessibilityLabel="Maximum" accessibilityRole="adjustable" />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 28, justifyContent: 'center' },
  track: { position: 'absolute', left: 0, right: 0, height: 8, borderRadius: 9999, backgroundColor: colors.ink100 },
  fill: { position: 'absolute', height: 8, borderRadius: 9999, experimental_backgroundImage: gradients.brandBar },
  thumb: { position: 'absolute', top: 3, width: THUMB, height: THUMB, borderRadius: 9999, backgroundColor: colors.white, borderWidth: 3, borderColor: colors.brand600, boxShadow: '0 2px 6px rgba(15,23,42,0.25)' },
});
