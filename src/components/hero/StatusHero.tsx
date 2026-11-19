import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useFirstOpen } from '../../context/NavigationContext';
import { colors, ease, elev, gradients } from '../../theme';
import { pad2 } from '../../utils/format';
import { Icon } from '../icons/Icon';
import { Float, Spin } from '../ui/Float';
import { T } from '../ui/T';
import { StatusMark } from './StatusMark';

type Tone = 'success' | 'info' | 'warn' | 'error' | 'neutral' | 'empty';

const HERO_TONES = {
  success: { grad: 'linear-gradient(140deg, #34D399, #10B981 55%, #047857)', ring: '#10B981', glow: 'rgba(16,185,129,0.45)' },
  info: { grad: 'linear-gradient(140deg, #4A8CFF, #1A6FFF 55%, #0E4AA8)', ring: '#1A6FFF', glow: 'rgba(26,111,255,0.45)' },
  warn: { grad: 'linear-gradient(140deg, #FCD34D, #F59E0B 55%, #B45309)', ring: '#F59E0B', glow: 'rgba(245,158,11,0.45)' },
  error: { grad: 'linear-gradient(140deg, #FB7185, #E11D48 55%, #9F1239)', ring: '#E11D48', glow: 'rgba(225,29,72,0.42)' },
  neutral: { grad: 'linear-gradient(140deg, #94A3B8, #64748B 55%, #334155)', ring: '#64748B', glow: 'rgba(100,116,139,0.4)' },
};

function useEntrance(duration: number, delay = 0, easing = ease.spring) {
  const first = useFirstOpen();
  const t = useRef(new Animated.Value(first ? 0 : 1)).current;
  useEffect(() => {
    if (first) Animated.timing(t, { toValue: 1, duration, delay, easing, useNativeDriver: true }).start();
  }, [first, t, duration, delay, easing]);
  return t;
}

/** heroRing: expanding outline ring, staggered and repeating. */
function HeroRing({ color, delay }: { color: string; delay: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(t, { toValue: 1, duration: 2400, easing: ease.out, useNativeDriver: true }),
      Animated.timing(t, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    const timer = setTimeout(() => loop.start(), delay);
    return () => { clearTimeout(timer); loop.stop(); };
  }, [t, delay]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.ring, { borderColor: color, opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }), transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.55] }) }] }]} />
  );
}

