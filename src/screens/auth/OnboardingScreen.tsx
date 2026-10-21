import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sheen } from '../../components/Btn';
import { Icon, type IconName } from '../../components/Icon';
import { Float, Pop } from '../../components/Motion';
import { Press } from '../../components/Press';
import { T } from '../../components/T';
import { useNav } from '../../navigation/NavContext';
import { tw, twh } from '../../theme';
import { buzz } from '../../utils/haptics';
import { STORAGE_KEYS, writeJson } from '../../utils/storage';

const SLIDES: Array<{
  heading: string;
  desc: string;
  bg: string;
  blobA: string;
  blobB: string;
  accent: string;
  photo: ImageSourcePropType;
  photo2: ImageSourcePropType;
}> = [
  {
    heading: 'Buy Verified Properties',
    desc: 'Legal verified real estate investment with complete transparency. Site-inspected before listing.',
    bg: '#EEF4FF',
    blobA: '#BFD6FF',
    blobB: '#D9E6FF',
    accent: '#1A6FFF',
    photo: require('../../../assets/images/onboarding-buy-1.jpg'),
    photo2: require('../../../assets/images/onboarding-buy-2.jpg'),
  },
  {
    heading: 'Sell Directly to Builtglory',
    desc: 'No broker, no hassle. Get fair offers directly from verified buyers.',
    bg: '#EAFBF3',
    blobA: '#B4F0D3',
    blobB: '#D5F7E6',
    accent: '#059669',
    photo: require('../../../assets/images/onboarding-sell-1.jpg'),
    photo2: require('../../../assets/images/onboarding-sell-2.jpg'),
  },
  {
    heading: 'AI Powered Real Estate',
    desc: 'Smart property decisions with AI valuations, legal checks, and instant matching.',
    bg: '#F3F0FF',
    blobA: '#D6CCFF',
    blobB: '#E7E1FF',
    accent: '#7C3AED',
    photo: require('../../../assets/images/onboarding-ai-1.jpg'),
    photo2: require('../../../assets/images/onboarding-ai-2.jpg'),
  },
];
const SLIDE_MS = 5500;

function ObChip({
  children,
  style,
  delay = 0,
}: {
  children: React.ReactNode;
  style: object;
  delay?: number;
}) {
  return (
    <Pop delay={delay * 1000} duration={600} style={[styles.chipPos, style]}>
      <Float delay={delay * 1000}>
        <View style={styles.chip}>{children}</View>
      </Float>
    </Pop>
  );
}

function ChipIcon({
  name,
  bg,
  color,
  size = 16,
  round,
}: {
  name: IconName;
  bg: string;
  color: string;
  size?: number;
  round?: boolean;
}) {
  return (
    <View
      style={[
        styles.chipIcon,
        { backgroundColor: bg },
        round && { borderRadius: 9999 },
      ]}
    >
      <Icon name={name} size={size} color={color} />
    </View>
  );
}

function Scan() {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(v, {
        toValue: 1,
        duration: 2400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  return (
    <>
      <View style={[StyleSheet.absoluteFill, styles.scanGrid]} />
      <Animated.View
        style={[
          styles.scanBar,
          {
            transform: [
              {
                translateY: v.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-64, 272],
                }),
              },
            ],
          },
        ]}
      />
    </>
  );
}

