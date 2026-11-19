import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useNav } from '../../context/NavigationContext';
import { flowTints } from '../../theme';

const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

// A 300px disc blurred by 56px, drawn as a soft radial fall-off (no runtime blur needed).
const blob = (hex: string) =>
  `radial-gradient(circle closest-side, ${rgba(hex, 1)} 0%, ${rgba(hex, 0.96)} 20%, ${rgba(hex, 0.5)} 55%, ${rgba(hex, 0.08)} 82%, ${rgba(hex, 0)} 100%)`;

function Blob({ color, size, style, period, delay = 0, reverse, opacity = 1 }: { color: string; size: number; style: object; period: number; delay?: number; reverse?: boolean; opacity?: number }) {
  const t = useRef(new Animated.Value(reverse ? 1 : 0)).current;
  useEffect(() => {
    const half = period / 2;
    const a = reverse ? 0 : 1, b = reverse ? 1 : 0;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(t, { toValue: a, duration: half, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(t, { toValue: b, duration: half, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    const timer = setTimeout(() => loop.start(), delay);
    return () => { clearTimeout(timer); loop.stop(); };
  }, [t, period, delay, reverse]);
  const pad = 123; // 2.2 × blur radius
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.blob, style, {
        width: size + pad * 2, height: size + pad * 2, opacity,
        experimental_backgroundImage: blob(color),
        transform: [
          { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) },
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, 24] }) },
          { scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) },
        ],
      }]} />
  );
}

/**
 * The design's per-flow ambient backdrop: tint fading to white by 460px with two
 * slowly drifting colour blobs. Sits behind every light screen.
 */
export function AmbientBackground() {
  const { flow } = useNav();
  const f = flowTints[flow] ?? flowTints.home;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.root, { experimental_backgroundImage: `linear-gradient(180deg, ${f.tint} 0px, ${f.tint} 120px, #FFFFFF 460px)` }]}>
      <Blob color={f.blobA} size={300} period={9000} style={{ top: -90 - 123, right: -100 - 123 }} />
      <Blob color={f.blobB} size={260} period={11000} delay={1500} reverse opacity={0.7} style={{ top: 210 - 123, left: -130 - 123 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden', backgroundColor: '#FFFFFF' },
  blob: { position: 'absolute', borderRadius: 9999 },
});
