import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';
import { Icon } from '../../components/icons/Icon';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { buzz } from '../../components/ui/Press';
import { Sheen } from '../../components/ui/Sheen';
import { T } from '../../components/ui/T';
import type { ScreenProps } from '../../navigation/types';
import { colors, ease, elev, ring } from '../../theme';
import { pad2 } from '../../utils/format';

const OB_SLIDES = [
  { heading: 'Buy Verified Properties', desc: 'Legal verified real estate investment with complete transparency. Site-inspected before listing.',
    bg: '#EEF4FF', blobA: '#BFD6FF', blobB: '#D9E6FF', accent: '#1A6FFF', photo: 'ob-buy-1', photo2: 'ob-buy-2' },
  { heading: 'Sell Directly to Builtglory', desc: 'No broker, no hassle. Get fair offers directly from verified buyers.',
    bg: '#EAFBF3', blobA: '#B4F0D3', blobB: '#D5F7E6', accent: '#059669', photo: 'ob-sell-1', photo2: 'ob-sell-2' },
  { heading: 'AI Powered Real Estate', desc: 'Smart property decisions with AI valuations, legal checks, and instant matching.',
    bg: '#F3F0FF', blobA: '#D6CCFF', blobB: '#E7E1FF', accent: '#7C3AED', photo: 'ob-ai-1', photo2: 'ob-ai-2' },
];
const SPRING_SOFT = Easing.bezier(0.34, 1.18, 0.44, 1);

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
};
// blur-3xl disc → soft radial fall-off
const blob = (hex: string) => `radial-gradient(circle closest-side, rgba(${rgb(hex)},1) 0%, rgba(${rgb(hex)},0.95) 25%, rgba(${rgb(hex)},0.5) 57%, rgba(${rgb(hex)},0.06) 85%, rgba(${rgb(hex)},0) 100%)`;

// ─── Floating info chip on the visual ────────────────────────
function ObChip({ children, style, delay = 0 }: { children?: React.ReactNode; style: object; delay?: number }) {
  const pop = useRef(new Animated.Value(0)).current;
  const fl = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(pop, { toValue: 1, duration: 600, delay: delay * 1000, easing: ease.spring, useNativeDriver: true }).start();
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(fl, { toValue: 1, duration: 2750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(fl, { toValue: 0, duration: 2750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    const t = setTimeout(() => loop.start(), delay * 1000);
    return () => { clearTimeout(t); loop.stop(); };
  }, [pop, fl, delay]);
  return (
    <Animated.View style={[styles.chipPos, style, {
      opacity: pop.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] }),
      transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) }],
    }]}>
      <Animated.View style={{ transform: [{ translateY: fl.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) }] }}>
        <View style={styles.chip}>{children}</View>
      </Animated.View>
    </Animated.View>
  );
}

function ChipIcon({ name, bg, color, size = 16, round }: { name: string; bg: string; color: string; size?: number; round?: boolean }) {
  return <View style={[styles.chipIcon, { backgroundColor: bg, borderRadius: round ? 9999 : 12 }]}><Icon name={name} size={size} color={color} /></View>;
}

function MatchBar() {
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(w, { toValue: 0.96, duration: 1000, delay: 1000, easing: ease.out, useNativeDriver: false }).start(); }, [w]);
  return (
    <View style={styles.matchTrack}>
      <Animated.View style={[styles.matchFill, { width: w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
    </View>
  );
}

function ScanLine() {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(t, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [t]);
  return (
    <>
      <Svg style={StyleSheet.absoluteFill} width={212} height={272} pointerEvents="none">
        {Array.from({ length: 10 }).map((_, k) => <Line key={'v' + k} x1={k * 22 + 0.5} y1={0} x2={k * 22 + 0.5} y2={272} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />)}
        {Array.from({ length: 13 }).map((_, k) => <Line key={'h' + k} x1={0} y1={k * 22 + 0.5} x2={212} y2={k * 22 + 0.5} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />)}
      </Svg>
      <Animated.View style={[styles.scan, { transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [-64, 272] }) }] }]} />
    </>
  );
}

