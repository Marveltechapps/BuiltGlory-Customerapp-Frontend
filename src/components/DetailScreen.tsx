import React, { useRef, useState } from 'react';
import { Animated, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNav, useScreen } from '../navigation/NavContext';
import { tw, twh } from '../theme';
import { DockBar } from './AppScreen';
import { Icon } from './Icon';
import { Rise } from './Motion';
import { Press } from './Press';
import { FlowTint } from './Screen';
import { T } from './T';

interface DetailScreenProps {
  title: string;
  hero: React.ReactNode;
  heroHeight?: number;
  children?: React.ReactNode;
  dock?: React.ReactNode;
  dockSummary?: React.ReactNode;
  right?: React.ReactNode;
  /** Rendered above everything (fullscreen gallery, sheets). */
  overlay?: React.ReactNode;
}

/** Full-bleed hero with parallax and an overlapping sheet (`DetailScreen`). */
export function DetailScreen({
  title,
  hero,
  heroHeight = 280,
  children,
  dock,
  dockSummary,
  right,
  overlay,
}: DetailScreenProps) {
  const insets = useSafeAreaInsets();
  const nav = useNav();
  const { flow, firstVisit } = useScreen();
  const y = useRef(new Animated.Value(0)).current;
  const [dockH, setDockH] = useState(112);
  const [barOn, setBarOn] = useState(false);
  const p = y.interpolate({
    inputRange: [heroHeight * 0.45, heroHeight * 0.45 + 70],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[StyleSheet.absoluteFill, styles.root]}>
      <StatusBar barStyle="dark-content" />
      <FlowTint flow={flow} />
      <View style={{ height: insets.top }} />
      <Animated.View
        pointerEvents={barOn ? 'auto' : 'none'}
        style={[styles.bar, { top: insets.top, opacity: p }]}
      >
        <Press
          onPress={nav.back}
          accessibilityLabel="Back"
          style={styles.backBtn}
        >
          <Icon name="arrow-left" size={20} color="#0F172A" />
        </Press>
        <T style={styles.barTitle} numberOfLines={1}>
          {title}
        </T>
        {right}
      </Animated.View>
      <Animated.ScrollView
        style={styles.flex}
        contentContainerStyle={{
          paddingBottom: dock ? dockH + 16 : 24 + insets.bottom,
        }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y } } }], {
          useNativeDriver: false,
          listener: e => {
            const on =
              (e as any).nativeEvent.contentOffset.y > heroHeight * 0.45 + 42;
            if (on !== barOn) setBarOn(on);
          },
        })}
      >
        <View style={[styles.heroWrap, { height: heroHeight }]}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                transform: [
                  {
                    translateY: y.interpolate({
                      inputRange: [0, 1000],
                      outputRange: [0, 340],
                      extrapolateLeft: 'clamp',
                    }),
                  },
                ],
              },
            ]}
          >
            {hero}
          </Animated.View>
        </View>
        <View style={styles.sheet}>
          <View style={styles.handle} />
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
        <DockBar summary={dockSummary} onHeight={setDockH}>
          {dock}
        </DockBar>
      ) : null}
      {overlay}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  bar: {
    ...tw('absolute left-0 right-0 z-30 h-12 flex items-center gap-2 px-2'),
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.7)',
  },
  backBtn: tw('w-9 h-9 rounded-full items-center justify-center'),
  barTitle: twh('flex-1 text-[15px] font-bold'),
  heroWrap: { position: 'relative', overflow: 'hidden' },
  sheet: {
    ...tw('relative bg-white pt-4 z-10 elev-3'),
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  handle: tw('w-9 h-1 rounded-full bg-ink-200 self-center mb-3'),
});
