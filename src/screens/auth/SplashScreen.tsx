import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { APP_VERSION } from '../../api/config';
import { Icon } from '../../components/icons/Icon';
import { Btn } from '../../components/ui/Btn';
import { FadeIn, PopIn } from '../../components/ui/Motion';
import { T } from '../../components/ui/T';
import { useAuth } from '../../context/AuthContext';
import { session } from '../../lib/session';
import type { ScreenProps } from '../../navigation/types';
import * as authService from '../../services/auth.service';
import { colors, ease, elev, gradients } from '../../theme';

const WORD = 'BUILTGLORY'.split('');

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(n => parseInt(n, 10) || 0);
  const pb = b.split('.').map(n => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x < y) return -1;
    if (x > y) return 1;
  }
  return 0;
}

function useLoop(period: number, delay = 0, reverse = false) {
  const t = useRef(new Animated.Value(reverse ? 1 : 0)).current;
  useEffect(() => {
    const half = period / 2;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(t, { toValue: reverse ? 0 : 1, duration: half, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(t, { toValue: reverse ? 1 : 0, duration: half, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    const timer = setTimeout(() => loop.start(), delay);
    return () => { clearTimeout(timer); loop.stop(); };
  }, [t, period, delay, reverse]);
  return t;
}

function useOnce(duration: number, delay: number, easing = ease.out) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration, delay, easing, useNativeDriver: true }).start();
  }, [t, duration, delay, easing]);
  return t;
}

function Letter({ c, i }: { c: string; i: number }) {
  const t = useOnce(550, 250 + i * 45);
  return (
    <Animated.Text
      style={[styles.letter, i >= 5 && styles.letterBrand, {
        opacity: t,
        transform: [
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
          { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['6deg', '0deg'] }) },
        ],
      }]}>
      {c}
    </Animated.Text>
  );
}

