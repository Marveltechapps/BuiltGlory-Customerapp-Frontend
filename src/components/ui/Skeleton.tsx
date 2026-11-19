import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type DimensionValue } from 'react-native';
import { colors, elev } from '../../theme';

/** Shimmering placeholder block (the design's .shimmer). */
export function Skeleton({ h = 16, w = '100%', r = 8 }: { h?: number; w?: DimensionValue; r?: number }) {
  const [width, setWidth] = useState(0);
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(t, { toValue: 1, duration: 1350, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [t]);
  // background-size 220%, position 180% → -60%: offset = -1.2w × pos
  const translateX = t.interpolate({ inputRange: [0, 1], outputRange: [-2.16 * width, 0.72 * width] });
  return (
    <View style={[styles.base, { height: h, width: w, borderRadius: r }]} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && <Animated.View style={[styles.band, { width: width * 2.2, transform: [{ translateX }] }]} />}
    </View>
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <Skeleton h={160} r={0} />
      <View style={styles.body}>
        <Skeleton h={15} w="72%" />
        <Skeleton h={20} w="45%" />
        <Skeleton h={12} w="88%" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: '#EEF2F7', overflow: 'hidden' },
  band: {
    position: 'absolute', top: 0, bottom: 0, left: 0,
    experimental_backgroundImage: 'linear-gradient(100deg, #EEF2F7 30%, #F8FAFC 50%, #EEF2F7 70%)',
  },
  card: { borderRadius: 14, borderWidth: 1, borderColor: colors.ink200, overflow: 'hidden', backgroundColor: colors.white, boxShadow: elev.e1 },
  body: { padding: 14, gap: 10 },
});
