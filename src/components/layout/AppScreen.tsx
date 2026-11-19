import React, { Children, isValidElement, useRef, useState } from 'react';
import { Animated, RefreshControl, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TabId } from '../../navigation/types';
import { colors, elev } from '../../theme';
import { Icon } from '../icons/Icon';
import { RiseIn, WordReveal } from '../ui/Motion';
import { buzz, Press } from '../ui/Press';
import { ProgressBar } from '../ui/Progress';
import { T } from '../ui/T';
import { AmbientBackground } from './AmbientBackground';
import { BottomNav, NAV_HEIGHT } from './BottomNav';
import { passFlex } from './Screen';

const STAGGER = [10, 60, 110, 160, 210, 250];
const delayFor = (i: number) => (i < STAGGER.length ? STAGGER[i] : 290);

/** Children of a screen body, each rising in with a staggered delay. */
export function ScreenBody({ children, style }: { children?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  let n = 0;
  return (
    <View style={style}>
      {Children.map(children, c => (isValidElement(c) ? <RiseIn delay={delayFor(n++)} style={passFlex(c)}>{c}</RiseIn> : c))}
    </View>
  );
}

// ─── Docked action bar ───────────────────────────────────────
export function DockBar({ children, summary, raised, onHeight, legacy }: {
  children?: React.ReactNode; summary?: React.ReactNode; raised?: boolean; onHeight?: (h: number) => void;
  /** Inside a <Screen>: the design rounds bottom bars there with 22px top corners. */
  legacy?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      onLayout={e => onHeight?.(e.nativeEvent.layout.height)}
      style={[styles.dock, legacy && styles.dockLegacy, raised ? { bottom: NAV_HEIGHT + insets.bottom } : { bottom: 0, paddingBottom: 16 + insets.bottom }]}>
      {summary ? <View style={styles.dockSummary}>{summary}</View> : null}
      <View style={styles.dockRow}>
        {Children.map(children, c => (isValidElement(c) ? <View style={styles.dockItem}>{c}</View> : c))}
      </View>
    </View>
  );
}

/** Round icon button used in screen header bars. */
export function HeaderButton({ icon, onPress, label, color = colors.ink900 }: { icon: string; onPress?: () => void; label?: string; color?: string }) {
  return (
    <Press onPress={onPress} accessibilityLabel={label ?? icon} style={styles.hbtn}>
      <Icon name={icon} size={20} color={color} />
    </Press>
  );
}

export interface AppScreenProps {
  title: string;
  sub?: React.ReactNode;
  onBack?: () => void;
  right?: React.ReactNode;
  /** Sticky sub-header (search, filters, segmented control). */
  sticky?: React.ReactNode;
  children?: React.ReactNode;
  dock?: React.ReactNode;
  nav?: TabId;
  onNav?: (t: TabId) => void;
  /** Overlays inside the screen (sheets, toasts). */
  overlay?: React.ReactNode;
  /** Pull to refresh — awaits onRefresh when provided (no fake delay). */
  onRefresh?: () => void | Promise<void>;
}

/** Collapsing large title + sticky slot + dock (the design's AppScreen). */
export function AppScreen({ title, sub, onBack, right, sticky, children, dock, nav, onNav, overlay, onRefresh }: AppScreenProps) {
  const insets = useSafeAreaInsets();
  const y = useRef(new Animated.Value(0)).current;
  const [dockH, setDockH] = useState(0);
  const [stuck, setStuck] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const refresh = async () => {
    if (refreshing || !onRefresh) return;
    setRefreshing(true);
    buzz(12);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };
  const p = y.interpolate({ inputRange: [0, 46], outputRange: [0, 1], extrapolate: 'clamp' });
  const padBottom = (nav ? NAV_HEIGHT + insets.bottom : 0) + (dock ? dockH : 0) + 24;
  return (
    <View style={styles.root}>
      <AmbientBackground />
      <View style={{ height: insets.top }} />
      <View style={styles.header}>
        <Animated.View pointerEvents={stuck ? 'auto' : 'none'} style={[styles.compact, { opacity: p }]}>
          {onBack ? <HeaderButton icon="arrow-left" onPress={onBack} label="Back" /> : null}
          <T display s={15} w={700} ls={-0.02} truncate style={styles.flex1}>{title}</T>
          {right}
        </Animated.View>
        <Animated.View pointerEvents={stuck ? 'none' : 'auto'} style={[styles.headRow, { opacity: Animated.subtract(1, p) }]}>
          {onBack ? <HeaderButton icon="arrow-left" onPress={onBack} label="Back" /> : null}
          <View style={styles.flex1} />
          {right}
        </Animated.View>
      </View>
      <Animated.ScrollView
        style={styles.flex1}
        contentContainerStyle={{ paddingBottom: padBottom }}
        stickyHeaderIndices={sticky ? [1] : undefined}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={() => { void refresh(); }} colors={[colors.brand600]} tintColor={colors.brand600} /> : undefined}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y } } }], {
          useNativeDriver: false,
          listener: (e: { nativeEvent: { contentOffset: { y: number } } }) => {
            const s = e.nativeEvent.contentOffset.y / 46 > 0.6;
            if (s !== stuck) setStuck(s);
          },
        })}>
        <Animated.View style={[styles.titleWrap, {
          opacity: Animated.subtract(1, p),
          height: p.interpolate({ inputRange: [0, 1], outputRange: [62, 0] }),
          transform: [{ translateY: Animated.multiply(y, -0.18) }],
        }]}>
          <WordReveal text={title} style={styles.title} />
          {sub ? <T s={12.5} c={colors.ink500} style={styles.mt4}>{sub}</T> : null}
        </Animated.View>
        {sticky ? <StickyBar stuck={stuck}>{sticky}</StickyBar> : null}
        <ScreenBody style={styles.body}>{children}</ScreenBody>
      </Animated.ScrollView>
      {dock ? <DockBar raised={!!nav} onHeight={setDockH}>{dock}</DockBar> : null}
      {nav && onNav ? <BottomNav active={nav} onNav={onNav} /> : null}
      {overlay}
    </View>
  );
}

