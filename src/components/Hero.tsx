import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { meshes, tw, twh } from '../theme';
import { Icon, type IconName } from './Icon';
import { Float, Pop, Spin } from './Motion';
import { StatusMark } from './StatusMark';
import { T } from './T';

type HeroTone = 'success' | 'info' | 'warn' | 'error' | 'neutral' | 'empty';

const TONES = {
  info: {
    grad: 'linear-gradient(140deg, #4A8CFF, #1A6FFF 55%, #0E4AA8)',
    ring: '#1A6FFF',
    glow: 'rgba(26,111,255,.45)',
  },
  neutral: {
    grad: 'linear-gradient(140deg, #94A3B8, #64748B 55%, #334155)',
    ring: '#64748B',
    glow: 'rgba(100,116,139,.4)',
  },
};

function PulseRing({
  color,
  delay,
  size,
}: {
  color: string;
  delay: number;
  size: number;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(v, {
        toValue: 1,
        duration: 2400,
        easing: Easing.bezier(0.22, 0.8, 0.3, 1),
        useNativeDriver: true,
      }),
    );
    const t = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(t);
      loop.stop();
    };
  }, [v, delay]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.pulseRing,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
        },
        {
          opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
          transform: [
            {
              scale: v.interpolate({
                inputRange: [0, 1],
                outputRange: [0.85, 1.55],
              }),
            },
          ],
        },
      ]}
    />
  );
}

/** Large status illustration for success / error / info / empty screens (`StatusHero`). */
export function StatusHero({
  icon = 'check',
  tone = 'success',
  size = 96,
}: {
  icon?: IconName;
  tone?: HeroTone;
  size?: number;
}) {
  if (tone === 'empty') {
    return (
      <View
        style={[
          styles.center,
          { width: size + 24, height: size + 24, marginBottom: 24 },
        ]}
      >
        <Float style={[StyleSheet.absoluteFill, styles.round, styles.mint]} />
        <Spin
          duration={18000}
          style={[styles.dashed, { borderRadius: (size + 24) / 2 }]}
        >
          <View />
        </Spin>
        <Pop duration={600} style={styles.emptyTile}>
          <Icon name={icon} size={28} color="#1A6FFF" />
        </Pop>
      </View>
    );
  }
  if (tone === 'success' || tone === 'error' || tone === 'warn') {
    return (
      <View
        style={[
          styles.center,
          { width: size + 40, height: size + 40, marginBottom: 24 },
        ]}
      >
        <StatusMark kind={tone} size={size} delay={0.1} />
      </View>
    );
  }
  const t = TONES[tone];
  return (
    <View
      style={[
        styles.center,
        { width: size + 40, height: size + 40, marginBottom: 24 },
      ]}
    >
      {[0, 1, 2].map(k => (
        <PulseRing key={k} color={t.ring} delay={350 + k * 500} size={size} />
      ))}
      <View
        style={[
          styles.softDisc,
          {
            width: size + 24,
            height: size + 24,
            borderRadius: (size + 24) / 2,
            backgroundColor: t.ring,
          },
        ]}
      />
      {tone === 'info' && (
        <Spin
          duration={4000}
          style={[styles.orbit, { width: size + 20, height: size + 20 }]}
        >
          <View
            style={[
              styles.orbitDot,
              { backgroundColor: t.ring, boxShadow: `0 0 12px ${t.glow}` },
            ]}
          />
        </Spin>
      )}
      <Pop
        duration={750}
        from={0.4}
        style={[
          styles.center,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            experimental_backgroundImage: t.grad,
            boxShadow: `0 16px 36px -10px ${t.glow}, inset 0 2px 0 rgba(255,255,255,.35)`,
          },
        ]}
      >
        <Pop delay={300} duration={600} from={0.3}>
          <Icon
            name={icon}
            size={size * 0.44}
            color="#FFFFFF"
            strokeWidth={2}
          />
        </Pop>
      </Pop>
    </View>
  );
}

