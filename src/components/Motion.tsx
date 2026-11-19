import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, fonts } from '../theme';

const OUT = Easing.bezier(0.22, 0.8, 0.3, 1);
const SPRING = Easing.bezier(0.34, 1.32, 0.44, 1);

interface MotionProps {
  children?: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  /** Skip the animation (screens revisited in the same session render static, like `.seen`). */
  disabled?: boolean;
}

/** `riseIn`: fade + 10px rise used for screen sections and staggered lists. */
export function Rise({
  children,
  delay = 0,
  duration = 420,
  style,
  disabled,
  distance = 10,
}: MotionProps & { distance?: number }) {
  const v = useRef(new Animated.Value(disabled ? 1 : 0)).current;
  useEffect(() => {
    if (disabled) return;
    Animated.timing(v, {
      toValue: 1,
      duration,
      delay,
      easing: OUT,
      useNativeDriver: true,
    }).start();
  }, [v, delay, duration, disabled]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v,
          transform: [
            {
              translateY: v.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** `popIn`: scale .86 → 1 with spring overshoot. */
export function Pop({
  children,
  delay = 0,
  duration = 440,
  style,
  disabled,
  from = 0.86,
}: MotionProps & { from?: number }) {
  const v = useRef(new Animated.Value(disabled ? 1 : 0)).current;
  useEffect(() => {
    if (disabled) return;
    Animated.timing(v, {
      toValue: 1,
      duration,
      delay,
      easing: SPRING,
      useNativeDriver: true,
    }).start();
  }, [v, delay, duration, disabled]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v.interpolate({
            inputRange: [0, 0.6, 1],
            outputRange: [0, 1, 1],
          }),
          transform: [
            {
              scale: v.interpolate({
                inputRange: [0, 1],
                outputRange: [from, 1],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** `fadeIn`: opacity with a 4px rise (.32s). */
export function Fade({
  children,
  delay = 0,
  duration = 320,
  style,
  disabled,
}: MotionProps) {
  return (
    <Rise
      delay={delay}
      duration={duration}
      style={style}
      disabled={disabled}
      distance={4}
    >
      {children}
    </Rise>
  );
}

/** Ambient vertical float (`.float`, 5.5s loop). */
export function Float({
  children,
  style,
  delay = 0,
  distance = 7,
  duration = 5500,
}: MotionProps & { distance?: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, {
          toValue: 1,
          duration: duration / 2,
          delay,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(v, {
          toValue: 0,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, delay, duration]);
  return (
    <Animated.View
      style={[
        style,
        {
          transform: [
            {
              translateY: v.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -distance],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Continuous rotation for spinners (`animate-spin`). */
export function Spin({
  children,
  duration = 1000,
  style,
}: {
  children: React.ReactNode;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(v, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [v, duration]);
  return (
    <Animated.View
      style={[
        style,
        {
          transform: [
            {
              rotate: v.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Slow pulse for "in progress" dots (`animate-pulse`). */
export function Pulse({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, {
          toValue: 0.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(v, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  return (
    <Animated.View style={[style, { opacity: v }]}>{children}</Animated.View>
  );
}

export const easings = { OUT, SPRING };

function RevealWord({
  word,
  index,
  disabled,
  style,
}: {
  word: string;
  index: number;
  disabled?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  const v = useRef(new Animated.Value(disabled ? 1 : 0)).current;
  useEffect(() => {
    if (disabled) return;
    Animated.timing(v, {
      toValue: 1,
      duration: 500,
      delay: index * 60,
      easing: OUT,
      useNativeDriver: true,
    }).start();
  }, [v, index, disabled]);
  return (
    <Animated.Text
      maxFontSizeMultiplier={1.3}
      style={[
        wordStyles.base,
        style,
        {
          opacity: v,
          transform: [
            {
              translateY: v.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      {word}
    </Animated.Text>
  );
}

/** `WordReveal`: title words rise in one after another (60ms stagger), static on revisits. */
export function WordReveal({
  text,
  style,
  disabled,
}: {
  text: string;
  style?: StyleProp<TextStyle>;
  disabled?: boolean;
}) {
  const words = text.split(' ').filter(Boolean);
  return (
    <View
      accessible
      accessibilityRole="header"
      accessibilityLabel={text}
      style={wordStyles.row}
    >
      {words.map((w, i) => (
        <RevealWord
          key={`${i}-${w}`}
          word={i < words.length - 1 ? `${w} ` : w}
          index={i}
          disabled={disabled}
          style={style}
        />
      ))}
    </View>
  );
}

const wordStyles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  base: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
});

/** `glow-brand`: a brand ring that swells 12px and fades, every 2.4s (unread markers). */
export function GlowPulse({
  size,
  radius = 9999,
  color = 'rgba(26,111,255,0.42)',
}: {
  size: number;
  radius?: number;
  color?: string;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, {
          toValue: 1,
          duration: 1440,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(960),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: color,
        opacity: v.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
        transform: [
          {
            scale: v.interpolate({
              inputRange: [0, 1],
              outputRange: [1, (size + 24) / size],
            }),
          },
        ],
      }}
    />
  );
}
