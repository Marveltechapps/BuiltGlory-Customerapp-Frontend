import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { tw } from '../theme';
import { Icon, type IconName } from './Icon';
import { Press } from './Press';
import { Spin } from './Motion';
import { T } from './T';

export type BtnVariant =
  | 'primary'
  | 'outline'
  | 'ghost'
  | 'dark'
  | 'danger'
  | 'soft';
export type BtnSize = 'sm' | 'md' | 'lg';

interface BtnProps {
  children?: React.ReactNode;
  variant?: BtnVariant;
  size?: BtnSize;
  icon?: IconName;
  iconRight?: IconName;
  onPress?: () => void;
  disabled?: boolean;
  /** Shows a spinner and blocks presses while an API call runs. */
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  /** Let a long label wrap onto more lines (the reference's inline buttons wrap inside narrow grids). */
  wrap?: boolean;
}

const TEXT_COLOR: Record<BtnVariant, string> = {
  primary: '#FFFFFF',
  outline: '#0F172A',
  ghost: '#1A6FFF',
  dark: '#FFFFFF',
  danger: '#FFFFFF',
  soft: '#1259D4',
};

/** Diagonal highlight sweeping across primary buttons every 4.6s (`.sheen`). */
export function Sheen() {
  const [width, setWidth] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!width) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(3312),
        Animated.timing(x, {
          toValue: 1,
          duration: 920,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(368),
        Animated.timing(x, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [width, x]);
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={e => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 && (
        <Animated.View
          style={[
            styles.sheen,
            {
              width: width * 0.38,
              transform: [
                {
                  translateX: x.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-width * 0.5, width * 1.25],
                  }),
                },
                { skewX: '-18deg' },
              ],
            },
          ]}
        />
      )}
    </View>
  );
}

export function Btn({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  onPress,
  disabled,
  loading,
  style,
  accessibilityLabel,
  wrap,
}: BtnProps) {
  const color = TEXT_COLOR[variant];
  const inactive = disabled || loading;
  return (
    <Press
      onPress={onPress}
      disabled={inactive}
      haptic
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        disabled && styles.disabled,
        wrap && styles.wrap,
        style,
      ]}
    >
      {variant === 'primary' && !inactive && <Sheen />}
      {loading ? (
        <Spin duration={800}>
          <Icon name="loader-2" size={18} color={color} />
        </Spin>
      ) : (
        icon && <Icon name={icon} size={18} color={color} />
      )}
      {typeof children === 'string' || typeof children === 'number' ? (
        <T
          style={[textStyles[size], { color }, wrap && styles.wrapText]}
          numberOfLines={wrap ? undefined : 1}
        >
          {children}
        </T>
      ) : (
        children
      )}
      {iconRight && !loading && (
        <Icon name={iconRight} size={18} color={color} />
      )}
    </Press>
  );
}

const styles = StyleSheet.create({
  base: {
    ...tw(
      'relative flex items-center justify-center gap-2 rounded-full overflow-hidden',
    ),
    alignSelf: 'flex-start',
  },
  disabled: { opacity: 0.45 },
  // Grows with the label instead of clipping it.
  wrap: { height: undefined, minHeight: 36, paddingVertical: 4 },
  wrapText: { textAlign: 'center', flexShrink: 1 },
  sheen: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    experimental_backgroundImage:
      'linear-gradient(100deg, transparent, rgba(255,255,255,0.42), transparent)',
  },
});

const sizeStyles = StyleSheet.create({
  sm: tw('px-3.5 h-9'),
  md: tw('px-4 h-[52px]'),
  lg: tw('px-5 h-[56px]'),
});

const textStyles = StyleSheet.create({
  sm: tw('text-sm font-bold'),
  md: tw('text-[15px] font-bold'),
  lg: tw('text-base font-bold'),
});

const variantStyles = StyleSheet.create({
  primary: tw(
    'elev-brand bg-[linear-gradient(135deg,#3B86FF,#1A6FFF_55%,#1259D4)]',
  ),
  outline: tw('border border-ink-200 bg-white elev-1'),
  ghost: {},
  dark: tw('elev-2 bg-[linear-gradient(135deg,#243247,#0F172A)]'),
  danger: tw(
    'bg-[linear-gradient(135deg,#F2536B,#E11D48)] shadow-[0_6px_18px_-4px_rgba(225,29,72,.45)]',
  ),
  soft: tw('bg-brand-50 ring-1 ring-brand-100'),
});
