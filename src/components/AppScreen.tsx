import React, { useRef, useState } from 'react';
import {
  Animated,
  RefreshControl,
  StatusBar,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNav, useScreen } from '../navigation/NavContext';
import { tw, twh } from '../theme';
import { BottomNav, type NavTab } from './BottomNav';
import { Icon } from './Icon';
import { Rise } from './Motion';
import { Press } from './Press';
import { FlowTint } from './Screen';
import { T } from './T';

/** Docked primary actions (`DockBar`): equal-width children, optional summary row above. */
export function DockBar({
  children,
  summary,
  raised,
  onHeight,
}: {
  children: React.ReactNode;
  summary?: React.ReactNode;
  raised?: boolean;
  onHeight?: (h: number) => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      onLayout={e => onHeight?.(e.nativeEvent.layout.height)}
      style={[
        styles.dock,
        raised
          ? { bottom: 64 + insets.bottom }
          : { bottom: 0, paddingBottom: 16 + insets.bottom },
      ]}
    >
      {summary ? <View style={styles.dockSummary}>{summary}</View> : null}
      <View style={styles.dockRow}>
        {React.Children.toArray(children).map((c, i) => (
          <View key={i} style={styles.dockCell}>
            {c}
          </View>
        ))}
      </View>
    </View>
  );
}

interface AppScreenProps {
  title: string;
  sub?: string;
  back?: boolean;
  right?: React.ReactNode;
  /** Sticky sub-header (search, filters, segmented control). */
  sticky?: React.ReactNode;
  dock?: React.ReactNode;
  nav?: NavTab;
  children?: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
}

/** Collapsing large title + sticky slot + docked actions (`AppScreen`). */
export function AppScreen({
  title,
  sub,
  back = true,
  right,
  sticky,
  dock,
  nav: navTab,
  children,
  refreshing,
  onRefresh,
  onEndReached,
}: AppScreenProps) {
  const insets = useSafeAreaInsets();
  const nav = useNav();
  const { flow, firstVisit } = useScreen();
  const y = useRef(new Animated.Value(0)).current;
  const [dockH, setDockH] = useState(0);
  const [stuck, setStuck] = useState(false);
  const p = y.interpolate({
    inputRange: [0, 46],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const padBottom =
    (navTab ? 64 + insets.bottom : 0) +
    (dock ? dockH : 0) +
    24 +
    (navTab || dock ? 0 : insets.bottom);
  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y } } }], {
    useNativeDriver: false,
    listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
      const next = contentOffset.y > 23;
      if (next !== stuck) setStuck(next);
      if (
        onEndReached &&
        contentOffset.y + layoutMeasurement.height > contentSize.height - 400
      )
        onEndReached();
    },
  });
  const backBtn = back ? (
    <Press onPress={nav.back} accessibilityLabel="Back" style={styles.backBtn}>
      <Icon name="arrow-left" size={20} color="#0F172A" />
    </Press>
  ) : null;
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[StyleSheet.absoluteFill, styles.root]}>
      <StatusBar barStyle="dark-content" />
      <FlowTint flow={flow} />
      <View style={{ height: insets.top }} />
      <View style={styles.barWrap}>
        <Animated.View
          pointerEvents={stuck ? 'auto' : 'none'}
          style={[styles.glassBar, { opacity: p }]}
        >
          {backBtn}
          <T style={styles.barTitle} numberOfLines={1}>
            {title}
          </T>
          {right}
        </Animated.View>
        <Animated.View
          pointerEvents={stuck ? 'none' : 'auto'}
          style={[styles.plainBar, { opacity: Animated.subtract(1, p) }]}
        >
          {backBtn}
          <View style={styles.flex} />
          {right}
        </Animated.View>
      </View>
      <Animated.ScrollView
        style={styles.flex}
        contentContainerStyle={{ paddingBottom: padBottom }}
        stickyHeaderIndices={sticky ? [1] : undefined}
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
        <Animated.View
          style={[
            styles.titleBlock,
            {
              opacity: Animated.subtract(1, p),
              transform: [
                {
                  translateY: y.interpolate({
                    inputRange: [0, 100],
                    outputRange: [0, -18],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        >
          <T style={styles.title}>{title}</T>
          {sub ? <T style={styles.sub}>{sub}</T> : null}
        </Animated.View>
        {/* Unstyled sticky container: ScrollView moves a sticky child's style onto its own wrapper. */}
        {sticky ? (
          <View>
            <View style={[styles.sticky, stuck && styles.stickyStuck]}>
              {sticky}
            </View>
          </View>
        ) : null}
        <View style={styles.body}>
          {items.map((child, i) => (
            <Rise
              key={(child as any).key ?? i}
              delay={10 + Math.min(i, 6) * 50}
              disabled={!firstVisit}
            >
              {child}
            </Rise>
          ))}
        </View>
      </Animated.ScrollView>
      {dock ? (
        <DockBar raised={!!navTab} onHeight={setDockH}>
          {dock}
        </DockBar>
      ) : null}
      {navTab ? <BottomNav active={navTab} rounded={false} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  barWrap: { height: 48, zIndex: 30 },
  glassBar: {
    ...tw('absolute flex items-center gap-2 px-2'),
    top: 0,
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.7)',
  },
  plainBar: { ...tw('flex items-center gap-2 px-2'), height: 48 },
  backBtn: tw('w-9 h-9 rounded-full items-center justify-center'),
  barTitle: twh('flex-1 text-[15px] font-bold'),
  titleBlock: { ...tw('px-4 overflow-hidden'), height: 62 },
  title: twh('text-[28px] font-extrabold leading-[1.12]'),
  sub: tw('text-[12.5px] text-ink-500 mt-1'),
  sticky: {
    ...tw('px-4 py-2.5'),
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  stickyStuck: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderBottomColor: 'rgba(226,232,240,0.7)',
  },
  body: tw('pt-1'),
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 30,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226,232,240,0.7)',
    boxShadow: '0 -8px 28px -12px rgba(15,23,42,.22)',
  },
  dockSummary: tw('flex items-end justify-between mb-2.5'),
  dockRow: tw('flex gap-2.5'),
  dockCell: { flex: 1 },
});
