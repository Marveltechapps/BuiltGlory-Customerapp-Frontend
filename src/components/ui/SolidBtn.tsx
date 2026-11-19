import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../../theme';
import { Spin } from './Float';
import { T } from './T';

/**
 * The flat brand button used by the onboarding and system screens
 * (h-12, rounded-xl, bg-brand-600, semibold 15; ink-100 / ink-400 when disabled).
 */
export function SolidBtn({ children, onPress, disabled, style, left, height = 48, radius = 12, size = 15 }: {
  children?: React.ReactNode; onPress?: () => void; disabled?: boolean; style?: StyleProp<ViewStyle>; left?: React.ReactNode; height?: number; radius?: number; size?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [styles.btn, { height, borderRadius: radius }, disabled ? styles.off : pressed ? styles.pressed : styles.on, style]}>
      {left}
      <T s={size} w={600} c={disabled ? colors.ink400 : colors.white}>{children}</T>
    </Pressable>
  );
}

/** Two-tone circular spinner (track at 30% + quarter arc). */
export function RingSpinner({ size = 16, color = colors.white }: { size?: number; color?: string }) {
  return (
    <Spin>
      <View style={{ width: size, height: size }}>
        <Svg viewBox="0 0 24 24" width={size} height={size} fill="none">
          <Circle cx={12} cy={12} r={10} stroke={color} strokeOpacity={0.3} strokeWidth={3} />
          <Path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth={3} strokeLinecap="round" />
        </Svg>
      </View>
    </Spin>
  );
}

const styles = StyleSheet.create({
  btn: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  on: { backgroundColor: colors.brand600 },
  pressed: { backgroundColor: colors.brand700 },
  off: { backgroundColor: colors.ink100 },
});
