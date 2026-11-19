import React, { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, ease, elev } from '../../theme';
import { Icon } from '../icons/Icon';
import { buzz } from './Press';
import { T } from './T';

// ─── SwipeGallery: drag through images with rubber-band + fling ───
export function SwipeGallery({ count, index, onIndex, children, style, height }: { count: number; index: number; onIndex: (i: number) => void; children?: React.ReactNode; style?: StyleProp<ViewStyle>; height?: number }) {
  const [w, setW] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const state = useRef({ index, count, w });
  state.current = { index, count, w };
  useEffect(() => {
    Animated.timing(x, { toValue: -index * w, duration: 420, easing: ease.spring, useNativeDriver: true }).start();
  }, [index, w, x]);
  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderMove: (_, g) => {
      const s = state.current;
      const edge = (s.index === 0 && g.dx > 0) || (s.index === s.count - 1 && g.dx < 0);
      x.setValue(-s.index * s.w + (edge ? g.dx * 0.32 : g.dx));
    },
    onPanResponderRelease: (_, g) => {
      const s = state.current;
      const far = Math.abs(g.dx) > s.w * 0.22, fast = Math.abs(g.vx) > 0.45;
      let next = s.index;
      if ((far || fast) && g.dx < 0 && s.index < s.count - 1) next = s.index + 1;
      else if ((far || fast) && g.dx > 0 && s.index > 0) next = s.index - 1;
      if (next !== s.index) { buzz(); onIndexRef.current(next); }
      else Animated.timing(x, { toValue: -s.index * s.w, duration: 420, easing: ease.spring, useNativeDriver: true }).start();
    },
    onPanResponderTerminationRequest: () => false,
  })).current;
  const onIndexRef = useRef(onIndex);
  onIndexRef.current = onIndex;
  return (
    <View style={[styles.gallery, { height }, style]} onLayout={e => setW(e.nativeEvent.layout.width)} {...pan.panHandlers}>
      <Animated.View style={[styles.track, { width: w * count, transform: [{ translateX: x }] }]}>
        {React.Children.map(children, c => <View style={{ width: w, height: '100%' }}>{c}</View>)}
      </Animated.View>
    </View>
  );
}

// ─── SwipeAction: swipe a row left to reveal an action ────────
export function SwipeAction({ children, action, label = 'Remove', icon = 'trash-2', tone = '#E11D48' }: { children?: React.ReactNode; action?: () => void; label?: string; icon?: string; tone?: string }) {
  const W = 84;
  const x = useRef(new Animated.Value(0)).current;
  const open = useRef(false);
  const settle = (to: number) => Animated.timing(x, { toValue: to, duration: 380, easing: ease.spring, useNativeDriver: true }).start();
  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderMove: (_, g) => {
      const d = g.dx + (open.current ? -W : 0);
      x.setValue(d < 0 ? Math.max(-W - 20, d) : d * 0.2);
    },
    onPanResponderRelease: (_, g) => {
      const d = g.dx + (open.current ? -W : 0);
      if (d < -W * 0.55 || g.vx < -0.5) { open.current = true; settle(-W); buzz(); } else { open.current = false; settle(0); }
    },
  })).current;
  return (
    <View style={styles.swipe}>
      <View style={[styles.swipeAction, { width: W, backgroundColor: tone }]}>
        <Pressable onPress={() => { action?.(); open.current = false; settle(0); }} style={styles.swipeBtn} accessibilityRole="button" accessibilityLabel={label}>
          <Icon name={icon} size={17} color="white" />
          <T s={10} w={700} c="#FFFFFF">{label}</T>
        </Pressable>
      </View>
      <Animated.View style={[styles.swipeFront, { transform: [{ translateX: x }] }]} {...pan.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

// ─── SegmentedSwipe: tabs with sliding pill ───────────────────
export interface SegTab { id: string; label: React.ReactNode }
export function SegmentedSwipe({ tabs, value, onChange }: { tabs: (SegTab | string)[]; value: string; onChange: (id: string) => void }) {
  const norm = tabs.map(t => (typeof t === 'string' ? { id: t, label: t } : t));
  const i = Math.max(0, norm.findIndex(t => t.id === value));
  const [w, setW] = useState(0);
  const pos = useRef(new Animated.Value(i)).current;
  useEffect(() => {
    Animated.timing(pos, { toValue: i, duration: 420, easing: ease.spring, useNativeDriver: true }).start();
  }, [i, pos]);
  const seg = w / norm.length;
  return (
    <View style={styles.seg} onLayout={e => setW(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <Animated.View style={[styles.segPill, { width: seg - 4, transform: [{ translateX: pos.interpolate({ inputRange: [0, Math.max(1, norm.length - 1)], outputRange: [2, (Math.max(1, norm.length - 1)) * seg + 2] }) }] }]} />
      )}
      {norm.map(t => {
        const on = t.id === value;
        return (
          <Pressable key={t.id} onPress={() => { onChange(t.id); buzz(); }} style={styles.segBtn} accessibilityRole="tab" accessibilityState={{ selected: on }}>
            <T s={12} w={700} c={on ? colors.brand700 : colors.ink500} align="center">{t.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  gallery: { overflow: 'hidden' },
  track: { flexDirection: 'row', height: '100%' },
  swipe: { overflow: 'hidden', borderRadius: 14 },
  swipeAction: { position: 'absolute', top: 0, bottom: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
  swipeBtn: { alignItems: 'center', gap: 4 },
  swipeFront: { backgroundColor: colors.white },
  seg: { flexDirection: 'row', backgroundColor: colors.ink100, borderRadius: 9999, padding: 4 },
  segPill: { position: 'absolute', top: 4, bottom: 4, left: 0, borderRadius: 9999, backgroundColor: colors.white, boxShadow: elev.e1 },
  segBtn: { flex: 1, paddingVertical: 8 },
});