export function StickyBar({ children, stuck }: { children?: React.ReactNode; stuck?: boolean }) {
  return <View style={[styles.sticky, stuck && styles.stickyStuck]}>{children}</View>;
}

export interface DetailScreenProps {
  hero: React.ReactNode;
  heroHeight?: number;
  children?: React.ReactNode;
  dock?: React.ReactNode;
  dockSummary?: React.ReactNode;
  onBack?: () => void;
  right?: React.ReactNode;
  title: string;
  overlay?: React.ReactNode;
}

/** Full-bleed parallax hero with an overlapping white sheet (the design's DetailScreen). */
export function DetailScreen({ hero, heroHeight = 280, children, dock, dockSummary, onBack, right, title, overlay }: DetailScreenProps) {
  const insets = useSafeAreaInsets();
  const y = useRef(new Animated.Value(0)).current;
  const [dockH, setDockH] = useState(112);
  const [stuck, setStuck] = useState(false);
  const start = heroHeight * 0.45;
  const p = y.interpolate({ inputRange: [start, start + 70], outputRange: [0, 1], extrapolate: 'clamp' });
  return (
    <View style={styles.root}>
      <AmbientBackground />
      <View style={{ height: insets.top }} />
      <Animated.View pointerEvents={stuck ? 'auto' : 'none'} style={[styles.detailBar, { top: insets.top, opacity: p }]}>
        {onBack ? <HeaderButton icon="arrow-left" onPress={onBack} label="Back" /> : null}
        <T display s={15} w={700} ls={-0.02} truncate style={styles.flex1}>{title}</T>
        {right}
      </Animated.View>
      <Animated.ScrollView
        style={styles.flex1}
        contentContainerStyle={{ paddingBottom: dock ? dockH + 16 : 24 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y } } }], {
          useNativeDriver: false,
          listener: (e: { nativeEvent: { contentOffset: { y: number } } }) => {
            const s = (e.nativeEvent.contentOffset.y - start) / 70 > 0.6;
            if (s !== stuck) setStuck(s);
          },
        })}>
        <View style={[styles.heroClip, { height: heroHeight }]}>
          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: y.interpolate({ inputRange: [0, 1000], outputRange: [0, 340], extrapolateLeft: 'clamp' }) }] }]}>
            {hero}
          </Animated.View>
        </View>
        <View style={styles.sheet}>
          <View style={styles.grip} />
          <ScreenBody>{children}</ScreenBody>
        </View>
      </Animated.ScrollView>
      {dock ? <DockBar summary={dockSummary} onHeight={setDockH}>{dock}</DockBar> : null}
      {overlay}
    </View>
  );
}

