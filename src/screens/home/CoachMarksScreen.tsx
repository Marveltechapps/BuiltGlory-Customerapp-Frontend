import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect as SvgRect } from 'react-native-svg';
import { Icon } from '../../components/icons/Icon';
import { NAV_HEIGHT } from '../../components/layout/BottomNav';
import { Btn } from '../../components/ui/Btn';
import { FadeIn } from '../../components/ui/Motion';
import { T } from '../../components/ui/T';
import { coachTargets, measureCoachTarget, type CoachKey, type Rect } from '../../lib/coachTargets';
import { colors, elev } from '../../theme';

const STEPS = [
  { title: 'Search anything', body: 'Tap the search bar to find properties by city, area or builder.' },
  { title: 'Buy or sell in seconds', body: 'Two-tap access to our verified marketplace for buyers and sellers.' },
  { title: 'Save your favourites', body: 'Tap ♡ on any listing to save it. Find them all under Favorites.' },
  { title: 'Quick navigation', body: 'Home, Buy, Sell, Profile — always one tap away at the bottom.' },
];
const CARD_TOP = [0.44, 0.56, 0.56, 0.35];

/** H-06 Coach marks: four spotlight steps over Home. */
export function CoachMarksScreen({ onDone }: { onDone: () => void }) {
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [i, setI] = useState(0);
  const [rects, setRects] = useState(() => ({ ...coachTargets }));
  // Re-measure on open, again once Home's entrance animations have committed their resting layout,
  // and on every step, so the spotlight tracks the real position.
  useEffect(() => {
    const measureAll = () => (['search', 'buy', 'sell'] as CoachKey[]).forEach(k => measureCoachTarget(k, r => setRects(p => ({ ...p, [k]: r }))));
    measureAll();
    const t = setTimeout(measureAll, 450);
    return () => clearTimeout(t);
  }, [i]);
  // Measured Home targets, falling back to the design's 375×812 positions.
  const dy = insets.top - 44;
  const tileW = (W - 32 - 12) / 2;
  const fallback: Rect[] = [
    { x: 16, y: 211 + dy, w: W - 32, h: 55 },
    { x: 16, y: 286 + dy, w: tileW, h: 108 },
    { x: 16 + tileW + 12, y: 286 + dy, w: tileW, h: 108 },
  ];
  const spots: (Rect & { r: number })[] = [
    { ...(rects.search ?? fallback[0]), r: 16 },
    { ...(rects.buy ?? fallback[1]), r: 16 },
    { ...(rects.sell ?? fallback[2]), r: 16 },
    { x: 0, y: H - NAV_HEIGHT - insets.bottom, w: W, h: NAV_HEIGHT + insets.bottom, r: 0 },
  ];
  const { x, y, w, h, r } = spots[i];
  const outer = `M0,0 H${W} V${H} H0 Z`;
  const inner = r === 0
    ? `M${x},${y} H${x + w} V${y + h} H${x} Z`
    : `M${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} H${x + r} Q${x},${y + h} ${x},${y + h - r} V${y + r} Q${x},${y} ${x + r},${y} Z`;
  const last = i === STEPS.length - 1;
  return (
    <View style={styles.root}>
      <Svg width={W} height={H} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Path fillRule="evenodd" d={`${outer} ${inner}`} fill="rgba(0,0,0,0.72)" />
        <SvgRect x={x} y={y} width={w} height={h} rx={r} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={2.5} />
      </Svg>
      <Pressable style={StyleSheet.absoluteFill} onPress={onDone} accessibilityLabel="Dismiss tips" />
      <View style={[styles.cardPos, { top: H * CARD_TOP[i] }]}>
        <FadeIn key={i} style={styles.card}>
          <View style={styles.stepRow}>
            <View style={styles.step}><T s={10} w={700} c="#FFFFFF">Step {i + 1} of {STEPS.length}</T></View>
          </View>
          <T s={17} w={700} style={styles.mb6}>{STEPS[i].title}</T>
          <T s={13} c={colors.ink500} lh={1.625}>{STEPS[i].body}</T>
          <View style={styles.footer}>
            {STEPS.map((_, k) => <View key={k} style={[styles.dot, k === i ? styles.dotOn : styles.dotOff]} />)}
            <View style={styles.flex1} />
            <Pressable onPress={onDone} style={styles.mr4}><T s={13} c={colors.ink500}>Skip</T></Pressable>
            {i > 0 && (
              <Pressable onPress={() => setI(i - 1)} style={styles.back}>
                <Icon name="arrow-left" size={13} color="#64748B" />
                <T s={13} c={colors.ink500}>Back</T>
              </Pressable>
            )}
            <Btn size="sm" onPress={() => (last ? onDone() : setI(i + 1))} iconRight={last ? 'check' : 'arrow-right'}>{last ? 'Got it' : 'Next'}</Btn>
          </View>
        </FadeIn>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: 50 },
  flex1: { flex: 1 },
  mb6: { marginBottom: 6 },
  mr4: { marginRight: 4 },
  cardPos: { position: 'absolute', left: 24, right: 24 },
  card: { backgroundColor: colors.white, borderRadius: 14, padding: 20, boxShadow: elev.xl },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  step: { paddingHorizontal: 8, paddingVertical: 2, backgroundColor: colors.brand600, borderRadius: 9999 },
  footer: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { height: 6, borderRadius: 9999 },
  dotOn: { width: 20, backgroundColor: colors.brand600 },
  dotOff: { width: 6, backgroundColor: colors.ink200 },
  back: { marginRight: 8, flexDirection: 'row', alignItems: 'center', gap: 2 },
});
