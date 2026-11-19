import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { meshes, palette, tw, twh } from '../theme';
import { Btn } from './Btn';
import { Icon, type IconName } from './Icon';
import { Float } from './Motion';
import { T } from './T';

/** Empty state block (`EmptyState`). */
export function EmptyState({
  icon = 'inbox',
  title,
  body,
  action,
}: {
  icon?: IconName;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyArt}>
        <Float style={[StyleSheet.absoluteFill, styles.mint]} />
        <View style={styles.emptyTile}>
          <Icon name={icon} size={26} color="#1A6FFF" />
        </View>
      </View>
      <T style={styles.emptyTitle}>{title}</T>
      {body ? <T style={styles.emptyBody}>{body}</T> : null}
      {action ? <View style={styles.emptyAction}>{action}</View> : null}
    </View>
  );
}

/** Failed request with retry. Used wherever the reference shows data that now comes from the API. */
export function ErrorState({
  message,
  onRetry,
  compact,
}: {
  message: string;
  onRetry?: () => void;
  compact?: boolean;
}) {
  return (
    <View
      style={[styles.error, compact && styles.errorCompact]}
      accessibilityRole="alert"
    >
      <View style={styles.errorIcon}>
        <Icon name="wifi-off" size={22} color="#E11D48" />
      </View>
      <T style={styles.errorTitle}>Couldn't load this</T>
      <T style={styles.errorBody}>{message}</T>
      {onRetry && (
        <Btn
          variant="outline"
          size="sm"
          icon="rotate-cw"
          onPress={onRetry}
          style={styles.errorBtn}
        >
          Try again
        </Btn>
      )}
    </View>
  );
}

/** List placeholders while a screen's data is loading. */
export function LoadingState({
  label,
  style,
  rows = 3,
}: {
  label?: string;
  style?: StyleProp<ViewStyle>;
  rows?: number;
}) {
  return (
    <View
      style={[styles.skelList, style]}
      accessibilityLabel={label ?? 'Loading'}
      accessibilityRole="progressbar"
    >
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={styles.skelRow}>
          <View style={styles.skelCopy}>
            <Skeleton h={15} w="68%" />
            <Skeleton h={12} w="42%" />
          </View>
          <Skeleton h={24} w={68} r={999} />
        </View>
      ))}
    </View>
  );
}

/** Shimmer placeholder bar (`Skeleton`). */
export function Skeleton({
  h = 16,
  w = '100%',
  r = 8,
  style,
}: {
  h?: number;
  w?: DimensionValue;
  r?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(v, {
        toValue: 1,
        duration: 1350,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  return (
    <View
      style={[
        {
          height: h,
          width: w,
          borderRadius: r,
          backgroundColor: '#EEF2F7',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shine,
          {
            transform: [
              {
                translateX: v.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-260, 400],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.skelCard}>
      <Skeleton h={160} r={0} />
      <View style={styles.skelBody}>
        <Skeleton h={15} w="72%" />
        <Skeleton h={20} w="45%" />
        <Skeleton h={12} w="88%" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: tw('py-14 px-6 items-center'),
  emptyArt: tw('w-24 h-24 items-center justify-center'),
  mint: {
    borderRadius: 9999,
    experimental_backgroundImage: meshes.mint,
    opacity: 0.7,
  },
  emptyTile: tw(
    'w-14 h-14 rounded-2xl bg-white elev-2 items-center justify-center',
  ),
  emptyTitle: {
    ...twh('text-[17px] font-extrabold text-ink-900 mt-5 text-center'),
  },
  emptyBody: {
    ...tw(
      'text-[12.5px] text-ink-500 mt-1.5 max-w-[250px] leading-relaxed text-center',
    ),
  },
  emptyAction: tw('mt-5'),
  error: tw('py-12 px-6 items-center'),
  errorCompact: tw('py-6'),
  errorIcon: tw(
    'w-12 h-12 rounded-2xl bg-rose-50 items-center justify-center mb-3',
  ),
  errorTitle: tw('text-[15px] font-semibold text-ink-700 text-center'),
  errorBody: tw('text-[12px] text-ink-500 mt-1 text-center max-w-[260px]'),
  errorBtn: tw('mt-4 self-center'),
  skelList: { gap: 12 },
  skelRow: {
    ...tw('flex-row items-center gap-3 rounded-card border border-ink-200 bg-white p-3.5'),
  },
  skelCopy: { flex: 1, gap: 8 },
  shine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 220,
    experimental_backgroundImage:
      'linear-gradient(100deg, rgba(248,250,252,0) 0%, #F8FAFC 50%, rgba(248,250,252,0) 100%)',
  },
  skelCard: {
    ...tw('rounded-card border border-ink-200 overflow-hidden bg-white elev-1'),
  },
  skelBody: { ...tw('p-3.5'), gap: 10 },
});

export const stateColors = { muted: palette.ink[400] };
