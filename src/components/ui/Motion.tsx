import React, { Children, isValidElement, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useFirstOpen } from '../../context/NavigationContext';
import { ease } from '../../theme';

const STAGGER = [0.01, 0.06, 0.11, 0.16, 0.21, 0.25];
const delayFor = (i: number) => (i < STAGGER.length ? STAGGER[i] : 0.29) * 1000;

/** One rising item: opacity 0 → 1, translateY 10 → 0, 420ms ease-out. */
export function RiseIn({ delay = 0, distance = 10, duration = 420, children, style, scaleFrom }: { delay?: number; distance?: number; duration?: number; children?: React.ReactNode; style?: StyleProp<ViewStyle>; scaleFrom?: number }) {
  const first = useFirstOpen();
  const t = useRef(new Animated.Value(first ? 0 : 1)).current;
  const settled = useSettle(first, t, { toValue: 1, duration, delay, easing: ease.out, useNativeDriver: true });
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] });
  const transform = scaleFrom != null
    ? [{ translateY }, { scale: t.interpolate({ inputRange: [0, 1], outputRange: [scaleFrom, 1] }) }]
    : [{ translateY }];
  return <Animated.View style={[style, !settled && { opacity: t, transform }]}>{children}</Animated.View>;
}

/**
 * Runs a native-driver entrance and reports when it has finished. Native-driven values never reach
 * React's shadow tree, so once the animation ends the caller drops the animated style: the next
 * commit records the resting layout (opacity 1, no transform) that measure() and friends read.
 * The element type stays the same, so children are not remounted.
 */
function useSettle(first: boolean, t: Animated.Value, config: Animated.TimingAnimationConfig): boolean {
  const [settled, setSettled] = useState(!first);
  useEffect(() => {
    if (!first) return;
    const anim = Animated.timing(t, config);
    anim.start(({ finished }) => { if (finished) setSettled(true); });
    return () => anim.stop();
    // run once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [first, t]);
  return settled;
}

/**
 * The design's .screen-body / .stagger: each direct child rises in with a
 * staggered delay on the first visit to a screen.
 */
export function Stagger({ children, style, step }: { children?: React.ReactNode; style?: StyleProp<ViewStyle>; step?: number }) {
  let i = 0;
  return (
    <View style={style}>
      {Children.map(children, child => {
        if (!isValidElement(child)) return child;
        const d = step != null ? 30 + i * step : delayFor(i);
        i += 1;
        return <RiseIn delay={d}>{child}</RiseIn>;
      })}
    </View>
  );
}

/** .pop-in: scale .86 → 1 with the spring curve. */
export function PopIn({ delay = 0, children, style, duration = 440 }: { delay?: number; children?: React.ReactNode; style?: StyleProp<ViewStyle>; duration?: number }) {
  const first = useFirstOpen();
  const t = useRef(new Animated.Value(first ? 0 : 1)).current;
  const settled = useSettle(first, t, { toValue: 1, duration, delay, easing: ease.spring, useNativeDriver: true });
  return (
    <Animated.View style={[style, !settled && {
      opacity: t.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] }),
      transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) }],
    }]}>{children}</Animated.View>
  );
}

/** .fade-in: opacity 0 → 1, translateY 4 → 0, 320ms. */
export function FadeIn({ delay = 0, children, style }: { delay?: number; children?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <RiseIn delay={delay} distance={4} duration={320} style={style}>{children}</RiseIn>;
}

function Word({ word, delay, last, style }: { word: string; delay: number; last: boolean; style: StyleProp<TextStyle> }) {
  const first = useFirstOpen();
  const t = useRef(new Animated.Value(first ? 0 : 1)).current;
  useEffect(() => {
    if (!first) return;
    Animated.timing(t, { toValue: 1, duration: 500, delay, easing: ease.out, useNativeDriver: true }).start();
  }, [first, t, delay]);
  const fontSize = (StyleSheet.flatten(style)?.fontSize as number) ?? 16;
  return (
    <Animated.Text
      style={[style, { marginRight: last ? 0 : fontSize * 0.24, opacity: t, transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
      {word}
    </Animated.Text>
  );
}

/**
 * Word-by-word heading reveal (.wr). Words are separate boxes spaced by .24em,
 * exactly as the design's inline-block spans.
 */
export function WordReveal({ text, style, containerStyle }: { text: string; style: StyleProp<TextStyle>; containerStyle?: StyleProp<ViewStyle> }) {
  const words = text.split(' ');
  return (
    <View style={[styles.words, containerStyle]} accessible accessibilityRole="header" accessibilityLabel={text}>
      {words.map((w, i) => <Word key={i} word={w} delay={i * 60} last={i === words.length - 1} style={style} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  words: { flexDirection: 'row', flexWrap: 'wrap' },
});
