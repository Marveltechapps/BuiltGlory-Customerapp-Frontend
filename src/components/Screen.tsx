import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNav, useScreen } from '../navigation/NavContext';
import type { Flow, ScreenName } from '../navigation/types';
import { palette, tw, twh } from '../theme';
import { Icon } from './Icon';
import { Rise, WordReveal } from './Motion';
import { Press } from './Press';
import { Spin } from './Motion';
import { T } from './T';

const TINTS: Record<Flow, { tint: string; blobA: string; blobB: string }> = {
  home: { tint: '#EEF4FF', blobA: '#BFD6FF', blobB: '#D9E6FF' },
  buy: { tint: '#EEF4FF', blobA: '#C3D8FF', blobB: '#DCE8FF' },
  sell: { tint: '#EAFBF3', blobA: '#B4F0D3', blobB: '#D5F7E6' },
  account: { tint: '#F3F0FF', blobA: '#D6CCFF', blobB: '#E7E1FF' },
};

function Blob({
  color,
  size,
  style,
  duration,
  reverse,
  delay = 0,
  opacity = 1,
}: {
  color: string;
  size: number;
  style: ViewStyle;
  duration: number;
  reverse?: boolean;
  delay?: number;
  opacity?: number;
}) {
  const v = useRef(new Animated.Value(reverse ? 1 : 0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, {
          toValue: reverse ? 0 : 1,
          duration: duration / 2,
          delay,
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
  }, [v, duration, reverse, delay]);
  // A blurred 300px circle ≈ a radial gradient with a soft 56px falloff.
  const box = size + 112;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        style,
        {
          width: box,
          height: box,
          opacity,
          experimental_backgroundImage: `radial-gradient(circle closest-side, ${color} 0%, ${color} 50%, transparent 100%)`,
          transform: [
            {
              translateX: v.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -20],
              }),
            },
            {
              translateY: v.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 24],
              }),
            },
            {
              scale: v.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.15],
              }),
            },
          ],
        },
      ]}
    />
  );
}

/** Flow-tinted backdrop with two drifting blobs (`[data-flow] > .absolute.inset-0:first-child`). */
export function FlowTint({ flow }: { flow: Flow }) {
  const t = TINTS[flow];
  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        styles.tintWrap,
        {
          experimental_backgroundImage: `linear-gradient(180deg, ${t.tint} 0px, ${t.tint} 120px, #FFFFFF 460px)`,
        },
      ]}
    >
      <Blob
        color={t.blobA}
        size={300}
        style={{ position: 'absolute', top: -146, right: -156 }}
        duration={9000}
      />
      <Blob
        color={t.blobB}
        size={260}
        style={{ position: 'absolute', top: 154, left: -186 }}
        duration={11000}
        delay={1500}
        reverse
        opacity={0.7}
      />
    </View>
  );
}

const JOURNEYS: Record<
  'buy' | 'sell',
  { label: string; steps: Array<[ScreenName, string]> }
> = {
  buy: {
    label: 'Buying journey',
    steps: [
      ['enquiry', 'Enquiry'],
      ['visitCalendar', 'Visit'],
      ['visitConfirmation', 'Confirmed'],
      ['documentsShared', 'Documents'],
      ['payment', 'Payment'],
      ['registrationDetails', 'Registration'],
    ],
  },
  sell: {
    label: 'Selling journey',
    steps: [
      ['verificationStatus', 'Verification'],
      ['offer', 'Offer'],
      ['acceptNegotiate', 'Negotiate'],
      ['dealConfirmed', 'Deal'],
      ['paymentSchedule', 'Payment'],
      ['sellRegistration', 'Registration'],
      ['dealComplete', 'Sold'],
    ],
  },
};
const JOURNEY_ALIAS: Partial<Record<ScreenName, ScreenName>> = {
  rescheduleVisit: 'visitCalendar',
  nriVideoCall: 'visitCalendar',
  paymentFailure: 'payment',
  reupload: 'verificationStatus',
};

