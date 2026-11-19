import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useFirstOpen } from '../../context/NavigationContext';
import { ease } from '../../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

export type MarkKind = 'success' | 'error' | 'warn';

const KIND: Record<MarkKind, { c: string; tint: string; paths: { d: string; len: number }[] }> = {
  success: { c: '#10B981', tint: '#D1FAE5', paths: [{ d: 'M16 27.5l6.5 6.5L37 19.5', len: 29.7 }] },
  error: { c: '#E11D48', tint: '#FFE4E6', paths: [{ d: 'M19 19l14 14', len: 19.8 }, { d: 'M33 19L19 33', len: 19.8 }] },
  warn: { c: '#F59E0B', tint: '#FEF3C7', paths: [{ d: 'M26 15.5v12', len: 12 }, { d: 'M26 35.5v.5', len: 0.5 }] },
};
const RING = 2 * Math.PI * 23;
const SPARKS = Array.from({ length: 8 }, (_, i) => i * 45);

/**
 * Animated status mark: outline ring draws → disc fills from centre → glyph
 * draws → bump (success) / shake (error) / tilt (warn).
 */
export function StatusMark({ kind = 'success', size = 20, delay = 0, sparks }: { kind?: MarkKind; size?: number; delay?: number; sparks?: boolean }) {
  const k = KIND[kind] ?? KIND.success;
  const first = useFirstOpen();
  const big = size >= 56;
  const showSparks = sparks ?? (kind === 'success' && size >= 22);
  const d = delay * 1000;
  const ring = useRef(new Animated.Value(first ? 0 : 1)).current;
  const fill = useRef(new Animated.Value(first ? 0 : 1)).current;
  const glyphs = useRef(k.paths.map(() => new Animated.Value(first ? 0 : 1))).current;
  const motion = useRef(new Animated.Value(first ? 0 : 1)).current;
  const spark = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (first) {
      Animated.timing(ring, { toValue: 1, duration: 500, delay: d, easing: ease.draw, useNativeDriver: false }).start();
      Animated.timing(fill, { toValue: 1, duration: 380, delay: d + 420, easing: ease.spring, useNativeDriver: true }).start();
      glyphs.forEach((g, i) => Animated.timing(g, { toValue: 1, duration: 340, delay: d + 620 + i * 140, easing: ease.draw, useNativeDriver: false }).start());
      Animated.timing(motion, { toValue: 1, duration: 500, delay: d + 950, easing: Easing.linear, useNativeDriver: true }).start();
      if (showSparks) Animated.timing(spark, { toValue: 1, duration: 600, delay: d + 900, easing: ease.out, useNativeDriver: true }).start();
    }
    if (big) {
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(halo, { toValue: 1, duration: 1800, easing: ease.out, useNativeDriver: true }),
        Animated.timing(halo, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]));
      const timer = setTimeout(() => loop.start(), first ? d + 600 : 0);
      return () => { clearTimeout(timer); loop.stop(); };
    }
  }, [first, big, d, ring, fill, glyphs, motion, spark, halo, showSparks]);

  const motionStyle =
    kind === 'success'
      ? { transform: [{ scale: motion.interpolate({ inputRange: [0, 0.4, 0.7, 1], outputRange: [1, 1.14, 0.96, 1] }) }] }
      : kind === 'error'
        ? { transform: [{ translateX: motion.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: [0, -5, 5, -3, 2, 0] }) }] }
        : { transform: [{ rotate: motion.interpolate({ inputRange: [0, 0.3, 0.65, 1], outputRange: ['0deg', '-12deg', '8deg', '0deg'] }) }] };

  return (
    <Animated.View style={[{ width: size, height: size }, styles.center, motionStyle]}>
      {showSparks && SPARKS.map(r => (
        <Animated.View
          key={r}
          pointerEvents="none"
          style={[styles.spark, {
            width: Math.max(2, size * 0.06), height: size * 0.2, backgroundColor: k.c,
            opacity: spark.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 1, 0] }),
            transform: [
              { rotate: `${r}deg` },
              { translateY: spark.interpolate({ inputRange: [0, 1], outputRange: [-size * 0.62, -size * 0.9] }) },
              { scaleY: spark.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) },
            ],
          }]} />
      ))}
      {big && (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.round, {
            backgroundColor: k.tint,
            opacity: halo.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] }),
            transform: [{ scale: halo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) }],
          }]} />
      )}
      <Animated.View style={[StyleSheet.absoluteFill, styles.center, { opacity: fill, transform: [{ scale: fill }] }]}>
        <View style={[styles.round, { width: size * (46 / 52), height: size * (46 / 52), backgroundColor: k.c }]} />
      </Animated.View>
      <Svg viewBox="0 0 52 52" width={size} height={size} style={StyleSheet.absoluteFill}>
        <AnimatedCircle
          cx={26} cy={26} r={23} fill="none" stroke={k.c} strokeWidth={big ? 2.5 : 3.5} strokeLinecap="round"
          strokeDasharray={`${RING} ${RING}`}
          strokeDashoffset={ring.interpolate({ inputRange: [0, 1], outputRange: [RING, 0] })}
          transform="rotate(-90 26 26)" />
        {k.paths.map((p, i) => (
          <AnimatedPath
            key={i} d={p.d} fill="none" stroke="white" strokeWidth={big ? 4.2 : 5} strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={`${p.len + 0.01} ${p.len + 0.01}`}
            strokeDashoffset={glyphs[i].interpolate({ inputRange: [0, 1], outputRange: [p.len + 0.01, 0] })} />
        ))}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  round: { borderRadius: 9999 },
  spark: { position: 'absolute', borderRadius: 9999 },
});
