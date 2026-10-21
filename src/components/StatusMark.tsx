import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

export type MarkKind = 'success' | 'error' | 'warn';

const KINDS: Record<
  MarkKind,
  { c: string; tint: string; paths: Array<{ d: string; len: number }> }
> = {
  success: {
    c: '#10B981',
    tint: '#D1FAE5',
    paths: [{ d: 'M16 27.5l6.5 6.5L37 19.5', len: 29.7 }],
  },
  error: {
    c: '#E11D48',
    tint: '#FFE4E6',
    paths: [
      { d: 'M19 19l14 14', len: 19.8 },
      { d: 'M33 19L19 33', len: 19.8 },
    ],
  },
  warn: {
    c: '#F59E0B',
    tint: '#FEF3C6',
    paths: [
      { d: 'M26 15.5v12', len: 12 },
      { d: 'M26 35.5v.5', len: 0.5 },
    ],
  },
};
const CIRC = 2 * Math.PI * 23;
const DRAW = Easing.bezier(0.65, 0, 0.35, 1);
const SPRING = Easing.bezier(0.34, 1.32, 0.44, 1);

/**
 * Status mark from the reference: outline ring draws → disc fills from centre → glyph draws →
 * success bumps, error shakes, warn tilts. `delay` is in seconds like the reference.
 */
export function StatusMark({
  kind = 'success',
  size = 20,
  delay = 0,
}: {
  kind?: MarkKind;
  size?: number;
  delay?: number;
}) {
  const k = KINDS[kind];
  const big = size >= 56;
  const d = delay * 1000;
  const ring = useRef(new Animated.Value(0)).current;
  const disc = useRef(new Animated.Value(0)).current;
  const glyphs = useRef(k.paths.map(() => new Animated.Value(0))).current;
  const motion = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anims = [
      Animated.timing(ring, {
        toValue: 1,
        duration: 500,
        delay: d,
        easing: DRAW,
        useNativeDriver: false,
      }),
      Animated.timing(disc, {
        toValue: 1,
        duration: 380,
        delay: d + 420,
        easing: SPRING,
        useNativeDriver: false,
      }),
      ...glyphs.map((g, i) =>
        Animated.timing(g, {
          toValue: 1,
          duration: 340,
          delay: d + 620 + i * 140,
          easing: DRAW,
          useNativeDriver: false,
        }),
      ),
      Animated.timing(motion, {
        toValue: 1,
        duration: 500,
        delay: d + 950,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    ];
    Animated.parallel(anims).start();
    let loop: Animated.CompositeAnimation | undefined;
    if (big) {
      loop = Animated.loop(
        Animated.timing(halo, {
          toValue: 1,
          duration: 1800,
          easing: Easing.bezier(0.22, 0.8, 0.3, 1),
          useNativeDriver: false,
        }),
      );
      const t = setTimeout(() => loop?.start(), d + 600);
      return () => {
        clearTimeout(t);
        loop?.stop();
      };
    }
  }, [big, d, disc, glyphs, halo, motion, ring]);

  const transform =
    kind === 'success'
      ? [
          {
            scale: motion.interpolate({
              inputRange: [0, 0.4, 0.7, 1],
              outputRange: [1, 1.14, 0.96, 1],
            }),
          },
        ]
      : kind === 'error'
      ? [
          {
            translateX: motion.interpolate({
              inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
              outputRange: [0, -5, 5, -3, 2, 0],
            }),
          },
        ]
      : [
          {
            rotate: motion.interpolate({
              inputRange: [0, 0.3, 0.65, 1],
              outputRange: ['0deg', '-12deg', '8deg', '0deg'],
            }),
          },
        ];

  // The halo pulses out to r≈41 (beyond the 52-unit mark), so large marks draw on a padded canvas
  // instead of letting the SVG viewport clip the halo to a square.
  const pad = big ? 16 : 0;
  const box = 52 + pad * 2;
  const canvas = (size * box) / 52;
  return (
    <Animated.View style={{ width: size, height: size, transform }}>
      <Svg
        viewBox={`${-pad} ${-pad} ${box} ${box}`}
        width={canvas}
        height={canvas}
        style={[
          styles.canvas,
          { left: (size - canvas) / 2, top: (size - canvas) / 2 },
        ]}
      >
        {big && (
          <AnimatedCircle
            cx={26}
            cy={26}
            r={halo.interpolate({
              inputRange: [0, 1],
              outputRange: [25.5, 40.8],
            })}
            fill={k.tint}
            opacity={halo.interpolate({
              inputRange: [0, 1],
              outputRange: [0.9, 0],
            })}
          />
        )}
        <AnimatedCircle
          cx={26}
          cy={26}
          r={disc.interpolate({ inputRange: [0, 1], outputRange: [0, 23] })}
          fill={k.c}
        />
        <AnimatedCircle
          cx={26}
          cy={26}
          r={23}
          fill="none"
          stroke={k.c}
          strokeWidth={big ? 2.5 : 3.5}
          strokeLinecap="round"
          strokeDasharray={[CIRC, CIRC]}
          strokeDashoffset={ring.interpolate({
            inputRange: [0, 1],
            outputRange: [CIRC, 0],
          })}
          rotation={-90}
          origin="26, 26"
        />
        {k.paths.map((p, i) => (
          <AnimatedPath
            key={p.d}
            d={p.d}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={big ? 4.2 : 5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={[p.len + 0.01, p.len + 0.01]}
            strokeDashoffset={glyphs[i].interpolate({
              inputRange: [0, 1],
              outputRange: [p.len + 0.01, 0],
            })}
          />
        ))}
      </Svg>
    </Animated.View>
  );
}

/** Alias kept for parity with the reference (`AnimIcon`). */
export const AnimIcon = StatusMark;

/** Inline wrapper keeping the mark vertically centred in text rows. */
export function InlineMark(props: {
  kind?: MarkKind;
  size?: number;
  delay?: number;
}) {
  return (
    <View style={{ width: props.size ?? 20, height: props.size ?? 20 }}>
      <StatusMark {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: { position: 'absolute', overflow: 'visible' },
});
