import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  PanResponder,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { palette, tw } from '../theme';
import { buzz } from '../utils/haptics';
import { Icon, type IconName } from './Icon';
import { Press } from './Press';
import { Sheet } from './Sheet';
import { T } from './T';

/** Paged horizontal gallery (`SwipeGallery`). */
export function SwipeGallery<T>({
  data,
  index,
  onIndex,
  renderItem,
  height,
  style,
}: {
  data: T[];
  index: number;
  onIndex: (i: number) => void;
  renderItem: (item: T, i: number) => React.ReactNode;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const [width, setWidth] = useState(0);
  const ref = useRef<FlatList<T>>(null);
  const current = useRef(index);
  useEffect(() => {
    if (width && index !== current.current) {
      current.current = index;
      ref.current?.scrollToOffset({ offset: index * width, animated: true });
    }
  }, [index, width]);
  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== current.current) {
      current.current = i;
      buzz();
      onIndex(i);
    }
  };
  return (
    <View
      style={[{ height, overflow: 'hidden' }, style]}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 && (
        <FlatList
          ref={ref}
          data={data}
          horizontal
          pagingEnabled
          bounces
          initialScrollIndex={index}
          getItemLayout={(_, i) => ({
            length: width,
            offset: width * i,
            index: i,
          })}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          onMomentumScrollEnd={onMomentumEnd}
          renderItem={({ item, index: i }) => (
            <View style={{ width, height: '100%' }}>{renderItem(item, i)}</View>
          )}
        />
      )}
    </View>
  );
}

/** Swipe a row left to reveal an action (`SwipeAction`). */
export function SwipeAction({
  children,
  onAction,
  label = 'Remove',
  icon = 'trash-2',
  tone = '#E11D48',
}: {
  children: React.ReactNode;
  onAction: () => void;
  label?: string;
  icon?: IconName;
  tone?: string;
}) {
  const W = 84;
  const x = useRef(new Animated.Value(0)).current;
  const open = useRef(false);
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        const base = open.current ? -W : 0;
        const d = base + g.dx;
        x.setValue(d < 0 ? Math.max(-W - 20, d) : d * 0.2);
      },
      onPanResponderRelease: (_, g) => {
        const d = (open.current ? -W : 0) + g.dx;
        const shouldOpen = d < -W * 0.55 || g.vx < -0.5;
        open.current = shouldOpen;
        if (shouldOpen) buzz();
        Animated.spring(x, {
          toValue: shouldOpen ? -W : 0,
          useNativeDriver: true,
          bounciness: 6,
        }).start();
      },
    }),
  ).current;
  return (
    <View style={styles.swipeWrap}>
      <View style={[styles.swipeAction, { width: W, backgroundColor: tone }]}>
        <Press
          onPress={() => {
            onAction();
            open.current = false;
            x.setValue(0);
          }}
          style={styles.swipeBtn}
          accessibilityLabel={label}
        >
          <Icon name={icon} size={17} color="#FFFFFF" />
          <T style={styles.swipeLabel}>{label}</T>
        </Press>
      </View>
      <Animated.View
        style={[styles.swipeFront, { transform: [{ translateX: x }] }]}
        {...pan.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

/** Tabs with a sliding pill (`SegmentedSwipe`). */
export function SegmentedSwipe<V extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: Array<{ id: V; label: string }>;
  value: V;
  onChange: (v: V) => void;
}) {
  const [w, setW] = useState(0);
  const i = Math.max(
    0,
    tabs.findIndex(t => t.id === value),
  );
  const pos = useRef(new Animated.Value(i)).current;
  useEffect(() => {
    Animated.spring(pos, {
      toValue: i,
      useNativeDriver: true,
      speed: 14,
      bounciness: 9,
    }).start();
  }, [i, pos]);
  const seg = (w - 8) / tabs.length;
  return (
    <View style={styles.seg} onLayout={e => setW(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <Animated.View
          style={[
            styles.segPill,
            {
              width: seg - 4,
              transform: [
                {
                  translateX: pos.interpolate({
                    inputRange: [0, Math.max(1, tabs.length - 1)],
                    outputRange: [6, 6 + seg * Math.max(1, tabs.length - 1)],
                  }),
                },
              ],
            },
          ]}
        />
      )}
      {tabs.map(t => {
        const on = t.id === value;
        return (
          <Press
            key={t.id}
            pressScale={1}
            haptic
            onPress={() => onChange(t.id)}
            style={styles.segBtn}
            accessibilityState={{ selected: on }}
          >
            <T
              style={[
                styles.segText,
                { color: on ? palette.brand[700] : palette.ink[500] },
              ]}
            >
              {t.label}
            </T>
          </Press>
        );
      })}
    </View>
  );
}