function ObVisual({ idx, active }: { idx: number; active: boolean }) {
  const sl = SLIDES[idx];
  const tilt = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(tilt, {
      toValue: active ? 1 : 0,
      duration: 700,
      easing: Easing.bezier(0.34, 1.32, 0.44, 1),
      useNativeDriver: true,
    }).start();
  }, [active, tilt]);
  return (
    <View style={styles.visual}>
      <Animated.View
        style={[
          styles.backCard,
          {
            transform: [
              { translateX: 34 },
              {
                rotate: tilt.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['2deg', '8deg'],
                }),
              },
              { scale: 0.92 },
            ],
          },
        ]}
      >
        <Image source={sl.photo2} style={styles.fill} resizeMode="cover" />
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(255,255,255,0.25)' },
          ]}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.frontCard,
          {
            transform: [
              { translateX: -14 },
              {
                rotate: tilt.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '-4deg'],
                }),
              },
            ],
          },
        ]}
      >
        <Image source={sl.photo} style={styles.fill} resizeMode="cover" />
        {idx === 2 && active && <Scan />}
      </Animated.View>

      {active && idx === 0 && (
        <>
          <ObChip delay={0.35} style={{ left: 14, top: 36 }}>
            <ChipIcon
              name="badge-check"
              bg="#ECFDF5"
              color="#10B981"
              size={17}
            />
            <View>
              <T style={styles.chipTitle}>Legally verified</T>
              <T style={styles.chipSub}>Title clear · 30 yrs</T>
            </View>
          </ObChip>
          <ObChip delay={0.55} style={{ right: 12, top: 178 }}>
            <ChipIcon name="map-pin" bg="#EEF4FF" color="#1A6FFF" />
            <T style={styles.chipTitle}>Site-inspected</T>
          </ObChip>
          <ObChip delay={0.75} style={{ left: 30, top: 252 }}>
            <T style={styles.chipPrice}>₹1.2 Cr</T>
            <View style={styles.zeroPill}>
              <T style={styles.zeroText}>0% brokerage</T>
            </View>
          </ObChip>
        </>
      )}
      {active && idx === 1 && (
        <>
          <ObChip delay={0.35} style={{ right: 10, top: 30 }}>
            <ChipIcon name="hand-coins" bg="#ECFDF5" color="#059669" />
            <View>
              <T style={styles.chipSub}>Builtglory offer</T>
              <T style={styles.chipMoney}>₹84,50,000</T>
            </View>
          </ObChip>
          <ObChip delay={0.6} style={{ left: 10, top: 150 }}>
            <ChipIcon
              name="user-x"
              bg="#F1F5F9"
              color="#64748B"
              size={15}
              round
            />
            <T style={styles.chipTitle}>No broker</T>
          </ObChip>
          <ObChip delay={0.8} style={{ right: 18, top: 246 }}>
            <View style={styles.dots}>
              {['#1A6FFF', '#10B981', '#F59E0B'].map((c, i) => (
                <View
                  key={c}
                  style={[
                    styles.avatarDot,
                    { backgroundColor: c, marginLeft: i ? -6 : 0 },
                  ]}
                />
              ))}
            </View>
            <T style={styles.buyers}>3 verified buyers</T>
          </ObChip>
        </>
      )}
      {active && idx === 2 && (
        <>
          <ObChip delay={0.35} style={{ left: 12, top: 44 }}>
            <ChipIcon name="sparkles" bg="#F5F3FF" color="#7C3AED" />
            <View>
              <T style={styles.chipSub}>AI valuation</T>
              <T style={styles.chipRange}>₹82L – ₹88L</T>
            </View>
          </ObChip>
          <ObChip delay={0.6} style={{ right: 10, top: 168 }}>
            <ChipIcon name="scale" bg="#ECFDF5" color="#059669" size={15} />
            <T style={styles.chipTitle}>Legal check ✓</T>
          </ObChip>
          <ObChip delay={0.8} style={{ left: 26, top: 252 }}>
            <T style={styles.match}>96% match</T>
            <View style={styles.matchTrack}>
              <View style={styles.matchFill} />
            </View>
          </ObChip>
        </>
      )}
    </View>
  );
}

function Word({ w, k, slide }: { w: string; k: number; slide: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    v.setValue(0);
    Animated.timing(v, {
      toValue: 1,
      duration: 500,
      delay: k * 70,
      easing: Easing.bezier(0.22, 0.8, 0.3, 1),
      useNativeDriver: true,
    }).start();
  }, [k, slide, v]);
  return (
    <Animated.Text
      style={[
        styles.heading,
        {
          opacity: v,
          transform: [
            {
              translateY: v.interpolate({
                inputRange: [0, 1],
                outputRange: [14, 0],
              }),
            },
          ],
        },
      ]}
    >
      {w}{' '}
    </Animated.Text>
  );
}