/** spRing: brand tile outline that expands and fades every 1.8s. */
function TileRing() {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(t, { toValue: 1, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(t, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    const timer = setTimeout(() => loop.start(), 600);
    return () => { clearTimeout(timer); loop.stop(); };
  }, [t]);
  return (
    <Animated.View
      style={[styles.tileRing, {
        opacity: t.interpolate({ inputRange: [0, 0.001, 1], outputRange: [0, 0.35, 0] }),
        transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
      }]} />
  );
}

/** S-01 Splash */
export function SplashScreen({ onNext, go, jump }: ScreenProps) {
  const { isHydrating, loadAppConfig, loginWithSession, refreshProfile } = useAuth();
  const [stalled, setStalled] = useState(false);
  const [bootKey, setBootKey] = useState(0);
  const navigated = useRef(false);

  const bootstrap = useCallback(async () => {
    if (isHydrating || navigated.current) return;
    setStalled(false);

    try {
      const config = await loadAppConfig();

      if (config?.maintenance?.enabled) {
        navigated.current = true;
        go('maintenance', { message: config.maintenance.message });
        return;
      }

      const minimum = config?.versions?.minimumSupported;
      if (minimum && compareVersions(APP_VERSION, minimum) < 0) {
        navigated.current = true;
        go('forceUpdate', {
          storeUrls: config.storeUrls,
          latest: config.versions.latest,
        });
        return;
      }

      if (session.refreshToken) {
        try {
          const tokens = await authService.refreshTokens(session.refreshToken);
          await loginWithSession({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          });
          const me = await refreshProfile();
          navigated.current = true;
          if (!me?.name?.trim()) {
            session.authMode = 'signup';
            go('profileSetup');
          } else {
            jump('home');
          }
          return;
        } catch {
          // Refresh / profile failed — continue to onboarding.
        }
      }

      navigated.current = true;
      onNext();
    } catch {
      setStalled(true);
    }
  }, [isHydrating, loadAppConfig, loginWithSession, refreshProfile, go, jump, onNext]);

  useEffect(() => {
    if (isHydrating) return;
    const t = setTimeout(() => { void bootstrap(); }, 1200);
    return () => clearTimeout(t);
  }, [isHydrating, bootstrap, bootKey]);

  useEffect(() => {
    const t = setTimeout(() => setStalled(true), 8000);
    return () => clearTimeout(t);
  }, [bootKey]);

  const blobA = useLoop(7000);
  const blobB = useLoop(8000, 1000, true);
  const tag = useOnce(600, 850);
  const barIn = useOnce(500, 1000, Easing.ease);
  const bar = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(bar, { toValue: 1, duration: 1500, delay: 1050, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: false }).start();
  }, [bar, bootKey]);

  const blobStyle = (t: Animated.Value) => ({
    transform: [
      { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, 18] }) },
      { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -22] }) },
      { scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
    ],
  });

  const retry = () => {
    navigated.current = false;
    setStalled(false);
    setBootKey(k => k + 1);
  };

  return (
    <Pressable style={styles.root} accessible={false}>
      <Animated.View style={[styles.blobA, blobStyle(blobA)]} />
      <Animated.View style={[styles.blobB, blobStyle(blobB)]} />
      <View style={styles.center}>
        <PopIn duration={700} style={styles.tileWrap}>
          <TileRing />
          <View style={styles.tile}>
            <Icon name="home" size={36} color="white" strokeWidth={2.2} />
          </View>
        </PopIn>
        <View style={styles.word} accessible accessibilityRole="header" accessibilityLabel="BUILTGLORY">
          {WORD.map((c, i) => <Letter key={i} c={c} i={i} />)}
        </View>
        <Animated.View style={{ opacity: tag, transform: [{ translateY: tag.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
          <T s={13} w={600} c={colors.ink500} ls={0.025} style={styles.tagline}>Find. Flip. Flourish.</T>
        </Animated.View>
        <Animated.View style={[styles.barTrack, { opacity: barIn, transform: [{ translateY: barIn.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
          <Animated.View style={[styles.barFill, { width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
        </Animated.View>
      </View>
      {stalled && (
        <FadeIn style={styles.stalled}>
          <T s={12} c={colors.ink400}>Taking longer than usual…</T>
          <Btn size="sm" onPress={retry} style={styles.selfCenter}>Retry</Btn>
        </FadeIn>
      )}
      <View style={styles.footer}>
        <T s={11} c={colors.ink400}>Powered by Builtglory · v{APP_VERSION}</T>
      </View>
    </Pressable>
  );
}

const blob = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  const rgb = `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  // blur-3xl (64px) on a solid disc, drawn as a radial fall-off
  return `radial-gradient(circle closest-side, rgba(${rgb},${a}) 0%, rgba(${rgb},${a * 0.95}) 25%, rgba(${rgb},${a * 0.5}) 57%, rgba(${rgb},${a * 0.06}) 85%, rgba(${rgb},0) 100%)`;
};

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  blobA: { position: 'absolute', top: -96 - 141, left: -80 - 141, width: 288 + 282, height: 288 + 282, experimental_backgroundImage: blob(colors.brand200, 0.6) },
  blobB: { position: 'absolute', bottom: -112 - 141, right: -64 - 141, width: 320 + 282, height: 320 + 282, experimental_backgroundImage: blob(colors.violet200, 0.5) },
  center: { alignItems: 'center' },
  tileWrap: { width: 80, height: 80, marginBottom: 28 },
  tileRing: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 26, backgroundColor: colors.brand400 },
  tile: { width: 80, height: 80, borderRadius: 26, alignItems: 'center', justifyContent: 'center', boxShadow: elev.brand, experimental_backgroundImage: 'linear-gradient(140deg, #4A8CFF, #1A6FFF 55%, #0E4AA8)' },
  word: { flexDirection: 'row' },
  letter: { fontFamily: 'BricolageGrotesque-ExtraBold', fontSize: 40, lineHeight: 40, letterSpacing: -1.6, color: colors.ink900, includeFontPadding: false },
  letterBrand: { color: colors.brand600 },
  tagline: { marginTop: 12 },
  barTrack: { marginTop: 40, width: 112, height: 4, borderRadius: 9999, backgroundColor: colors.ink100, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 9999, experimental_backgroundImage: gradients.brandBar },
  stalled: { position: 'absolute', bottom: 96, left: 0, right: 0, alignItems: 'center', gap: 12 },
  footer: { position: 'absolute', bottom: 32, left: 0, right: 0, alignItems: 'center' },
  selfCenter: { alignSelf: 'center' },
});