/** Two-thumb range slider (Budget / Area on B-02). */
export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
}: {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
}) {
  const live = useRef({ width: 0, value, min, max, step, onChange });
  live.current = { ...live.current, value, min, max, step, onChange };
  const startRef = useRef(value);
  const toPct = (v: number) => ((v - min) / (max - min)) * 100;
  const make = (which: 0 | 1) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        startRef.current = live.current.value;
      },
      onPanResponderMove: (_, g) => {
        const L = live.current;
        if (!L.width) return;
        const raw =
          startRef.current[which] + (g.dx / L.width) * (L.max - L.min);
        const snapped = Math.round(raw / L.step) * L.step;
        const next: [number, number] = [L.value[0], L.value[1]];
        if (which === 0)
          next[0] = Math.max(L.min, Math.min(snapped, next[1] - L.step));
        else next[1] = Math.min(L.max, Math.max(snapped, next[0] + L.step));
        if (next[0] !== L.value[0] || next[1] !== L.value[1]) L.onChange(next);
      },
      onPanResponderRelease: () => buzz(),
    });
  const lo = useRef(make(0)).current;
  const hi = useRef(make(1)).current;
  return (
    <View
      style={styles.slider}
      onLayout={e => (live.current.width = e.nativeEvent.layout.width)}
    >
      <View style={styles.sliderTrack} />
      <View
        style={[
          styles.sliderFill,
          { left: `${toPct(value[0])}%`, right: `${100 - toPct(value[1])}%` },
        ]}
      />
      <View
        {...lo.panHandlers}
        hitSlop={14}
        style={[styles.thumb, { left: `${toPct(value[0])}%` }]}
        accessibilityLabel="Minimum"
      />
      <View
        {...hi.panHandlers}
        hitSlop={14}
        style={[styles.thumb, { left: `${toPct(value[1])}%` }]}
        accessibilityLabel="Maximum"
      />
    </View>
  );
}

/** Native-feeling replacement for the reference `<select>`: a field that opens an option sheet. */
export function SelectField({
  value,
  placeholder,
  options,
  onChange,
  title,
}: {
  value: string;
  placeholder: string;
  options: string[];
  onChange: (v: string) => void;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Press
        pressScale={1}
        onPress={() => setOpen(true)}
        style={styles.select}
        accessibilityLabel={title ?? placeholder}
      >
        <T
          style={[styles.selectText, !value && { color: palette.ink[400] }]}
          numberOfLines={1}
        >
          {value || placeholder}
        </T>
        <Icon name="chevron-down" size={16} color="#94A3B8" />
      </Press>
      <Sheet
        visible={open}
        onClose={() => setOpen(false)}
        title={title ?? placeholder}
      >
        <View style={styles.optionList}>
          {options.map(o => (
            <Press
              key={o}
              pressScale={0.98}
              onPress={() => {
                onChange(o);
                setOpen(false);
              }}
              style={[
                styles.option,
                value === o ? styles.optionOn : styles.optionOff,
              ]}
            >
              <T style={styles.optionText}>{o}</T>
              {value === o && <Icon name="check" size={16} color="#1A6FFF" />}
            </Press>
          ))}
        </View>
      </Sheet>
    </>
  );
}

/** FAQ accordion rows inside a bordered card. */
export function Accordion({
  items,
  openSet,
  onToggle,
}: {
  items: Array<{ q: string; a: string }>;
  openSet: Set<number>;
  onToggle: (i: number) => void;
}) {
  return (
    <View style={styles.acc}>
      {items.map((f, i) => (
        <View key={`${f.q}-${i}`} style={i ? styles.accDivider : undefined}>
          <Press
            pressScale={1}
            onPress={() => onToggle(i)}
            style={styles.accHead}
            accessibilityState={{ expanded: openSet.has(i) }}
          >
            <T style={styles.accQ}>{f.q}</T>
            <Icon
              name={openSet.has(i) ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#64748B"
            />
          </Press>
          {openSet.has(i) && <T style={styles.accA}>{f.a}</T>}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  swipeWrap: tw('relative overflow-hidden rounded-card'),
  swipeAction: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeBtn: tw('items-center gap-1'),
  swipeLabel: tw('text-[10px] font-bold text-white'),
  swipeFront: tw('relative bg-white'),
  seg: tw('relative flex bg-ink-100 rounded-full p-1'),
  segPill: {
    ...tw('absolute top-1 bottom-1 rounded-full bg-white elev-1'),
    left: 0,
  },
  segBtn: tw('flex-1 py-2 items-center'),
  segText: tw('text-[12px] font-bold'),
  slider: { height: 16, justifyContent: 'center', marginHorizontal: 8 },
  sliderTrack: tw('h-2 bg-ink-100 rounded-full'),
  sliderFill: tw('absolute h-2 bg-brand-600 rounded-full'),
  thumb: {
    ...tw('absolute w-4 h-4 rounded-full bg-white border-2 border-brand-600'),
    marginLeft: -8,
    top: 0,
  },
  select: tw(
    'w-full h-12 px-3 border border-ink-200 rounded-card bg-white flex items-center justify-between',
  ),
  selectText: tw('flex-1 text-[14px] text-ink-900'),
  optionList: { gap: 8 },
  option: tw(
    'w-full flex items-center justify-between p-3 rounded-card border',
  ),
  optionOn: tw('border-brand-600 bg-brand-50'),
  optionOff: tw('border-ink-200'),
  optionText: tw('text-[14px] font-medium'),
  acc: tw('border border-ink-200 rounded-card overflow-hidden'),
  accDivider: tw('border-t border-ink-200'),
  accHead: tw('w-full flex items-center justify-between gap-2 p-3.5'),
  accQ: tw('flex-1 text-[13px] font-medium'),
  accA: tw('px-3.5 pb-3.5 text-[12.5px] text-ink-500 leading-relaxed'),
});
