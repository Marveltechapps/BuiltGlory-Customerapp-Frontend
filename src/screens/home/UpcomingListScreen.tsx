import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Badge, Heart, Toggle } from '../../components/Form';
import { EmptyGlyph } from '../../components/Hero';
import { Icon } from '../../components/Icon';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { useFavToggle } from '../../components/PropertyCard';
import { Press } from '../../components/Press';
import { Screen } from '../../components/Screen';
import { ErrorState, LoadingState } from '../../components/States';
import { T } from '../../components/T';
import { useToast } from '../../context/ToastContext';
import type { PropertyView } from '../../interfaces/PropertyView';
import { useNow, usePaged } from '../../lib/useResource';
import { useNav } from '../../navigation/NavContext';
import { listProperties } from '../../services/property.service';
import { tw } from '../../theme';
import { formatINR } from '../../utils/format';
import { placeLabel, toPropertyView } from '../../utils/property';

function Countdown({ date }: { date: string | null }) {
  const now = useNow(1000);
  const diff = Math.max(0, (date ? new Date(date).getTime() : now) - now);
  const parts: Array<[number, string]> = [
    [Math.floor(diff / 86400000), 'days'],
    [Math.floor((diff % 86400000) / 3600000), 'hrs'],
    [Math.floor((diff % 3600000) / 60000), 'min'],
    [Math.floor((diff % 60000) / 1000), 'sec'],
  ];
  return (
    <View style={styles.countdown}>
      {parts.map(([v, l]) => (
        <View key={l} style={styles.cdCell}>
          <T style={styles.cdValue}>{String(v).padStart(2, '0')}</T>
          <T style={styles.cdLabel}>{l}</T>
        </View>
      ))}
    </View>
  );
}

function UpcomingItem({ p, onOpen }: { p: PropertyView; onOpen: () => void }) {
  const toast = useToast();
  const { onToggle, isSaved } = useFavToggle();
  return (
    <View style={styles.card}>
      <Press onPress={onOpen} pressScale={1}>
        <PhotoPlaceholder tag={p.id} src={p.images[0]} height={150}>
          <View style={styles.badge}>
            <Badge color="amber">Coming soon</Badge>
          </View>
          <View style={styles.heart}>
            <Heart active={isSaved(p.id)} onPress={() => onToggle(p.id)} />
          </View>
        </PhotoPlaceholder>
      </Press>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <T style={styles.title}>{p.title}</T>
          <T style={styles.price}>{formatINR(p.price)}</T>
        </View>
        <View style={styles.loc}>
          <Icon name="map-pin" size={12} color="#64748B" />
          <T style={styles.locText}>{placeLabel(p)}</T>
        </View>
        <Countdown date={p.launchDate} />
        <View style={styles.notify}>
          <View style={styles.notifyIcon}>
            <Icon name="bell" size={14} color="#1A6FFF" />
          </View>
          <View style={styles.flex}>
            <T style={styles.notifyTitle}>Notify me when this launches</T>
            <T style={styles.notifySub}>SMS + push alerts</T>
          </View>
          {/* No launch-alert subscription endpoint exists in the backend; the toggle explains that instead of pretending. */}
          <Toggle
            on={false}
            onChange={() =>
              toast.show(
                "Launch alerts aren't available yet. Save the property to keep track of it.",
                'warn',
                3200,
              )
            }
          />
        </View>
      </View>
    </View>
  );
}

/** H-04 Upcoming launches (GET /properties?upcoming=true). */
export function UpcomingListScreen() {
  const nav = useNav();
  const list = usePaged(
    (page, signal) =>
      listProperties({ upcoming: true, page, limit: 20 }, signal).then(r => ({
        data: r.data.map(toPropertyView),
        meta: r.meta,
      })),
    [],
  );
  return (
    <Screen
      topBar={{
        title: 'Upcoming launches',
        sub: 'Be first to book',
        back: true,
      }}
      refreshing={list.refreshing}
      onRefresh={list.refresh}
      onEndReached={list.loadMore}
    >
      {list.loading ? (
        <LoadingState />
      ) : list.error && !list.items.length ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : list.items.length === 0 ? (
        <View style={styles.empty}>
          <EmptyGlyph name="clock" />
          <T style={styles.emptyTitle}>No upcoming properties right now</T>
          <T style={styles.emptySub}>Check back soon for new launches</T>
        </View>
      ) : (
        <View style={styles.list}>
          {list.items.map(p => (
            <UpcomingItem
              key={p.id}
              p={p}
              onOpen={() => nav.go('propertyDetail', { id: p.id, property: p })}
            />
          ))}
          {list.loadingMore && <LoadingState style={styles.more} />}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: tw('flex-1'),
  list: { ...tw('px-4'), gap: 16 },
  card: tw('rounded-card border border-ink-200 overflow-hidden bg-white'),
  badge: tw('absolute top-3 left-3'),
  heart: tw('absolute top-3 right-3'),
  body: tw('p-3'),
  titleRow: tw('flex items-start justify-between gap-2'),
  title: tw('flex-1 font-semibold text-[15px]'),
  price: tw('text-brand-600 font-bold text-[14px] shrink-0'),
  loc: tw('flex items-center gap-1 mt-0.5'),
  locText: tw('text-[12px] text-ink-500'),
  countdown: tw('flex gap-2 mt-2'),
  cdCell: tw('bg-ink-900 rounded-md px-2 py-1.5 items-center min-w-[44px]'),
  cdValue: tw('text-[15px] font-bold leading-none text-white'),
  cdLabel: { ...tw('text-[9px] text-white/70'), marginTop: 2 },
  notify: tw('mt-3 flex items-center gap-3 p-2.5 rounded-md bg-ink-50'),
  notifyIcon: tw('w-9 h-9 rounded-full bg-white items-center justify-center'),
  notifyTitle: tw('text-[12px] font-bold'),
  notifySub: tw('text-ink-500 text-[10.5px]'),
  empty: tw('py-16 px-4 items-center'),
  emptyTitle: tw('mt-3 text-[15px] font-semibold text-ink-700 text-center'),
  emptySub: tw('text-[12px] text-ink-500 mt-1 text-center'),
  more: tw('py-6'),
});