// ─── Stacked photo cards + chips for one slide ───────────────
function ObVisual({ idx, active, drag }: { idx: number; active: boolean; drag: Animated.Value }) {
  const sl = OB_SLIDES[idx];
  const rot = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(rot, { toValue: active ? 1 : 0, duration: 700, easing: ease.spring, useNativeDriver: true }).start();
  }, [active, rot]);
  const par = active ? Animated.multiply(drag, 0.18) : new Animated.Value(0);
  return (
    <View style={styles.visual}>
      <Animated.View style={[styles.backCard, {
        transform: [
          { translateX: Animated.add(34, Animated.multiply(par, 0.5)) },
          { rotate: rot.interpolate({ inputRange: [0, 1], outputRange: ['2deg', '8deg'] }) },
          { scale: 0.92 },
        ],
      }]}>
        <PhotoPlaceholder tag={sl.photo2} w={500} style={styles.fill} />
        <View style={[StyleSheet.absoluteFill, styles.whiteWash]} />
      </Animated.View>
      <Animated.View style={[styles.frontCard, {
        transform: [
          { translateX: Animated.add(-14, par) },
          { rotate: rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-4deg'] }) },
        ],
      }]}>
        <PhotoPlaceholder tag={sl.photo} w={600} style={styles.fill} />
        {idx === 2 && active && <ScanLine />}
      </Animated.View>

      {active && idx === 0 && (<>
        <ObChip delay={0.35} style={{ left: 14, top: 36 }}>
          <ChipIcon name="badge-check" bg={colors.emerald50} color="#10B981" size={17} />
          <View><T s={12} w={800}>Legally verified</T><T s={10} c={colors.ink500}>Title clear · 30 yrs</T></View>
        </ObChip>
        <ObChip delay={0.55} style={{ right: 12, top: 178 }}>
          <ChipIcon name="map-pin" bg={colors.brand50} color="#1A6FFF" />
          <T s={12} w={800}>Site-inspected</T>
        </ObChip>
        <ObChip delay={0.75} style={{ left: 30, top: 252 }}>
          <T num display s={16} w={800} c={colors.brand700} ls={-0.03}>₹1.2 Cr</T>
          <View style={styles.pillGreen}><T s={10} w={700} c={colors.emerald600}>0% brokerage</T></View>
        </ObChip>
      </>)}

      {active && idx === 1 && (<>
        <ObChip delay={0.35} style={{ right: 10, top: 30 }}>
          <ChipIcon name="hand-coins" bg={colors.emerald50} color="#059669" />
          <View><T s={10} c={colors.ink500}>Builtglory offer</T><T num display s={16} w={800} ls={-0.03}>₹84,50,000</T></View>
        </ObChip>
        <ObChip delay={0.6} style={{ left: 10, top: 150 }}>
          <ChipIcon name="user-x" bg={colors.ink100} color="#64748B" size={15} round />
          <T s={12} w={800}>No broker</T>
        </ObChip>
        <ObChip delay={0.8} style={{ right: 18, top: 246 }}>
          <View style={styles.avatars}>
            {['#1A6FFF', '#10B981', '#F59E0B'].map((c, k) => <View key={c} style={[styles.avatar, { backgroundColor: c, marginLeft: k ? -6 : 0 }]} />)}
          </View>
          <T s={11} w={700} c={colors.ink700}>3 verified buyers</T>
        </ObChip>
      </>)}

      {active && idx === 2 && (<>
        <ObChip delay={0.35} style={{ left: 12, top: 44 }}>
          <ChipIcon name="sparkles" bg={colors.violet50} color="#7C3AED" />
          <View><T s={10} c={colors.ink500}>AI valuation</T><T num s={13} w={800}>₹82L – ₹88L</T></View>
        </ObChip>
        <ObChip delay={0.6} style={{ right: 10, top: 168 }}>
          <ChipIcon name="scale" bg={colors.emerald50} color="#059669" size={15} />
          <T s={12} w={800}>Legal check ✓</T>
        </ObChip>
        <ObChip delay={0.8} style={{ left: 26, top: 252 }}>
          <T num s={12} w={800} c={colors.violet700}>96% match</T>
          <MatchBar />
        </ObChip>
      </>)}
    </View>
  );
}

