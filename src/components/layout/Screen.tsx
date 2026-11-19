import React, { Children, createContext, isValidElement, useContext, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, elev } from '../../theme';
import { Icon } from '../icons/Icon';
import { RiseIn, WordReveal } from '../ui/Motion';
import { Press } from '../ui/Press';
import { T } from '../ui/T';
import { AmbientBackground } from './AmbientBackground';
import { JourneyRail } from './JourneyRail';

const ScrollStuck = createContext(false);
const ScreenDark = createContext(false);

const STAGGER = [10, 60, 110, 160, 210, 250];
const delayFor = (i: number) => (i < STAGGER.length ? STAGGER[i] : 290);

export interface TopBarProps {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
  sub?: React.ReactNode;
  dark?: boolean;
  large?: boolean;
}

/**
 * Large-title navigation. Place it as the first child of <Screen>: the compact
 * bar pins on scroll and the big title scrolls away underneath.
 */
export function TopBar(_props: TopBarProps): React.ReactElement | null {
  // Rendered by <Screen>, which splits it into a sticky bar and a title block.
  return null;
}

function TopBarSticky({ title, onBack, right, dark }: TopBarProps) {
  const stuck = useContext(ScrollStuck);
  const hasRow = !!(onBack || right);
  const fg = dark ? colors.white : colors.ink900;
  return (
    <View style={[styles.bar, { height: hasRow || stuck ? 48 : 8 }, stuck && (dark ? styles.barStuckDark : styles.barStuck)]}>
      {onBack ? (
        <Press onPress={onBack} accessibilityLabel="Back" style={[styles.back, !stuck && (dark ? styles.backDark : styles.backLight)]}>
          <Icon name="arrow-left" size={20} color={fg} />
        </Press>
      ) : null}
      <View style={[styles.barTitle, { opacity: stuck ? 1 : 0, transform: [{ translateY: stuck ? 0 : 6 }] }]}>
        <T display s={16} w={700} ls={-0.02} c={fg} truncate>{title}</T>
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

function TopBarTitle({ title, sub, dark, large }: TopBarProps) {
  const stuck = useContext(ScrollStuck);
  const size = large ? 30 : 26;
  return (
    <View style={[styles.titleBlock, { opacity: stuck ? 0 : 1 }]}>
      <WordReveal text={title} style={titleStyle(size, dark)} />
      {sub ? (
        <RiseIn delay={150} duration={500}>
          <T s={12.5} c={dark ? 'rgba(255,255,255,0.7)' : colors.ink500} style={styles.sub}>{sub}</T>
        </RiseIn>
      ) : null}
    </View>
  );
}

/** Keep flex-1 spacers working when a child is wrapped for its entrance animation. */
export function passFlex(child: React.ReactElement): ViewStyle | undefined {
  const st = StyleSheet.flatten((child.props as { style?: StyleProp<ViewStyle> }).style);
  if (st && (st.flex || st.flexGrow)) return { flex: st.flex, flexGrow: st.flexGrow };
  return undefined;
}

const titleCache = new Map<string, object>();
function titleStyle(size: number, dark?: boolean) {
  const k = `${size}${dark ? 'd' : ''}`;
  if (!titleCache.has(k)) {
    titleCache.set(k, {
      fontFamily: 'BricolageGrotesque-ExtraBold',
      fontSize: size,
      lineHeight: size * 1.1,
      letterSpacing: size * -0.035,
      color: dark ? colors.white : colors.ink900,
      includeFontPadding: false,
    });
  }
  return titleCache.get(k) as object;
}

export interface ScreenProps {
  children?: React.ReactNode;
  dark?: boolean;
  /** pb-24 instead of pb-28. */
  padBottom?: boolean;
  /** Column layout that fills the height (flex flex-col pb-6). */
  fill?: boolean;
  /** No status-bar spacer: content runs under the status bar. */
  bleed?: boolean;
  /** Fixed elements pinned to the screen (bottom bars, bottom nav, toasts, sheets). */
  footer?: React.ReactNode;
  /** Solid background instead of the ambient flow tint. */
  background?: string;
  contentStyle?: StyleProp<ViewStyle>;
  scrollEnabled?: boolean;
  /** Scroll offset listener (status strips, parallax). */
  onScrollY?: (y: number) => void;
}

/** Scrolling screen shell (the design's Screen + legacy-screen). */
export function Screen({ children, dark, padBottom, fill, bleed, footer, background, contentStyle, scrollEnabled = true, onScrollY }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const [stuck, setStuck] = useState(false);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    onScrollY?.(y);
    const st = y > 40;
    if (st !== stuck) setStuck(st);
  };

  const { items, sticky } = useMemo(() => {
    const out: React.ReactNode[] = [];
    const stickyIdx: number[] = [];
    let n = 0;
    Children.forEach(children, child => {
      if (!isValidElement(child)) { if (child != null && child !== false) out.push(child); return; }
      if (child.type === TopBar) {
        const p = child.props as TopBarProps;
        stickyIdx.push(out.length);
        out.push(<TopBarSticky key="tb-bar" {...p} />);
        out.push(<RiseIn key="tb-title" delay={delayFor(n++)}><TopBarTitle {...p} /></RiseIn>);
        out.push(<RiseIn key="tb-rail" delay={delayFor(n++)}><JourneyRail dark={p.dark} /></RiseIn>);
        return;
      }
      out.push(<RiseIn key={child.key ?? `c${out.length}`} delay={delayFor(n++)} style={passFlex(child)}>{child}</RiseIn>);
    });
    return { items: out, sticky: stickyIdx };
  }, [children]);

  const bottomPad = (fill ? 24 : padBottom ? 96 : 112) + insets.bottom;
  return (
    <ScreenDark.Provider value={!!dark}>
      <ScrollStuck.Provider value={stuck}>
        <View style={[styles.root, dark ? styles.dark : background ? { backgroundColor: background } : null]}>
          {!dark && !background && <AmbientBackground />}
          {!bleed && <View style={{ height: insets.top }} />}
          <ScrollView
            style={styles.scroll}
            scrollEnabled={scrollEnabled}
            contentContainerStyle={[fill ? styles.fill : null, { paddingBottom: bottomPad }, contentStyle]}
            stickyHeaderIndices={sticky}
            onScroll={onScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {items}
          </ScrollView>
          {footer}
        </View>
      </ScrollStuck.Provider>
    </ScreenDark.Provider>
  );
}

/**
 * Bottom action bar pinned inside a <Screen> footer: frosted white, 22px top
 * corners and a soft upward shadow (the design's legacy-screen bottom bar).
 */
export function BottomBar({ children, style }: { children?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.bottomBar, { paddingBottom: 16 + insets.bottom }, style]}>{children}</View>;
}

export function useScreenStuck() {
  return useContext(ScrollStuck);
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.white, overflow: 'hidden' },
  dark: { backgroundColor: colors.ink900 },
  scroll: { flex: 1 },
  fill: { flexGrow: 1 },
  bar: { paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderBottomColor: 'transparent', zIndex: 20 },
  barStuck: { backgroundColor: 'rgba(255,255,255,0.88)', borderBottomColor: 'rgba(226,232,240,0.7)', boxShadow: '0 6px 18px -12px rgba(15,23,42,0.25)' },
  barStuckDark: { backgroundColor: 'rgba(15,23,42,0.85)', borderBottomColor: 'rgba(255,255,255,0.1)' },
  back: { width: 40, height: 40, borderRadius: 9999, alignItems: 'center', justifyContent: 'center' },
  backLight: { backgroundColor: 'rgba(255,255,255,0.8)', boxShadow: elev.e1 },
  backDark: { backgroundColor: 'rgba(255,255,255,0.1)' },
  barTitle: { flex: 1, minWidth: 0 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  titleBlock: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12 },
  sub: { marginTop: 4 },
  bottomBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: 16, paddingTop: 16,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 1, borderTopColor: 'rgba(226,232,240,0.8)',
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    boxShadow: '0 -8px 28px -12px rgba(15,23,42,0.22)',
  },
});
