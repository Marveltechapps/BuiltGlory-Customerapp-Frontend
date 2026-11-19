import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { colors, ease, elev, gradients } from '../../theme';

/** On/off switch (46×26, thumb slides 3 → 23 with the spring curve). */
export function Toggle({ on, onChange, accessibilityLabel }: { on: boolean; onChange: (v: boolean) => void; accessibilityLabel?: string }) {
  const x = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(x, { toValue: on ? 1 : 0, duration: 380, easing: ease.spring, useNativeDriver: true }).start();
  }, [on, x]);
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={accessibilityLabel}
      onPress={() => onChange(!on)}
      style={[styles.track, on ? styles.on : styles.off]}>
      <Animated.View style={[styles.thumb, { transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) }] }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: 46, height: 26, borderRadius: 9999 },
  on: { experimental_backgroundImage: gradients.primarySoft, boxShadow: '0 2px 8px -1px rgba(26,111,255,0.55)' },
  off: { backgroundColor: colors.ink200 },
  thumb: { position: 'absolute', top: 3, left: 3, width: 20, height: 20, borderRadius: 9999, backgroundColor: colors.white, boxShadow: elev.md },
});