/** Small empty illustration (`EmptyGlyph`). */
export function EmptyGlyph({ name }: { name: IconName }) {
  return (
    <View style={[styles.center, styles.glyph]}>
      <Float
        style={[
          StyleSheet.absoluteFill,
          styles.round,
          styles.mint,
          { opacity: 0.7 },
        ]}
      />
      <Pop duration={550} from={0.4} style={styles.glyphTile}>
        <Icon name={name} size={22} color="#1A6FFF" />
      </Pop>
    </View>
  );
}

/** Animated number (`CountUp`). */
export function CountUp({
  to,
  dur = 1100,
  prefix = '',
  suffix = '',
  format,
  style,
}: {
  to: number;
  dur?: number;
  prefix?: string;
  suffix?: string;
  format?: (n: number) => string;
  style?: any;
}) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    let t0 = 0;
    const tick = (t: number) => {
      if (!t0) t0 = t;
      const p = Math.min(1, (t - t0) / dur);
      setN(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, dur]);
  const v = format ? format(n) : Math.round(n).toLocaleString('en-IN');
  return (
    <T style={[{ fontVariant: ['tabular-nums'] }, style]}>
      {prefix}
      {v}
      {suffix}
    </T>
  );
}

/** Money that counts up to a lakh value, e.g. ₹ 82.5 L (`MoneyUp`). */
export function MoneyUp({
  value,
  decimals = 1,
  prefix = '₹ ',
  suffix = ' L',
  dur = 1200,
  style,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  dur?: number;
  style?: any;
}) {
  return (
    <CountUp
      to={value}
      dur={dur}
      format={n => prefix + n.toFixed(decimals) + suffix}
      style={style}
    />
  );
}

/** Circular countdown for time-bound offers (`CountdownRing`). */
export function CountdownRing({
  secs,
  total,
}: {
  secs: number;
  total: number;
}) {
  const hh = Math.floor(secs / 3600);
  const mm = Math.floor((secs % 3600) / 60);
  const ss = secs % 60;
  const R = 54;
  const C = 2 * Math.PI * R;
  const pct = total > 0 ? Math.max(0, secs / total) : 0;
  return (
    <View style={styles.ring}>
      <Svg
        viewBox="0 0 128 128"
        width={148}
        height={148}
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        <Defs>
          <LinearGradient id="cdg" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#34D399" />
            <Stop offset="1" stopColor="#4A8CFF" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={64}
          cy={64}
          r={R}
          fill="none"
          stroke="rgba(255,255,255,.12)"
          strokeWidth={8}
        />
        <Circle
          cx={64}
          cy={64}
          r={R}
          fill="none"
          stroke="url(#cdg)"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={[C, C]}
          strokeDashoffset={C * (1 - pct)}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <T style={styles.ringTime}>
          {String(hh).padStart(2, '0')}:{String(mm).padStart(2, '0')}
        </T>
        <T style={styles.ringSec}>{String(ss).padStart(2, '0')} sec</T>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  round: { borderRadius: 9999 },
  mint: { experimental_backgroundImage: meshes.mint, opacity: 0.8 },
  dashed: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#A3C7FF',
  },
  emptyTile: tw(
    'w-16 h-16 rounded-2xl bg-white elev-3 items-center justify-center',
  ),
  pulseRing: { position: 'absolute', borderWidth: 2 },
  softDisc: { position: 'absolute', opacity: 0.1 },
  orbit: { position: 'absolute', alignItems: 'center' },
  orbitDot: { width: 12, height: 12, borderRadius: 6, marginTop: -4 },
  glyph: { width: 84, height: 84, marginBottom: 8 },
  glyphTile: tw(
    'w-12 h-12 rounded-2xl bg-white elev-2 items-center justify-center',
  ),
  ring: { width: 148, height: 148, alignSelf: 'center' },
  ringTime: twh('num text-[26px] font-extrabold leading-none text-white'),
  ringSec: tw('num text-[12px] text-white/60 mt-1'),
});
