import React, { useEffect, useRef } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';

/** The design's .float: gentle 7px bob over 5.5s. */
export function Float({ style, children, distance = 7, period = 5500 }: { style?: StyleProp<ViewStyle>; children?: React.ReactNode; distance?: number; period?: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const half = period / 2;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(t, { toValue: 1, duration: half, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(t, { toValue: 0, duration: half, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [t, period]);
  return (
    <Animated.View style={[style, { transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -distance] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/** Continuous rotation (animate-spin / heroSpin). */
export function Spin({ style, children, period = 1000 }: { style?: StyleProp<ViewStyle>; children?: React.ReactNode; period?: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(t, { toValue: 1, duration: period, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [t, period]);
  return (
    <Animated.View style={[style, { transform: [{ rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/** animate-pulse: opacity 1 → .5 → 1 over 2s. */
export function Pulse({ style, children }: { style?: StyleProp<ViewStyle>; children?: React.ReactNode }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(t, { toValue: 1, duration: 1000, easing: Easing.bezier(0.4, 0, 0.6, 1), useNativeDriver: true }),
      Animated.timing(t, { toValue: 0, duration: 1000, easing: Easing.bezier(0.4, 0, 0.6, 1), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [t]);
  return <Animated.View style={[style, { opacity: t.interpolate({ inputRange: [0, 1], outputRange: [1, 0.5] }) }]}>{children}</Animated.View>;
}

/**
 * .glow-brand: box-shadow 0 0 0 0 → 0 0 0 12px rgba(26,111,255,0), 2.4s.
 * Drawn as a brand disc behind the element that grows by 12px and fades.
 */
export function GlowBrand({ size, radius = 9999 }: { size: number; radius?: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(t, { toValue: 1, duration: 1440, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(t, { toValue: 0, duration: 0, useNativeDriver: true }),
      Animated.delay(960),
    ]));
    loop.start();
    return () => loop.stop();
  }, [t]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', left: 0, top: 0, width: size, height: size, borderRadius: radius, backgroundColor: 'rgb(26,111,255)',
        opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.42, 0] }),
        transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, (size + 24) / size] }) }],
      }} />
  );
}

/** .pulse-ring: expanding fading ring, 1.6s. */
export function PulseRing({ style, delay = 0, period = 1600, from = 0.95, to = 1.6, startOpacity = 0.7 }: { style?: StyleProp<ViewStyle>; delay?: number; period?: number; from?: number; to?: number; startOpacity?: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(t, { toValue: 1, duration: period, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(t, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    const timer = setTimeout(() => loop.start(), delay);
    return () => { clearTimeout(timer); loop.stop(); };
  }, [t, delay, period]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[style, {
        opacity: t.interpolate({ inputRange: [0, 1], outputRange: [startOpacity, 0] }),
        transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [from, to] }) }],
      }]} />
  );
}