/** Big status illustration at the top of success / info / warning / error / empty screens. */
export function StatusHero({ icon = 'check', tone = 'success', size = 96 }: { icon?: string; tone?: Tone; size?: number }) {
  const pop = useEntrance(600);
  const disc = useEntrance(700, 50);
  const hero = useEntrance(750);
  const glyph = useEntrance(600, 300);
  const first = useFirstOpen();

  if (tone === 'empty') {
    return (
      <View style={[styles.wrap, { width: size + 24, height: size + 24, marginBottom: 24 }]}>
        <Float style={[StyleSheet.absoluteFill, styles.round, styles.mint]} />
        <Spin period={18000} style={[styles.dashed]} />
        <Animated.View style={[styles.emptyTile, { opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] }]}>
          <Icon name={icon} size={28} color="#1A6FFF" />
        </Animated.View>
      </View>
    );
  }
  if (tone === 'success' || tone === 'error' || tone === 'warn') {
    return (
      <View style={[styles.wrap, { width: size + 40, height: size + 40, marginBottom: 24 }]}>
        <StatusMark kind={tone} size={size} delay={0.1} />
      </View>
    );
  }
  const t = HERO_TONES[tone] ?? HERO_TONES.info;
  // The design gives this disc opacity .1 inline, but its heroPop animation (fill-mode both) ends at
  // opacity 1 and overrides it, so on a first visit it shows as a solid ring behind the circle. On a
  // revisit the design disables the animation and the inline .1 applies.
  const discOpacity = first ? disc.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1], extrapolate: 'clamp' }) : 0.1;
  return (
    <View style={[styles.wrap, { width: size + 40, height: size + 40, marginBottom: 24 }]}>
      {[0, 1, 2].map(k => <HeroRing key={k} color={t.ring} delay={350 + k * 500} />)}
      <Animated.View style={[styles.disc, { backgroundColor: t.ring, opacity: discOpacity, transform: [{ scale: disc.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] }]} />
      {tone === 'info' && (
        <Spin period={4000} style={styles.orbit}>
          <View style={[styles.orbitDot, { backgroundColor: t.ring, boxShadow: `0 0 12px ${t.glow}` }]} />
        </Spin>
      )}
      <Animated.View
        style={[styles.round, styles.center, {
          width: size, height: size, experimental_backgroundImage: t.grad,
          boxShadow: `0 16px 36px -10px ${t.glow}, inset 0 2px 0 rgba(255,255,255,0.35)`,
          opacity: hero.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] }),
          transform: [{ scale: hero.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
        }]}>
        <Animated.View style={{ opacity: glyph, transform: [{ scale: glyph.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }, { rotate: glyph.interpolate({ inputRange: [0, 1], outputRange: ['-25deg', '0deg'] }) }] }}>
          <Icon name={icon} size={size * 0.44} color="white" strokeWidth={2} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

/** Small empty-state glyph: floating mint halo with an icon tile. */
export function EmptyGlyph({ name }: { name: string }) {
  const pop = useEntrance(550);
  return (
    <View style={styles.glyphWrap}>
      <Float style={[StyleSheet.absoluteFill, styles.round, styles.mint, { opacity: 0.7 }]} />
      <Animated.View style={[styles.glyphTile, { opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] }]}>
        <Icon name={name} size={22} color="#1A6FFF" />
      </Animated.View>
    </View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Circular countdown for time-bound offers (dark surfaces). */
export function CountdownRing({ secs, total }: { secs: number; total: number }) {
  const hh = Math.floor(secs / 3600), mm = Math.floor((secs % 3600) / 60), ss = secs % 60;
  const R = 54, C = 2 * Math.PI * R, pct = Math.max(0, secs / total);
  const v = useRef(new Animated.Value(C)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: C * (1 - pct), duration: 1000, easing: Easing.linear, useNativeDriver: false }).start();
  }, [pct, C, v]);
  return (
    <View style={styles.countdown}>
      <Svg viewBox="0 0 128 128" width={148} height={148} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <LinearGradient id="cdg" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#34D399" />
            <Stop offset="1" stopColor="#4A8CFF" />
          </LinearGradient>
        </Defs>
        <Circle cx={64} cy={64} r={R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={8} />
        <AnimatedCircle cx={64} cy={64} r={R} fill="none" stroke="url(#cdg)" strokeWidth={8} strokeLinecap="round" strokeDasharray={`${C} ${C}`} strokeDashoffset={v} />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <T display num s={26} w={800} ls={-0.03} lh={1} c={colors.white} align="center">{pad2(hh)}:{pad2(mm)}</T>
        <T num s={12} c="rgba(255,255,255,0.6)" align="center" style={styles.mt4}>{pad2(ss)} sec</T>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  round: { borderRadius: 9999 },
  mint: { experimental_backgroundImage: gradients.meshMint, opacity: 0.8 },
  dashed: { position: 'absolute', top: 12, left: 12, right: 12, bottom: 12, borderRadius: 9999, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.brand200 },
  emptyTile: { width: 64, height: 64, borderRadius: 16, backgroundColor: colors.white, boxShadow: elev.e3, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', top: 20, left: 20, right: 20, bottom: 20, borderRadius: 9999, borderWidth: 2 },
  disc: { position: 'absolute', top: 8, left: 8, right: 8, bottom: 8, borderRadius: 9999 },
  orbit: { position: 'absolute', top: 10, left: 10, right: 10, bottom: 10 },
  orbitDot: { position: 'absolute', top: -4, left: '50%', marginLeft: -6, width: 12, height: 12, borderRadius: 9999 },
  glyphWrap: { alignSelf: 'center', marginBottom: 8, width: 84, height: 84, alignItems: 'center', justifyContent: 'center' },
  glyphTile: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.white, boxShadow: elev.e2, alignItems: 'center', justifyContent: 'center' },
  countdown: { width: 148, height: 148, alignSelf: 'center' },
  mt4: { marginTop: 4 },
});