/** S-02 Onboarding. */
export function OnboardingScreen() {
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [i, setI] = useState(0);
  const iRef = useRef(0);
  const scroller = useRef<ScrollView>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const bg = useRef(new Animated.Value(0)).current;
  const n = SLIDES.length;
  const s = SLIDES[i];

  const done = useCallback(() => {
    writeJson(STORAGE_KEYS.onboardingSeen, true);
    nav.go('login');
  }, [nav]);

  const goTo = useCallback(
    (k: number) => {
      if (k < 0 || k >= n || k === iRef.current) return;
      iRef.current = k;
      setI(k);
      buzz();
      scroller.current?.scrollTo({ x: k * width, animated: true });
    },
    [n, width],
  );

  const runProgress = useCallback(
    (from = 0) => {
      progress.setValue(from);
      Animated.timing(progress, {
        toValue: 1,
        duration: SLIDE_MS * (1 - from),
        easing: Easing.linear,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished && iRef.current < n - 1) goTo(iRef.current + 1);
      });
    },
    [goTo, n, progress],
  );

  useEffect(() => {
    runProgress(0);
    Animated.timing(bg, {
      toValue: i,
      duration: 700,
      useNativeDriver: false,
    }).start();
    return () => progress.stopAnimation();
  }, [i, bg, progress, runProgress]);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const k = Math.round(e.nativeEvent.contentOffset.x / width);
    if (k !== iRef.current) {
      iRef.current = k;
      setI(k);
      buzz();
    } else runProgress(0);
  };

  const words = s.heading.split(' ');
  const backgroundColor = bg.interpolate({
    inputRange: [0, 1, 2],
    outputRange: SLIDES.map(x => x.bg),
  });
  return (
    <Animated.View style={[styles.root, { backgroundColor }]}>
      <StatusBar barStyle="dark-content" />
      <View
        pointerEvents="none"
        style={[
          styles.blobA,
          {
            experimental_backgroundImage: `radial-gradient(circle closest-side, ${s.blobA} 0%, ${s.blobA} 45%, transparent 100%)`,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.blobB,
          {
            experimental_backgroundImage: `radial-gradient(circle closest-side, ${s.blobB} 0%, ${s.blobB} 45%, transparent 100%)`,
          },
        ]}
      />

      <View style={[styles.topRow, { paddingTop: insets.top + 4 }]}>
        <View style={styles.bars}>
          {SLIDES.map((_, k) => (
            <Press
              key={k}
              pressScale={1}
              onPress={() => goTo(k)}
              style={styles.barTrack}
              accessibilityLabel={`Slide ${k + 1}`}
            >
              <Animated.View
                style={[
                  styles.barFill,
                  { backgroundColor: s.accent },
                  {
                    width:
                      k < i
                        ? '100%'
                        : k > i
                        ? '0%'
                        : progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          }),
                  },
                ]}
              />
            </Press>
          ))}
        </View>
        <Press onPress={done} style={styles.skip}>
          <T style={styles.skipText}>Skip</T>
        </Press>
      </View>

      <View style={styles.stage}>
        <ScrollView
          ref={scroller}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={() => progress.stopAnimation()}
          onMomentumScrollEnd={onMomentumEnd}
        >
          {SLIDES.map((_, k) => (
            <View key={k} style={[styles.page, { width }]}>
              <ObVisual idx={k} active={k === i} />
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={[styles.copy, { paddingBottom: 36 + insets.bottom }]}>
        <T style={[styles.counter, { color: s.accent }]}>
          {String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
        </T>
        <View style={styles.headingWrap}>
          {words.map((w, k) => (
            <Word key={`${i}-${k}`} w={w} k={k} slide={i} />
          ))}
        </View>
        <T key={`p${i}`} style={styles.desc}>
          {s.desc}
        </T>
        <View style={styles.ctaRow}>
          {i > 0 && (
            <Press
              onPress={() => goTo(i - 1)}
              accessibilityLabel="Previous"
              style={styles.prev}
            >
              <Icon name="arrow-left" size={20} />
            </Press>
          )}
          <Press
            onPress={() => (i < n - 1 ? goTo(i + 1) : done())}
            style={[
              styles.next,
              {
                backgroundColor: s.accent,
                boxShadow: `0 10px 24px -8px ${s.accent}`,
              },
            ]}
          >
            <Sheen />
            <T style={styles.nextText}>{i < n - 1 ? 'Next' : 'Get Started'}</T>
            <Icon
              name={i < n - 1 ? 'arrow-right' : 'rocket'}
              size={18}
              color="#FFFFFF"
            />
          </Press>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  blobA: {
    position: 'absolute',
    top: -80 - 64,
    right: -96 - 64,
    width: 320 + 128,
    height: 320 + 128,
  },
  blobB: {
    position: 'absolute',
    top: 288 - 64,
    left: -112 - 64,
    width: 288 + 128,
    height: 288 + 128,
  },
  topRow: { ...tw('relative z-20 px-5 flex items-center gap-3'), marginTop: 4 },
  bars: tw('flex-1 flex gap-1.5'),
  barTrack: {
    ...tw('flex-1 h-[5px] rounded-full overflow-hidden'),
    backgroundColor: 'rgba(15,23,42,0.1)',
  },
  barFill: tw('h-full rounded-full'),
  skip: {
    ...tw('px-3.5 py-1.5 rounded-full'),
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  skipText: { ...tw('text-[13px] font-bold'), color: '#0F172A' },
  stage: { flex: 1, minHeight: 0, justifyContent: 'center' },
  page: { height: 310, alignSelf: 'center' },
  visual: { height: 310, width: '100%' },
  fill: { width: '100%', height: '100%' },
  backCard: {
    ...tw('absolute top-[30px] w-[196px] h-[250px] overflow-hidden elev-2'),
    borderRadius: 26,
    left: '50%',
    marginLeft: -98,
  },
  frontCard: {
    ...tw('absolute top-[14px] w-[212px] h-[272px] overflow-hidden elev-3'),
    borderRadius: 28,
    left: '50%',
    marginLeft: -106,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  scanGrid: {
    experimental_backgroundImage:
      'linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)',
    experimental_backgroundSize: '22px 22px',
  },
  scanBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 64,
    experimental_backgroundImage:
      'linear-gradient(to bottom, transparent, rgba(167,139,250,.55), transparent)',
  },
  chipPos: { position: 'absolute', zIndex: 10 },
  chip: {
    ...tw('rounded-2xl elev-3 px-3 py-2.5 flex items-center gap-2.5'),
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  chipIcon: tw('w-8 h-8 rounded-xl items-center justify-center'),
  chipTitle: tw('text-[12px] font-extrabold text-ink-900'),
  chipSub: tw('text-[10px] text-ink-500'),
  chipPrice: twh('num text-[16px] font-extrabold text-brand-700'),
  chipMoney: twh('num text-[16px] font-extrabold text-ink-900'),
  chipRange: tw('num text-[13px] font-extrabold text-ink-900'),
  zeroPill: tw('bg-emerald-50 px-1.5 py-0.5 rounded-full'),
  zeroText: tw('text-[10px] font-bold text-emerald-600'),
  dots: tw('flex'),
  avatarDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  buyers: tw('text-[11px] font-bold text-ink-700'),
  match: tw('num text-[12px] font-extrabold text-violet-700'),
  matchTrack: tw('w-14 h-1.5 rounded-full bg-violet-100 overflow-hidden'),
  matchFill: { ...tw('h-full bg-violet-500 rounded-full'), width: '96%' },
  copy: tw('relative z-20 px-6'),
  counter: tw('text-[11px] font-extrabold uppercase tracking-[.14em] mb-2'),
  headingWrap: { minHeight: 66, flexDirection: 'row', flexWrap: 'wrap' },
  heading: twh('text-[30px] font-extrabold text-ink-900 leading-[1.08]'),
  desc: tw('text-[14px] leading-relaxed mt-3 min-h-[66px]'),
  ctaRow: tw('mt-5 flex items-center gap-3'),
  prev: tw(
    'w-[52px] h-[52px] rounded-full bg-white elev-1 items-center justify-center',
  ),
  next: tw(
    'relative flex-1 h-[52px] rounded-full flex items-center justify-center gap-2 overflow-hidden',
  ),
  nextText: tw('text-white font-bold text-[15px]'),
});