function HeadingWords({ text }: { text: string }) {
  const words = text.split(' ');
  return (
    <View style={styles.heading} accessible accessibilityRole="header" accessibilityLabel={text}>
      {words.map((w, k) => <ObWord key={k} delay={k * 70} style={styles.headingWord}>{w}</ObWord>)}
    </View>
  );
}

function ObWord({ children, delay, style, duration = 500 }: { children: string; delay: number; style: object; duration?: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(t, { toValue: 1, duration, delay, easing: ease.out, useNativeDriver: true }).start(); }, [t, delay, duration]);
  return <Animated.Text style={[style, { opacity: t, transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>{children}</Animated.Text>;
}

/** S-02 Onboarding: three swipeable story slides with auto-advance. */
export function OnboardingScreen({ onDone }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { width: W } = useWindowDimensions();
  const n = OB_SLIDES.length;
  const [i, setI] = useState(0);
  const iRef = useRef(0);
  iRef.current = i;
  const s = OB_SLIDES[i];
  const goTo = (k: number) => { if (k >= 0 && k < n && k !== iRef.current) { setI(k); buzz(); } };
  const goRef = useRef(goTo);
  goRef.current = goTo;
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const next = () => (i < n - 1 ? goTo(i + 1) : onDone());

  // background + stage position
  const color = useRef(new Animated.Value(0)).current;
  const stage = useRef(new Animated.Value(0)).current;
  const drag = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(color, { toValue: i, duration: 700, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: false }).start();
    Animated.timing(stage, { toValue: -i * W, duration: 600, easing: SPRING_SOFT, useNativeDriver: false }).start();
  }, [i, W, color, stage]);

  // story progress for the current slide (5.5s, pauses while dragging)
  const prog = useRef(new Animated.Value(0)).current;
  const progAnim = useRef<Animated.CompositeAnimation | null>(null);
  const runProgress = (from: number) => {
    prog.setValue(from);
    progAnim.current = Animated.timing(prog, { toValue: 1, duration: 5500 * (1 - from), easing: Easing.linear, useNativeDriver: false });
    progAnim.current.start(({ finished }) => { if (finished && iRef.current < n - 1) goRef.current(iRef.current + 1); });
  };
  useEffect(() => {
    runProgress(0);
    return () => progAnim.current?.stop();
    // restart on slide change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderGrant: () => { progAnim.current?.stop(); },
    onPanResponderMove: (_, g) => {
      const k = iRef.current;
      const d = (k === 0 && g.dx > 0) || (k === n - 1 && g.dx < 0) ? g.dx * 0.3 : g.dx;
      drag.setValue(d);
      stage.setValue(-k * W + d);
    },
    onPanResponderRelease: (_, g) => {
      drag.setValue(0);
      const k = iRef.current;
      let moved = false;
      if (g.dx < -W * 0.2 || g.vx < -0.45) { if (k < n - 1) { goRef.current(k + 1); moved = true; } }
      else if (g.dx > W * 0.2 || g.vx > 0.45) { if (k > 0) { goRef.current(k - 1); moved = true; } }
      if (!moved) {
        Animated.timing(stage, { toValue: -k * W, duration: 600, easing: SPRING_SOFT, useNativeDriver: false }).start();
        prog.stopAnimation(v => runProgress(v));
      }
    },
  })).current;

  const bg = color.interpolate({ inputRange: [0, 1, 2], outputRange: OB_SLIDES.map(x => x.bg) });
  const accent = color.interpolate({ inputRange: [0, 1, 2], outputRange: OB_SLIDES.map(x => x.accent) });

  // ambient blobs drift
  const blobT = useRef(new Animated.Value(0)).current;
  const blobT2 = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const mk = (t: Animated.Value, period: number, rev: boolean) => Animated.loop(Animated.sequence([
      Animated.timing(t, { toValue: rev ? 0 : 1, duration: period / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(t, { toValue: rev ? 1 : 0, duration: period / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    const a = mk(blobT, 9000, false), b = mk(blobT2, 11000, true);
    a.start();
    const timer = setTimeout(() => b.start(), 1500);
    return () => { a.stop(); b.stop(); clearTimeout(timer); };
  }, [blobT, blobT2]);
  const drift = (t: Animated.Value) => ({
    transform: [
      { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) },
      { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, 24] }) },
      { scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) },
    ],
  });

  const prevShown = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(prevShown, { toValue: i === 0 ? 0 : 1, duration: 300, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: false }).start();
  }, [i, prevShown]);

  return (
    <Animated.View style={[styles.root, { backgroundColor: bg }]}>
      <Animated.View pointerEvents="none" style={[styles.blobA, drift(blobT)]}>
        {OB_SLIDES.map((x, k) => <Animated.View key={k} style={[StyleSheet.absoluteFill, { experimental_backgroundImage: blob(x.blobA), opacity: color.interpolate({ inputRange: [k - 1, k, k + 1], outputRange: [0, 1, 0], extrapolate: 'clamp' }) }]} />)}
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.blobB, drift(blobT2)]}>
        {OB_SLIDES.map((x, k) => <Animated.View key={k} style={[StyleSheet.absoluteFill, { experimental_backgroundImage: blob(x.blobB), opacity: color.interpolate({ inputRange: [k - 1, k, k + 1], outputRange: [0, 1, 0], extrapolate: 'clamp' }) }]} />)}
      </Animated.View>

      {/* story progress + skip */}
      <View style={[styles.top, { paddingTop: insets.top + 4 }]}>
        <View style={styles.bars}>
          {OB_SLIDES.map((_, k) => (
            <Pressable key={k} onPress={() => goTo(k)} style={styles.barTrack} accessibilityLabel={`Slide ${k + 1}`}>
              <Animated.View style={[styles.barFill, {
                backgroundColor: accent,
                width: k < i ? '100%' : k > i ? '0%' : prog.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              }]} />
            </Pressable>
          ))}
        </View>
        <Pressable onPress={onDone} style={({ pressed }) => [styles.skip, pressed && styles.pressed]} accessibilityRole="button">
          <T s={13} w={700} c={colors.ink600}>Skip</T>
        </Pressable>
      </View>

      {/* swipeable stage */}
      <View style={styles.stage} {...pan.panHandlers}>
        <Animated.View style={[styles.track, { width: W * n, transform: [{ translateX: stage }] }]}>
          {OB_SLIDES.map((_, k) => (
            <View key={k} style={[styles.slide, { width: W }]}>
              <View style={styles.visualBox}><ObVisual idx={k} active={k === i} drag={drag} /></View>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* copy + CTA */}
      <View style={[styles.copy, { paddingBottom: 36 + insets.bottom }]}>
        <Animated.Text style={[styles.counter, { color: accent }]}>{pad2(i + 1)} / {pad2(n)}</Animated.Text>
        <HeadingWords key={'h' + i} text={s.heading} />
        <ObWord key={'p' + i} delay={250} duration={550} style={styles.desc}>{s.desc}</ObWord>
        <View style={styles.ctaRow}>
          <Animated.View style={{ opacity: prevShown, marginLeft: prevShown.interpolate({ inputRange: [0, 1], outputRange: [-64, 0] }) }} pointerEvents={i === 0 ? 'none' : 'auto'}>
            <Pressable onPress={() => goTo(i - 1)} accessibilityLabel="Previous" style={({ pressed }) => [styles.prev, pressed && styles.pressedScale]}>
              <Icon name="arrow-left" size={20} />
            </Pressable>
          </Animated.View>
          <Pressable onPress={next} style={styles.flex1} accessibilityRole="button">
            {({ pressed }) => (
              <Animated.View style={[styles.next, { backgroundColor: accent, boxShadow: `0 10px 24px -8px ${s.accent}` }, pressed && styles.pressedScale]}>
                <View style={[StyleSheet.absoluteFill, styles.clip]}><Sheen /></View>
                <T s={15} w={700} c="#FFFFFF">{i < n - 1 ? 'Next' : 'Get Started'}</T>
                <Icon name={i < n - 1 ? 'arrow-right' : 'rocket'} size={18} color="white" />
              </Animated.View>
            )}
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  flex1: { flex: 1 },
  fill: { width: '100%', height: '100%' },
  blobA: { position: 'absolute', top: -80 - 141, right: -96 - 141, width: 320 + 282, height: 320 + 282 },
  blobB: { position: 'absolute', top: 288 - 141, left: -112 - 141, width: 288 + 282, height: 288 + 282 },
  top: { zIndex: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  bars: { flex: 1, flexDirection: 'row', gap: 6 },
  barTrack: { flex: 1, height: 5, borderRadius: 9999, backgroundColor: 'rgba(15,23,42,0.1)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 9999 },
  skip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.7)', boxShadow: ring('#FFFFFF') },
  pressed: { transform: [{ scale: 0.97 }] },
  pressedScale: { transform: [{ scale: 0.97 }] },
  stage: { flex: 1, minHeight: 0 },
  track: { position: 'absolute', top: 0, bottom: 0, left: 0, flexDirection: 'row' },
  slide: { height: '100%', justifyContent: 'center' },
  visualBox: { width: '100%', height: 310 },
  visual: { width: '100%', height: '100%' },
  backCard: { position: 'absolute', left: '50%', marginLeft: -98, top: 30, width: 196, height: 250, borderRadius: 26, overflow: 'hidden', boxShadow: elev.e2 },
  whiteWash: { backgroundColor: 'rgba(255,255,255,0.25)' },
  frontCard: { position: 'absolute', left: '50%', marginLeft: -106, top: 14, width: 212, height: 272, borderRadius: 28, overflow: 'hidden', boxShadow: elev.e3 },
  scan: { position: 'absolute', left: 0, right: 0, top: 0, height: 64, experimental_backgroundImage: 'linear-gradient(180deg, rgba(167,139,250,0), rgba(167,139,250,0.55), rgba(167,139,250,0))' },
  chipPos: { position: 'absolute', zIndex: 10 },
  chip: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 16, boxShadow: elev.e3, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  chipIcon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  pillGreen: { backgroundColor: colors.emerald50, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 9999 },
  avatars: { flexDirection: 'row' },
  avatar: { width: 20, height: 20, borderRadius: 9999, boxShadow: ring('#FFFFFF', 2) },
  matchTrack: { width: 56, height: 6, borderRadius: 9999, backgroundColor: colors.violet100, overflow: 'hidden' },
  matchFill: { height: '100%', borderRadius: 9999, backgroundColor: colors.violet500 },
  copy: { zIndex: 20, paddingHorizontal: 24 },
  counter: { fontFamily: 'Inter-ExtraBold', fontSize: 11, lineHeight: 16.5, letterSpacing: 1.54, textTransform: 'uppercase', marginBottom: 8, includeFontPadding: false },
  heading: { flexDirection: 'row', flexWrap: 'wrap', minHeight: 66 },
  headingWord: { fontFamily: 'BricolageGrotesque-ExtraBold', fontSize: 30, lineHeight: 32.4, letterSpacing: -1.05, color: colors.ink900, marginRight: 7.5, includeFontPadding: false },
  desc: { fontFamily: 'Inter-Regular', fontSize: 14, lineHeight: 22.75, color: colors.ink600, marginTop: 12, minHeight: 66, includeFontPadding: false },
  ctaRow: { marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  prev: { width: 52, height: 52, borderRadius: 9999, backgroundColor: colors.white, boxShadow: elev.e1, alignItems: 'center', justifyContent: 'center' },
  next: { height: 52, borderRadius: 9999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  clip: { borderRadius: 9999, overflow: 'hidden' },
});
