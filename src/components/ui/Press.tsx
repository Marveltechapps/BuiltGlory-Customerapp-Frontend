import React, { useRef } from 'react';
import { Animated, Platform, Pressable, Vibration, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { ease } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressProps extends Omit<PressableProps, 'style' | 'children'> {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  /** Scale while pressed (.press → 0.97). Set 1 to disable. */
  scaleTo?: number;
  /** Short tap haptic, the design's buzz(). */
  haptic?: boolean;
}

/** Tappable surface with the design's .press feedback (scale .97, 160ms ease-out). */
export function Press({ style, children, scaleTo = 0.97, haptic = false, onPressIn, onPressOut, onPress, disabled, ...rest }: PressProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number) => Animated.timing(scale, { toValue: v, duration: 160, easing: ease.out, useNativeDriver: true }).start();
  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      accessibilityRole={rest.accessibilityRole ?? 'button'}
      onPressIn={e => { if (scaleTo !== 1) to(scaleTo); onPressIn?.(e); }}
      onPressOut={e => { if (scaleTo !== 1) to(1); onPressOut?.(e); }}
      onPress={e => { if (haptic) buzz(); onPress?.(e); }}
      style={[style, { transform: [{ scale }] }]}>
      {children}
    </AnimatedPressable>
  );
}

/**
 * Light tap vibration, the design's buzz(ms). The design uses navigator.vibrate,
 * which only fires on Android; iOS cannot do short pulses through Vibration, so it stays silent there too.
 */
export function buzz(ms = 8) {
  if (Platform.OS !== 'android') return;
  try { Vibration.vibrate(ms); } catch { /* not available */ }
}
