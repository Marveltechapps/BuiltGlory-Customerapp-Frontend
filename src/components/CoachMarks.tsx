import React, { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { tw } from '../theme';
import { Btn } from './Btn';
import { Icon } from './Icon';
import { Fade } from './Motion';
import { Press } from './Press';
import { T } from './T';

export interface CoachRect {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
}

const STEPS = [
  {
    title: 'Search anything',
    body: 'Tap the search bar to find properties by city, area or builder.',
    cardTop: 0.44,
  },
  {
    title: 'Buy or sell in seconds',
    body: 'Two-tap access to our verified marketplace for buyers and sellers.',
    cardTop: 0.56,
  },
  {
    title: 'Save your favourites',
    body: 'Tap ♡ on any listing to save it. Find them all under Favorites.',
    cardTop: 0.56,
  },
  {
    title: 'Quick navigation',
    body: 'Home, Buy, Sell, Profile — always one tap away at the bottom.',
    cardTop: 0.35,
  },
];

function rectPath({ x, y, w, h, r }: CoachRect) {
  if (!r) return `M${x},${y} H${x + w} V${y + h} H${x} Z`;
  return `M${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${
    y + h - r
  } Q${x + w},${y + h} ${x + w - r},${y + h} H${x + r} Q${x},${y + h} ${x},${
    y + h - r
  } V${y + r} Q${x},${y} ${x + r},${y} Z`;
}

/** Four-step spotlight tour over Home (H-06). `spots` are measured relative to the Home root view hosting the overlay. */
export function CoachMarks({
  spots,
  onDone,
}: {
  spots: Array<CoachRect | null>;
  onDone: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const [i, setI] = useState(0);
  const spot = spots[i] ?? { x: 0, y: 0, w: 0, h: 0, r: 0 };
  const step = STEPS[i];
  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 50 }]}>
      <Svg
        width={width}
        height={height}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Path
          fillRule="evenodd"
          d={`M0,0 H${width} V${height} H0 Z ${rectPath(spot)}`}
          fill="rgba(0,0,0,0.72)"
        />
        <Rect
          x={spot.x}
          y={spot.y}
          width={spot.w}
          height={spot.h}
          rx={spot.r}
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={2.5}
        />
      </Svg>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onDone}
        accessibilityLabel="Skip tour"
      />
      <Fade key={i} style={[styles.cardWrap, { top: height * step.cardTop }]}>
        <View style={styles.card}>
          <View style={styles.stepPill}>
            <T style={styles.stepPillText}>
              Step {i + 1} of {STEPS.length}
            </T>
          </View>
          <T style={styles.title}>{step.title}</T>
          <T style={styles.body}>{step.body}</T>
          <View style={styles.footer}>
            {STEPS.map((_, idx) => (
              <View
                key={idx}
                style={[styles.dot, idx === i ? styles.dotOn : styles.dotOff]}
              />
            ))}
            <View style={styles.flex} />
            <Press onPress={onDone} pressScale={1} style={styles.textBtn}>
              <T style={styles.textBtnLabel}>Skip</T>
            </Press>
            {i > 0 && (
              <Press
                onPress={() => setI(i - 1)}
                pressScale={1}
                style={[styles.textBtn, styles.backBtn]}
              >
                <Icon name="arrow-left" size={13} color="#64748B" />
                <T style={styles.textBtnLabel}>Back</T>
              </Press>
            )}
            <Btn
              size="sm"
              style={styles.selfCenter}
              onPress={() => (i < STEPS.length - 1 ? setI(i + 1) : onDone())}
              iconRight={i < STEPS.length - 1 ? 'arrow-right' : 'check'}
            >
              {i < STEPS.length - 1 ? 'Next' : 'Got it'}
            </Btn>
          </View>
        </View>
      </Fade>
    </View>
  );
}

const styles = StyleSheet.create({
  selfCenter: { alignSelf: 'center' },
  flex: { flex: 1 },
  cardWrap: { position: 'absolute', left: 24, right: 24 },
  card: {
    ...tw('bg-white rounded-card p-5'),
    boxShadow:
      '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
  },
  stepPill: {
    ...tw('px-2 py-0.5 bg-brand-600 rounded-full mb-2'),
    alignSelf: 'flex-start',
  },
  stepPillText: tw('text-[10px] font-bold text-white'),
  title: tw('text-[17px] font-bold mb-1.5'),
  body: tw('text-[13px] text-ink-500 leading-relaxed'),
  footer: tw('mt-4 flex items-center gap-2'),
  dot: tw('h-1.5 rounded-full'),
  dotOn: tw('w-5 bg-brand-600'),
  dotOff: tw('w-1.5 bg-ink-200'),
  textBtn: tw('flex items-center gap-0.5 mr-1'),
  backBtn: tw('mr-2'),
  textBtnLabel: tw('text-[13px] text-ink-500'),
});