/** Step rail shown under the title on journey screens (`JourneyRail`). Done steps pop back to that step. */
export function JourneyRail({ dark }: { dark?: boolean }) {
  const { name } = useScreen();
  const nav = useNav();
  const scrollRef = useRef<ScrollView>(null);
  const key = JOURNEY_ALIAS[name] ?? name;
  const journey = Object.values(JOURNEYS).find(j =>
    j.steps.some(([s]) => s === key),
  );
  const idx = journey ? journey.steps.findIndex(([s]) => s === key) : -1;
  if (!journey) return null;
  return (
    <View style={styles.railWrap}>
      <T
        style={[
          styles.railLabel,
          { color: dark ? 'rgba(255,255,255,0.5)' : palette.ink[400] },
        ]}
      >
        {journey.label} ·{' '}
        <T
          style={[
            styles.railLabel,
            styles.num,
            { color: dark ? 'rgba(255,255,255,0.5)' : palette.ink[400] },
          ]}
        >
          {idx + 1}/{journey.steps.length}
        </T>
      </T>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.railRow}
        onContentSizeChange={w =>
          scrollRef.current?.scrollTo({
            x: Math.max(0, (w / journey.steps.length) * idx - 120),
            animated: true,
          })
        }
      >
        {journey.steps.map(([sk, label], n) => {
          const done = n < idx;
          const now = n === idx;
          const reachable = done && nav.stack.includes(sk);
          return (
            <React.Fragment key={sk}>
              <Press
                disabled={!reachable}
                haptic
                onPress={() =>
                  reachable && nav.popTo(sk as any, undefined as any)
                }
                style={[
                  styles.step,
                  now
                    ? styles.stepNow
                    : done
                    ? styles.stepDone
                    : dark
                    ? styles.stepDark
                    : styles.stepFuture,
                ]}
              >
                <View
                  style={[
                    styles.stepNum,
                    now
                      ? styles.stepNumNow
                      : done
                      ? styles.stepNumDone
                      : dark
                      ? styles.stepNumDark
                      : styles.stepNumFuture,
                  ]}
                >
                  {done ? (
                    <Icon
                      name="check"
                      size={12}
                      color="#FFFFFF"
                      strokeWidth={3}
                    />
                  ) : (
                    <T
                      style={[
                        styles.stepNumText,
                        {
                          color: now
                            ? '#FFFFFF'
                            : dark
                            ? 'rgba(255,255,255,0.4)'
                            : palette.ink[400],
                        },
                      ]}
                    >
                      {n + 1}
                    </T>
                  )}
                </View>
                <T
                  style={[
                    styles.stepText,
                    {
                      color: now
                        ? '#FFFFFF'
                        : done
                        ? palette.emerald[700]
                        : dark
                        ? 'rgba(255,255,255,0.4)'
                        : palette.ink[400],
                    },
                  ]}
                >
                  {label}
                </T>
              </Press>
              {n < journey.steps.length - 1 && (
                <View
                  style={[
                    styles.connector,
                    {
                      backgroundColor: done
                        ? palette.emerald[300]
                        : dark
                        ? 'rgba(255,255,255,0.1)'
                        : palette.ink[200],
                    },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </ScrollView>
    </View>
  );
}

export interface TopBarConfig {
  title: string;
  sub?: string;
  /** Show the back button (defaults to the navigator's back). */
  back?: boolean | (() => void);
  right?: React.ReactNode;
  large?: boolean;
}

interface ScreenProps {
  children?: React.ReactNode;
  topBar?: TopBarConfig;
  dark?: boolean;
  /** pb-24 instead of pb-28 (screens with a bottom nav). */
  padBottom?: boolean;
  /** Content fills the screen (centered status pages). */
  fill?: boolean;
  /** Content draws under the status bar (Home hero). */
  bleed?: boolean;
  /** Absolutely positioned bottom bar (use <ScreenFooter>). */
  footer?: React.ReactNode;
  /** Bottom navigation or other overlay chrome rendered above the content. */
  overlay?: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** Disable the flow tint (screens whose root sets an inline background in the reference). */
  noTint?: boolean;
  /** Extra bottom padding when a footer is shown (defaults to 96). */
  footerSpace?: number;
}

/** Standard screen shell (`Screen` + `TopBar` in the reference). */
export function Screen({
  children,
  topBar,
  dark,
  padBottom,
  fill,
  bleed,
  footer,
  overlay,
  refreshing,
  onRefresh,
  onEndReached,
  scroll = true,
  contentStyle,
  noTint,
  footerSpace,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { flow, firstVisit } = useScreen();
  const nav = useNav();
  const [stuck, setStuck] = useState(false);
  const stuckRef = useRef(false);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    const next = contentOffset.y > 40;
    if (next !== stuckRef.current) {
      stuckRef.current = next;
      setStuck(next);
    }
    if (
      onEndReached &&
      contentOffset.y + layoutMeasurement.height > contentSize.height - 400
    )
      onEndReached();
  };

  const items = React.Children.toArray(children).filter(Boolean);
  const body = items.map((child, i) => (
    <Rise
      key={(child as any).key ?? i}
      delay={10 + Math.min(i, 6) * 50}
      disabled={!firstVisit}
      style={fill && i === items.length - 1 ? { flexGrow: 1 } : undefined}
    >
      {child}
    </Rise>
  ));
  const bottomPad =
    (fill ? 24 : footer ? footerSpace ?? 96 : padBottom ? 96 : 112) +
    insets.bottom;
  const onBack = topBar?.back
    ? typeof topBar.back === 'function'
      ? topBar.back
      : nav.back
    : undefined;
  const hasRow = Boolean(onBack || topBar?.right);
  const fg = dark ? '#FFFFFF' : palette.ink[900];

  // ScrollView moves a sticky header's own style onto its wrapper (and gives the child flex: 1), so the
  // styled bar sits inside an unstyled sticky container.
  const compactBar = topBar ? (
    <View key="compact">
      <View
        style={[
          styles.bar,
          { height: hasRow || stuck ? 48 : 8 },
          stuck && (dark ? styles.barStuckDark : styles.barStuck),
        ]}
      >
        {onBack && (
          <Press
            onPress={onBack}
            accessibilityLabel="Back"
            style={[
              styles.backBtn,
              !stuck && (dark ? styles.backDark : styles.backLight),
            ]}
          >
            <Icon name="arrow-left" size={20} color={fg} />
          </Press>
        )}
        <View style={styles.compactTitleWrap}>
          {stuck && (
            <T style={[styles.compactTitle, { color: fg }]} numberOfLines={1}>
              {topBar.title}
            </T>
          )}
        </View>
        {topBar.right ? <View style={styles.right}>{topBar.right}</View> : null}
      </View>
    </View>
  ) : null;

  const header = topBar
    ? [
        compactBar,
        <View
          key="title"
          style={[styles.titleBlock, { opacity: stuck ? 0 : 1 }]}
        >
          <WordReveal
            text={topBar.title}
            disabled={!firstVisit}
            style={[
              topBar.large ? styles.titleLarge : styles.title,
              { color: fg },
            ]}
          />
          {topBar.sub ? (
            <T style={[styles.sub, dark && { color: 'rgba(255,255,255,0.7)' }]}>
              {topBar.sub}
            </T>
          ) : null}
        </View>,
        <JourneyRail key="rail" dark={dark} />,
      ]
    : [];

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: dark ? palette.ink[900] : '#FFFFFF' },
      ]}
    >
      <StatusBar barStyle={dark || bleed ? 'light-content' : 'dark-content'} />
      {!dark && !noTint && <FlowTint flow={flow} />}
      {!bleed && <View style={{ height: insets.top }} />}
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            fill && styles.fillContent,
            { paddingBottom: bottomPad },
            contentStyle,
          ]}
          stickyHeaderIndices={topBar ? [0] : undefined}
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                tintColor="#1A6FFF"
                colors={['#1A6FFF']}
              />
            ) : undefined
          }
        >
          {header}
          {body}
        </ScrollView>
      ) : (
        <View style={[styles.flex, contentStyle]}>
          {header}
          {body}
        </View>
      )}
      {footer}
      {overlay}
    </View>
  );
}