export interface FormScreenProps {
  step?: number;
  totalSteps?: number;
  title: string;
  sub?: React.ReactNode;
  onBack?: () => void;
  children?: React.ReactNode;
  dock?: React.ReactNode;
  error?: React.ReactNode;
  overlay?: React.ReactNode;
}

/** Stepper header + grouped fields + dock (the design's FormScreen). */
export function FormScreen({ step, totalSteps, title, sub, onBack, children, dock, error, overlay }: FormScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <AmbientBackground />
      <View style={{ height: insets.top }} />
      <View style={styles.formHead}>
        <View style={styles.formTop}>
          {onBack ? <HeaderButton icon="arrow-left" onPress={onBack} label="Back" /> : null}
          {totalSteps ? <View style={styles.flex1}><ProgressBar value={((step ?? 0) / totalSteps) * 100} /></View> : null}
          {totalSteps ? <T num s={11} w={700} c={colors.ink500}>{step}/{totalSteps}</T> : null}
        </View>
        <WordReveal text={title} style={styles.formTitle} />
        {sub ? <T s={12.5} c={colors.ink500} style={styles.mt4}>{sub}</T> : null}
      </View>
      <Animated.ScrollView
        style={styles.flex1}
        contentContainerStyle={[styles.formBody, { paddingBottom: 112 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <ScreenBody style={styles.formStack}>
          {error ? (
            <View style={styles.error}>
              <Icon name="triangle-alert" size={14} color="#E11D48" style={styles.errorIcon} />
              <T s={12} w={500} c={colors.rose700} style={styles.flex1}>{error}</T>
            </View>
          ) : null}
          {children}
        </ScreenBody>
      </Animated.ScrollView>
      {dock ? <DockBar>{dock}</DockBar> : null}
      {overlay}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.white, overflow: 'hidden' },
  flex1: { flex: 1, minWidth: 0 },
  mt4: { marginTop: 4 },
  header: { zIndex: 30 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, height: 48 },
  compact: {
    position: 'absolute', left: 0, right: 0, top: 0, height: 48, zIndex: 2,
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.94)', borderBottomWidth: 1, borderBottomColor: 'rgba(226,232,240,0.7)',
  },
  hbtn: { width: 36, height: 36, borderRadius: 9999, alignItems: 'center', justifyContent: 'center' },
  titleWrap: { paddingHorizontal: 16, overflow: 'hidden' },
  title: { fontFamily: 'BricolageGrotesque-ExtraBold', fontSize: 28, lineHeight: 28 * 1.12, letterSpacing: 28 * -0.035, color: colors.ink900, includeFontPadding: false },
  sticky: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'transparent', zIndex: 20 },
  stickyStuck: { backgroundColor: 'rgba(255,255,255,0.94)', borderBottomColor: 'rgba(226,232,240,0.7)' },
  body: { paddingTop: 4 },
  dock: {
    position: 'absolute', left: 0, right: 0, zIndex: 30,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 1, borderTopColor: 'rgba(226,232,240,0.7)',
    boxShadow: '0 -8px 28px -12px rgba(15,23,42,0.22)',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16,
  },
  dockLegacy: { borderTopLeftRadius: 22, borderTopRightRadius: 22, borderTopColor: 'rgba(226,232,240,0.8)' },
  dockSummary: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 },
  dockRow: { flexDirection: 'row', gap: 10 },
  dockItem: { flex: 1 },
  detailBar: {
    position: 'absolute', left: 0, right: 0, height: 48, zIndex: 30,
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.94)', borderBottomWidth: 1, borderBottomColor: 'rgba(226,232,240,0.7)',
  },
  heroClip: { overflow: 'hidden' },
  sheet: { marginTop: 0, borderTopLeftRadius: 22, borderTopRightRadius: 22, backgroundColor: colors.white, paddingTop: 16, zIndex: 10, boxShadow: elev.e3 },
  grip: { width: 36, height: 4, borderRadius: 9999, backgroundColor: colors.ink200, alignSelf: 'center', marginBottom: 12 },
  formHead: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12 },
  formTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: -8, marginBottom: 8 },
  formTitle: { fontFamily: 'BricolageGrotesque-ExtraBold', fontSize: 24, lineHeight: 30, letterSpacing: 24 * -0.035, color: colors.ink900, includeFontPadding: false },
  formBody: { paddingHorizontal: 16, paddingTop: 16 },
  formStack: { gap: 14 },
  error: { borderRadius: 14, backgroundColor: colors.rose50, boxShadow: `0 0 0 1px ${colors.rose200}`, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  errorIcon: { marginTop: 1 },
});
