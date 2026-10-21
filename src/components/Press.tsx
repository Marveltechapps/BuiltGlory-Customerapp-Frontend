import React, { useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { buzz } from '../utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Extra style while pressed (row highlight, `active:bg-*`). */
  pressedStyle?: StyleProp<ViewStyle>;
  /** Scale on press (`.press:active { transform: scale(.97) }`). Set to 1 to disable. */
  pressScale?: number;
  /** Haptic tick on press, like the reference `buzz()`. */
  haptic?: boolean;
  children?: React.ReactNode;
}

/** Touchable surface with the reference's press feedback. */
export function Press({
  style,
  pressedStyle,
  pressScale = 0.97,
  haptic = false,
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  children,
  ...rest
}: PressProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);
  const to = (value: number) =>
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 40,
      bounciness: value === 1 ? 6 : 0,
    }).start();
  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      accessibilityRole={rest.accessibilityRole ?? 'button'}
      accessibilityState={{ disabled: !!disabled, ...rest.accessibilityState }}
      style={[
        style,
        pressed && pressedStyle,
        pressScale !== 1 && { transform: [{ scale }] },
      ]}
      onPressIn={e => {
        if (pressScale !== 1) to(pressScale);
        if (pressedStyle) setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={e => {
        if (pressScale !== 1) to(1);
        if (pressedStyle) setPressed(false);
        onPressOut?.(e);
      }}
      onPress={e => {
        if (haptic) buzz();
        onPress?.(e);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}
