import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors, ease, gradients, ring } from '../../theme';
import { Sheen } from './Sheen';

/** Thin progress bar with gradient fill and sheen. value is 0–100. */
export function ProgressBar({ value }: { value: number }) {
  const v = useRef(new Animated.Value(value)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: value, duration: 600, easing: ease.out, useNativeDriver: false }).start();
  }, [value, v]);
  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, { width: v.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]}>
        <Sheen />
      </Animated.View>
    </View>
  );
}

function Dot({ state }: { state: 'now' | 'done' | 'todo' }) {
  const w = useRef(new Animated.Value(state === 'now' ? 28 : 6)).current;
  useEffect(() => {
    Animated.timing(w, { toValue: state === 'now' ? 28 : 6, duration: 420, easing: ease.spring, useNativeDriver: false }).start();
  }, [state, w]);
  return <Animated.View style={[styles.dot, { width: w }, state === 'now' ? styles.dotNow : state === 'done' ? styles.dotDone : styles.dotTodo]} />;
}

/** Onboarding page dots: active dot stretches to a 28px gradient pill. */
export function StepDots({ count, current }: { count: number; current: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }).map((_, i) => (
        <Dot key={i} state={i === current ? 'now' : i < current ? 'done' : 'todo'} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', height: 8, backgroundColor: colors.ink100, borderRadius: 9999, overflow: 'hidden', boxShadow: ring('rgba(226,232,240,0.6)') },
  fill: { height: '100%', borderRadius: 9999, overflow: 'hidden', experimental_backgroundImage: gradients.brandBar },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { height: 6, borderRadius: 9999 },
  dotNow: { experimental_backgroundImage: gradients.brandBar },
  dotDone: { backgroundColor: colors.brand300 },
  dotTodo: { backgroundColor: colors.ink200 },
});
