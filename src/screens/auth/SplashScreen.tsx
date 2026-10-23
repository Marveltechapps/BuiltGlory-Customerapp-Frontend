import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Btn } from '../../components/Btn';
import { Icon } from '../../components/Icon';
import { Rise } from '../../components/Motion';
import { T } from '../../components/T';
import { compareVersions, APP_VERSION } from '../../context/AppConfigContext';
import { useAppConfig } from '../../context/AppConfigContext';
import { useAuth } from '../../context/AuthContext';
import { useNav } from '../../navigation/NavContext';
import { gradients, tw, twh } from '../../theme';
import { isNetworkError } from '../../utils/errorMessage';
import { readJson, STORAGE_KEYS } from '../../utils/storage';

const WORD = 'BUILTGLORY'.split('');
const MIN_SPLASH_MS = 2600;

function Letter({ c, i }: { c: string; i: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 550,
      delay: 250 + i * 45,
      easing: Easing.bezier(0.22, 0.8, 0.3, 1),
      useNativeDriver: true,
    }).start();
  }, [i, v]);
  return (
    <Animated.Text
      style={[
        styles.letter,
        i >= 5 && styles.letterBrand,
        {
          opacity: v,
          transform: [
            {
              translateY: v.interpolate({
                inputRange: [0, 1],
                outputRange: [18, 0],
              }),
            },
            {
              rotate: v.interpolate({
                inputRange: [0, 1],
                outputRange: ['6deg', '0deg'],
              }),
            },
          ],
        },
      ]}
    >
      {c}
    </Animated.Text>
  );
}

function Drift({
  style,
  duration,
  reverse,
}: {
  style: object;
  duration: number;
  reverse?: boolean;
}) {
  const v = useRef(new Animated.Value(reverse ? 1 : 0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, {
          toValue: reverse ? 0 : 1,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(v, {
          toValue: reverse ? 1 : 0,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, duration, reverse]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        style,
        {
          transform: [
            {
              translateX: v.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 18],
              }),
            },
            {
              translateY: v.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -22],
              }),
            },
            {
              scale: v.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.12],
              }),
            },
          ],
        },
      ]}
    />
  );
}

