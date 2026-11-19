import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNav } from '../navigation/NavContext';
import { tw } from '../theme';
import { Icon, type IconName } from './Icon';
import { Press } from './Press';
import { T } from './T';

export type NavTab = 'home' | 'buy' | 'sell' | 'profile';

const ITEMS: Array<{ id: NavTab; label: string; icon: IconName }> = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'buy', label: 'Buy', icon: 'search' },
  { id: 'sell', label: 'Sell', icon: 'tag' },
  { id: 'profile', label: 'Profile', icon: 'user' },
];

function NavIcon({ icon, on }: { icon: IconName; on: boolean }) {
  const v = useRef(new Animated.Value(on ? 0 : 1)).current;
  useEffect(() => {
    if (!on) return;
    v.setValue(0);
    Animated.timing(v, {
      toValue: 1,
      duration: 600,
      easing: Easing.bezier(0.34, 1.56, 0.44, 1),
      useNativeDriver: true,
    }).start();
  }, [on, v]);
  const style = on
    ? {
        transform: [
          {
            translateY: v.interpolate({
              inputRange: [0, 0.55, 1],
              outputRange: [4, -3, -1],
            }),
          },
          {
            scale: v.interpolate({
              inputRange: [0, 0.55, 1],
              outputRange: [0.7, 1.22, 1.1],
            }),
          },
        ],
      }
    : null;
  return (
    <View style={styles.iconWrap}>
      <Animated.View style={style}>
        <Icon
          name={icon}
          size={23}
          color={on ? '#1259D4' : '#64748B'}
          strokeWidth={on ? 2.4 : 1.8}
          fill={on ? 'rgba(18,89,212,0.16)' : 'none'}
        />
      </Animated.View>
      {on && <View style={styles.dot} />}
    </View>
  );
}

/**
 * Bottom tab bar. `rounded` reproduces the reference rule that rounds the top corners of
 * bottom-docked bars inside legacy screens (`.legacy-screen > .absolute.bottom-0`).
 */
export function BottomNav({
  active,
  rounded = true,
}: {
  active: NavTab | null;
  rounded?: boolean;
}) {
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const idx = ITEMS.findIndex(i => i.id === active);
  const left = useRef(new Animated.Value(idx < 0 ? 0 : idx)).current;
  useEffect(() => {
    if (idx < 0) return;
    Animated.spring(left, {
      toValue: idx,
      useNativeDriver: true,
      speed: 14,
      bounciness: 9,
    }).start();
  }, [idx, left]);
  const inner = width - 24; // px-3
  const slot = inner / 4;
  return (
    <View
      style={[
        styles.bar,
        rounded && styles.rounded,
        { height: 64 + insets.bottom, paddingBottom: insets.bottom },
      ]}
    >
      <View
        style={styles.inner}
        onLayout={e => setWidth(e.nativeEvent.layout.width)}
      >
        {width > 0 && idx >= 0 && (
          <Animated.View
            style={[
              styles.pill,
              {
                width: width * 0.25 - 12,
                transform: [
                  {
                    translateX: left.interpolate({
                      inputRange: [0, 3],
                      outputRange: [6, width * 0.75 + 6],
                    }),
                  },
                ],
              },
            ]}
          />
        )}
        {ITEMS.map(it => {
          const on = it.id === active;
          return (
            <Press
              key={it.id}
              onPress={() => nav.onNav(it.id)}
              pressScale={1}
              haptic
              style={[styles.item, { width: slot || undefined }]}
              accessibilityLabel={it.label}
              accessibilityState={{ selected: on }}
            >
              <NavIcon icon={it.icon} on={on} />
              <T style={[styles.label, on ? styles.labelOn : styles.labelOff]}>
                {it.label}
              </T>
            </Press>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.6)',
    boxShadow: '0 -6px 24px -10px rgba(15,23,42,.18)',
  },
  rounded: { borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  inner: {
    ...tw('relative px-3 py-2 flex justify-between items-center'),
    height: 64,
  },
  pill: {
    ...tw('absolute top-1 h-[52px] rounded-2xl bg-brand-50'),
    left: 0,
    borderWidth: 1,
    borderColor: '#D1E3FF',
  },
  item: tw('flex-1 items-center gap-1 py-1'),
  iconWrap: tw('items-center'),
  dot: {
    position: 'absolute',
    bottom: -5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1259D4',
  },
  label: { fontSize: 10.5, lineHeight: 10.5 },
  labelOn: tw('text-brand-700 font-bold'),
  labelOff: tw('text-ink-500 font-medium'),
});
