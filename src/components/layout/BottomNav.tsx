import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, ease, ring } from '../../theme';
import type { TabId } from '../../navigation/types';
import { Icon } from '../icons/Icon';
import { T } from '../ui/T';

const ITEMS: { id: TabId; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'buy', label: 'Buy', icon: 'search' },
  { id: 'sell', label: 'Sell', icon: 'tag' },
  { id: 'profile', label: 'Profile', icon: 'user' },
];

export const NAV_HEIGHT = 64;

function NavIcon({ name, on }: { name: string; on: boolean }) {
  const t = useRef(new Animated.Value(on ? 0 : 1)).current;
  const dot = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!on) { t.setValue(1); dot.setValue(0); return; }
    t.setValue(0);
    Animated.timing(t, { toValue: 1, duration: 600, easing: ease.navPop, useNativeDriver: true }).start();
    Animated.timing(dot, { toValue: 1, duration: 400, delay: 150, easing: ease.spring, useNativeDriver: true }).start();
  }, [on, t, dot]);
  const scale = on ? t.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0.7, 1.22, 1.1] }) : 1;
  const ty = on ? t.interpolate({ inputRange: [0, 0.55, 1], outputRange: [4, -3, -1] }) : 0;
  return (
    <View style={styles.iconBox}>
      <Animated.View style={{ transform: [{ translateY: ty }, { scale }] }}>
        <Icon name={name} size={23} color={on ? colors.brand700 : colors.ink500} strokeWidth={on ? 2.4 : 1.8} fill={on ? 'rgba(18,89,212,0.16)' : 'none'} />
      </Animated.View>
      {on && <Animated.View style={[styles.dot, { opacity: dot, transform: [{ scale: dot.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) }] }]} />}
    </View>
  );
}

/** Four-tab bottom navigation with a sliding highlight pill. */
export function BottomNav({ active, onNav, legacy }: {
  active?: TabId; onNav: (tab: TabId) => void;
  /** Inside a <Screen>: the design rounds bottom bars there with 22px top corners. */
  legacy?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [w, setW] = useState(0);
  const idx = ITEMS.findIndex(i => i.id === active);
  const left = useRef(new Animated.Value(Math.max(0, idx))).current;
  useEffect(() => {
    if (idx < 0) return;
    Animated.timing(left, { toValue: idx, duration: 420, easing: ease.spring, useNativeDriver: true }).start();
  }, [idx, left]);
  return (
    <View style={[styles.bar, legacy && styles.legacy, { height: NAV_HEIGHT + insets.bottom, paddingBottom: insets.bottom }]} onLayout={e => setW(e.nativeEvent.layout.width)}>
      <View style={styles.inner}>
        {w > 0 && (
          <Animated.View
            style={[styles.pill, {
              width: w / 4 - 12,
              opacity: idx >= 0 ? 1 : 0,
              transform: [{ translateX: left.interpolate({ inputRange: [0, 3], outputRange: [6, (3 * w) / 4 + 6] }) }],
            }]} />
        )}
        {ITEMS.map(it => {
          const on = active === it.id;
          return (
            <Pressable key={it.id} onPress={() => onNav(it.id)} style={styles.item} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={it.label}>
              <NavIcon name={it.icon} on={on} />
              <T s={10.5} w={on ? 700 : 500} c={on ? colors.brand700 : colors.ink500} lh={1}>{it.label}</T>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.6)',
    boxShadow: '0 -6px 24px -10px rgba(15,23,42,0.18)',
  },
  legacy: { borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  inner: { height: NAV_HEIGHT, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pill: { position: 'absolute', top: 4, left: 0, height: 52, borderRadius: 16, backgroundColor: colors.brand50, boxShadow: ring(colors.brand100) },
  item: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 4 },
  iconBox: { width: 23, height: 23 },
  // .navic-on::after: 4px dot centred 5px below the icon
  dot: { position: 'absolute', left: 9.5, top: 24, width: 4, height: 4, borderRadius: 9999, backgroundColor: colors.brand700 },
});