/** S-01 Splash: loads public config + stored session, then routes. */
export function SplashScreen() {
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const { bootstrap } = useAuth();
  const { load } = useAppConfig();
  const [stalled, setStalled] = useState(false);
  const started = useRef(Date.now());
  const routed = useRef(false);
  const result = useRef<null | (() => void)>(null);

  const pop = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(pop, {
      toValue: 1,
      duration: 700,
      easing: Easing.bezier(0.34, 1.32, 0.44, 1),
      useNativeDriver: true,
    }).start();
    const loop = Animated.loop(
      Animated.timing(ring, {
        toValue: 1,
        duration: 1800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    const t = setTimeout(() => loop.start(), 600);
    Animated.timing(bar, {
      toValue: 1,
      duration: 1500,
      delay: 1050,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();
    return () => {
      clearTimeout(t);
      loop.stop();
    };
  }, [bar, pop, ring]);

  const route = useCallback(() => {
    if (routed.current || !result.current) return;
    routed.current = true;
    result.current();
  }, []);

  const run = useCallback(async () => {
    setStalled(false);
    routed.current = false;
    result.current = null;
    try {
      const config = await load();
      if (config.maintenance?.enabled) {
        result.current = () => nav.reset('maintenance');
      } else if (
        compareVersions(APP_VERSION, config.versions.minimumSupported) < 0
      ) {
        result.current = () => nav.reset('forceUpdate');
      } else {
        const status = await bootstrap();
        if (status === 'signedIn') result.current = () => nav.reset('home');
        else {
          const seen = await readJson<boolean>(
            STORAGE_KEYS.onboardingSeen,
            false,
          );
          result.current = () => nav.reset(seen ? 'login' : 'onboarding');
        }
      }
    } catch (error) {
      if (isNetworkError(error)) result.current = () => nav.reset('offline');
      else {
        // Server reachable but config failed: continue with the stored session.
        const status = await bootstrap().catch(() => 'signedOut' as const);
        result.current = () =>
          nav.reset(status === 'signedIn' ? 'home' : 'login');
      }
    }
    const wait = Math.max(0, MIN_SPLASH_MS - (Date.now() - started.current));
    setTimeout(route, wait);
  }, [bootstrap, load, nav, route]);

  useEffect(() => {
    run();
    const t = setTimeout(() => {
      if (!routed.current) setStalled(true);
    }, 5000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Pressable
      style={styles.root}
      onPress={route}
      accessibilityLabel="Builtglory"
    >
      <StatusBar barStyle="dark-content" />
      <Drift style={styles.blobA} duration={7000} />
      <Drift style={styles.blobB} duration={8000} reverse />
      <View style={styles.center}>
        <Animated.View
          style={[
            styles.logoWrap,
            {
              opacity: pop,
              transform: [
                {
                  scale: pop.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.86, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.logoRing,
              {
                opacity: ring.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.35, 0],
                }),
                transform: [
                  {
                    scale: ring.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.7],
                    }),
                  },
                ],
              },
            ]}
          >
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          </Animated.View>
        </Animated.View>
        <View style={styles.word}>
          {WORD.map((c, i) => (
            <Letter key={i} c={c} i={i} />
          ))}
        </View>
        <Rise delay={850} duration={600}>
          <T style={styles.tagline}>Find. Flip. Flourish.</T>
        </Rise>
        <Rise delay={1000} duration={500}>
          <View style={styles.track}>
            <Animated.View
              style={[
                styles.fill,
                {
                  width: bar.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </Rise>
      </View>
      {stalled && (
        <Rise style={[styles.stalled, { bottom: 96 + insets.bottom }]}>
          <T style={styles.stalledText}>Taking longer than usual…</T>
          <Btn size="sm" style={styles.selfCenter} onPress={run}>
            Retry
          </Btn>
        </Rise>
      )}
      <View style={[styles.footer, { bottom: 32 + insets.bottom }]}>
        <T style={styles.footerText}>Powered by Builtglory · v1.0</T>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  selfCenter: { alignSelf: 'center' },
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  blobA: {
    position: 'absolute',
    top: -96 - 64,
    left: -80 - 64,
    width: 288 + 128,
    height: 288 + 128,
    experimental_backgroundImage:
      'radial-gradient(circle closest-side, rgba(163,199,255,0.6) 0%, rgba(163,199,255,0.6) 45%, transparent 100%)',
  },
  blobB: {
    position: 'absolute',
    bottom: -112 - 64,
    right: -64 - 64,
    width: 320 + 128,
    height: 320 + 128,
    experimental_backgroundImage:
      'radial-gradient(circle closest-side, rgba(221,214,255,0.5) 0%, rgba(221,214,255,0.5) 45%, transparent 100%)',
  },
  center: { alignItems: 'center' },
  logoWrap: { width: 80, height: 80, marginBottom: 28 },
  logoRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: 26,
    backgroundColor: '#4A8CFF',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 26,
    experimental_backgroundImage: gradients.logo,
  },
  word: tw('flex'),
  letter: twh('text-[40px] font-extrabold text-ink-900 leading-none'),
  letterBrand: tw('text-brand-600'),
  tagline: tw('text-[13px] text-ink-500 mt-3 font-semibold tracking-wide'),
  track: tw('mt-10 w-28 h-1 rounded-full bg-ink-100 overflow-hidden'),
  fill: {
    ...tw('h-full rounded-full'),
    experimental_backgroundImage: gradients.bar,
  },
  stalled: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 12,
  },
  stalledText: tw('text-[12px] text-ink-400'),
  footer: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  footerText: tw('text-[11px] text-ink-400'),
});