/** Docked bottom action bar used by form/journey screens (with the reference's legacy overrides). */
export function ScreenFooter({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.footer, { paddingBottom: 16 + insets.bottom }, style]}>
      {children}
    </View>
  );
}

type SolidTone = 'brand' | 'emerald' | 'rose' | 'neutral' | 'blue';
const SOLID: Record<SolidTone, { bg: string; fg: string }> = {
  brand: { bg: palette.brand[600], fg: '#FFFFFF' },
  emerald: { bg: palette.emerald[600], fg: '#FFFFFF' },
  rose: { bg: palette.rose[600], fg: '#FFFFFF' },
  neutral: { bg: palette.ink[100], fg: palette.ink[700] },
  blue: { bg: palette.blue[600], fg: '#FFFFFF' },
};

/**
 * Full-width 48px button used throughout the reference (`w-full h-12 rounded-xl font-semibold`).
 * `pill` applies when the button sits in a docked footer.
 */
export function SolidButton({
  label,
  onPress,
  disabled,
  loading,
  loadingLabel,
  tone = 'brand',
  pill,
  icon,
  style,
  disabledStyle = 'muted',
  height = 48,
}: {
  label: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  tone?: SolidTone;
  pill?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** `muted`: ink-100 / ink-400 (default); `faded`: lighter tone (rose-200). */
  disabledStyle?: 'muted' | 'faded';
  height?: number;
}) {
  const c = SOLID[tone];
  const off = disabled && !loading;
  const bg = off
    ? disabledStyle === 'faded'
      ? palette.rose[200]
      : palette.ink[100]
    : c.bg;
  const fg = off
    ? disabledStyle === 'faded'
      ? '#FFFFFF'
      : palette.ink[400]
    : c.fg;
  return (
    <Press
      onPress={onPress}
      disabled={disabled || loading}
      pressScale={1}
      haptic
      pressedStyle={!off ? { opacity: 0.88 } : undefined}
      style={[
        styles.solid,
        { height, backgroundColor: bg, borderRadius: pill ? 9999 : 12 },
        style,
      ]}
    >
      {loading ? (
        <Spin duration={800}>
          <Icon name="loader-2" size={18} color={fg} />
        </Spin>
      ) : (
        icon
      )}
      {typeof label === 'string' ? (
        <T style={[styles.solidText, { color: fg }]}>
          {loading && loadingLabel ? loadingLabel : label}
        </T>
      ) : (
        label
      )}
    </Press>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fillContent: { flexGrow: 1 },
  tintWrap: { overflow: 'hidden' },
  bar: {
    ...tw('px-3 flex items-center gap-2 z-20'),
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  barStuck: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderBottomColor: 'rgba(226,232,240,0.7)',
    boxShadow: '0 6px 18px -12px rgba(15,23,42,.25)',
  },
  barStuckDark: {
    backgroundColor: 'rgba(15,23,42,0.95)',
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backBtn: tw('w-10 h-10 rounded-full items-center justify-center'),
  backLight: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    boxShadow: '0 1px 2px rgba(15,23,42,.05), 0 1px 3px rgba(15,23,42,.04)',
  },
  backDark: { backgroundColor: 'rgba(255,255,255,0.1)' },
  compactTitleWrap: tw('flex-1 min-w-0'),
  compactTitle: twh('text-[16px] font-bold'),
  right: tw('flex items-center gap-1.5 shrink-0'),
  titleBlock: tw('px-4 pt-1 pb-3'),
  title: twh('text-[26px] font-extrabold leading-[1.1]'),
  titleLarge: twh('text-[30px] font-extrabold leading-[1.1]'),
  sub: tw('text-[12.5px] mt-1 text-ink-500'),
  railWrap: tw('px-4 pb-3'),
  railLabel: tw('text-[10px] font-extrabold uppercase tracking-[.12em] mb-1.5'),
  num: { fontVariant: ['tabular-nums'] },
  railRow: tw('flex items-center gap-1'),
  step: tw('flex items-center gap-1.5 h-8 pl-1 pr-3 rounded-full'),
  stepNow: {
    experimental_backgroundImage: 'linear-gradient(135deg, #3B86FF, #1A6FFF)',
    boxShadow: '0 6px 14px -6px rgba(26,111,255,.7)',
  },
  stepDone: {
    backgroundColor: palette.emerald[50],
    boxShadow: `0 0 0 1px ${palette.emerald[200]}`,
  },
  stepFuture: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    boxShadow: `0 0 0 1px ${palette.ink[200]}`,
  },
  stepDark: { backgroundColor: 'rgba(255,255,255,0.05)' },
  stepNum: tw('w-6 h-6 rounded-full items-center justify-center'),
  stepNumNow: { backgroundColor: 'rgba(255,255,255,0.25)' },
  stepNumDone: tw('bg-emerald-500'),
  stepNumFuture: tw('bg-ink-100'),
  stepNumDark: { backgroundColor: 'rgba(255,255,255,0.1)' },
  stepNumText: tw('num text-[10px]'),
  stepText: tw('text-[11.5px] font-bold'),
  connector: { width: 12, height: 2, borderRadius: 9999 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226,232,240,0.8)',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    boxShadow: '0 -8px 28px -12px rgba(15,23,42,.22)',
    zIndex: 30,
  },
  solid: tw('w-full flex items-center justify-center gap-2'),
  solidText: tw('text-[15px] font-semibold'),
});
