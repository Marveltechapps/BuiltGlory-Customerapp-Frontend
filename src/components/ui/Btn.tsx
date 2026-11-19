import React, { useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View, type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';
import { colors, ease, elev, gradients, ring, shadows } from '../../theme';
import { Icon } from '../icons/Icon';
import { buzz } from './Press';
import { Sheen } from './Sheen';
import { T } from './T';

export type BtnVariant = 'primary' | 'outline' | 'ghost' | 'dark' | 'danger' | 'soft';
export type BtnSize = 'sm' | 'md' | 'lg';

export interface BtnProps {
  children?: React.ReactNode;
  variant?: BtnVariant;
  size?: BtnSize;
  icon?: string;
  iconRight?: string;
  onPress?: () => void;
  disabled?: boolean;
  /** Stretch to the container width (w-full). */
  full?: boolean;
  /** flex: 1 inside a row (dock bars). */
  flex?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Override the label/icon colour. */
  color?: string;
  accessibilityLabel?: string;
}

const fg: Record<BtnVariant, string> = {
  primary: colors.white,
  outline: colors.ink900,
  ghost: colors.brand600,
  dark: colors.white,
  danger: colors.white,
  soft: colors.brand700,
};

interface Ripple { id: number; x: number; y: number; d: number; v: Animated.Value }

/** The design's Btn: pill button with gradient variants, sheen, ripple and press scale. */
export function Btn({ children, variant = 'primary', size = 'md', icon, iconRight, onPress, disabled, full, flex, style, color, accessibilityLabel }: BtnProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const box = useRef({ w: 0, h: 0 });
  const tint = color ?? fg[variant];
  const iconSize = size === 'sm' ? 15 : 18;

  const pressTo = (v: number) => Animated.timing(scale, { toValue: v, duration: 160, easing: ease.out, useNativeDriver: true }).start();
  const fire = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    const d = Math.max(box.current.w, box.current.h) * 2;
    const r: Ripple = { id: Date.now() + Math.random(), x: locationX, y: locationY, d, v: new Animated.Value(0) };
    setRipples(list => [...list, r]);
    Animated.timing(r.v, { toValue: 1, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }).start(() =>
      setRipples(list => list.filter(k => k.id !== r.id)));
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPressIn={e => { pressTo(0.97); fire(e); }}
      onPressOut={() => pressTo(1)}
      onPress={() => { buzz(); onPress?.(); }}
      style={[full ? styles.full : flex ? styles.flex : styles.inline, style]}>
      <Animated.View
        onLayout={e => { box.current = { w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height }; }}
        style={[styles.base, sizes[size], variants[variant], disabled && styles.disabled, { transform: [{ scale }] }]}>
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.clip]}>
          {variant === 'primary' && <Sheen />}
          {ripples.map(r => (
            <Animated.View
              key={r.id}
              style={[styles.ripple, {
                left: r.x - r.d / 2, top: r.y - r.d / 2, width: r.d, height: r.d,
                opacity: r.v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 0] }),
                transform: [{ scale: r.v }],
              }]} />
          ))}
        </View>
        {icon ? <Icon name={icon} size={iconSize} color={tint} /> : null}
        {children != null && (
          <T s={textSize[size]} w={700} c={tint} numberOfLines={1} lh={textLh[size]} style={styles.label}>
            {children}
          </T>
        )}
        {iconRight ? <Icon name={iconRight} size={iconSize} color={tint} /> : null}
      </Animated.View>
    </Pressable>
  );
}

const textSize: Record<BtnSize, number> = { sm: 13, md: 15, lg: 16 };
const textLh: Record<BtnSize, number> = { sm: 1.5, md: 1.5, lg: 1.5 };

const styles = StyleSheet.create({
  inline: { alignSelf: 'flex-start' },
  full: { alignSelf: 'stretch' },
  flex: { flex: 1 },
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 9999,
  },
  clip: { borderRadius: 9999, overflow: 'hidden' },
  label: { flexShrink: 1 },
  disabled: { opacity: 0.45 },
  ripple: {
    position: 'absolute',
    borderRadius: 9999,
    experimental_backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.55), rgba(255,255,255,0) 62%)',
  },
});

const sizes = StyleSheet.create({
  sm: { paddingHorizontal: 12, height: 36, gap: 6 },
  md: { paddingHorizontal: 16, height: 52 },
  lg: { paddingHorizontal: 20, height: 56 },
});

const variants = StyleSheet.create({
  primary: { experimental_backgroundImage: gradients.primary, boxShadow: elev.brand },
  outline: { borderWidth: 1, borderColor: colors.ink200, backgroundColor: colors.white, boxShadow: elev.e1 },
  ghost: {},
  dark: { experimental_backgroundImage: gradients.dark, boxShadow: elev.e2 },
  danger: { experimental_backgroundImage: gradients.danger, boxShadow: '0 6px 18px -4px rgba(225,29,72,0.45)' },
  soft: { backgroundColor: colors.brand50, boxShadow: shadows(ring(colors.brand100)) },
});
