import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

/**
 * The design's .sheen: a skewed white band sweeps across the surface every 4.6s
 * (idle 0–72%, sweep 72–92%).
 */
export function Sheen({ period = 4600 }: { period?: number }) {
  const [w, setW] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!w) return;
    x.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(period * 0.72),
        Animated.timing(x, { toValue: 1, duration: period * 0.2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.delay(period * 0.08),
        Animated.timing(x, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [w, period, x]);
  const band = w * 0.38;
  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: [-0.5 * w, 1.25 * w] });
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={e => setW(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <Animated.View style={[styles.band, { width: band, transform: [{ translateX }, { skewX: '-18deg' }] }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    experimental_backgroundImage: 'linear-gradient(100deg, rgba(255,255,255,0), rgba(255,255,255,0.42), rgba(255,255,255,0))',
  },
});
