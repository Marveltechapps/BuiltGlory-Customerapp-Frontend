import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppScreen } from '../../components/AppScreen';
import { Btn } from '../../components/Btn';
import { Badge, type BadgeColor } from '../../components/Form';
import { StatusHero } from '../../components/Hero';
import { Icon } from '../../components/Icon';
import { SegmentedSwipe } from '../../components/Interactive';
import { Rise } from '../../components/Motion';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { Press } from '../../components/Press';
import { Screen } from '../../components/Screen';
import { EmptyState, ErrorState, SkeletonCard } from '../../components/States';
import { T } from '../../components/T';
import { useResource } from '../../lib/useResource';
import { useNav, useRefocus } from '../../navigation/NavContext';
import { listMySellRequests } from '../../services/sellRequest.service';
import type { SellRequest } from '../../types/sellRequest';
import { tw, twh } from '../../theme';
import { formatINR } from '../../utils/format';
import { SELL_STATUS_LABEL } from '../sell/sellShared';

type Tab = 'all' | 'active' | 'sold' | 'withdrawn';

export function listingBucket(status: string): Exclude<Tab, 'all'> {
  if (status === 'sold') return 'sold';
  if (status === 'rejected' || status === 'paused') return 'withdrawn';
  return 'active';
}
const BADGE: Record<Exclude<Tab, 'all'>, BadgeColor> = {
  active: 'green',
  sold: 'brand',
  withdrawn: 'amber',
};

/** Where tapping a listing goes: rejected → SL-18, drafts → resume editing, everything else → P-05. */
export function openListing(nav: ReturnType<typeof useNav>, r: SellRequest) {
  if (r.status === 'rejected') nav.go('rejectedListing', { id: r._id });
  else if (r.status === 'draft') nav.go('editListing', { id: r._id });
  else nav.go('listingDetail', { id: r._id });
}

/** P-04 My listings (GET /me/sell-requests). */
export function MyListingsScreen() {
  const nav = useNav();
  const res = useResource(signal => listMySellRequests({}, signal), []);
  useRefocus(res.refresh);
  const [tab, setTab] = useState<Tab>('all');
  const listings = res.data?.data ?? [];
  const filtered =
    tab === 'all'
      ? listings
      : listings.filter(l => listingBucket(l.status) === tab);

  if (!res.loading && !res.error && listings.length === 0)
    return <NoListingsScreen />;

  return (
    <AppScreen
      title="My Listings"
      sub={
        res.loading
          ? 'Loading…'
          : `${listings.length} ${
              listings.length === 1 ? 'property' : 'properties'
            } listed`
      }
      nav="profile"
      refreshing={res.refreshing}
      onRefresh={res.refresh}
      sticky={
        <SegmentedSwipe
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'sold', label: 'Sold' },
            { id: 'withdrawn', label: 'Withdrawn' },
          ]}
        />
      }
      dock={[
        <Btn
          key="n"
          icon="plus"
          onPress={() => nav.go('sellType')}
          style={styles.full}
        >
          List a property
        </Btn>,
      ]}
    >
      <View style={styles.body}>
        {res.loading ? (
          <View style={styles.list}>
            {[1, 2].map(i => (
              <SkeletonCard key={i} />
            ))}
          </View>
        ) : res.error ? (
          <ErrorState message={res.error} onRetry={res.reload} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="tag"
            title={`No ${tab} listings`}
            body="Listings in this state will appear here."
          />
        ) : (
          <View style={styles.list}>
            {filtered.map((r, i) => {
              const bucket = listingBucket(r.status);
              const place = [r.address?.locality, r.address?.city]
                .filter(Boolean)
                .join(', ');
              return (
                <Rise key={r._id} delay={Math.min(i * 50, 300)}>
                  <View style={styles.card}>
                    <Press
                      onPress={() => openListing(nav, r)}
                      pressScale={0.98}
                      style={styles.row}
                    >
                      <PhotoPlaceholder
                        tag={r._id}
                        src={r.photos?.[0]}
                        style={styles.thumb}
                      >
                        <View style={styles.badge}>
                          <Badge
                            color={r.status === 'draft' ? 'ink' : BADGE[bucket]}
                          >
                            {(
                              SELL_STATUS_LABEL[r.status] ?? r.status
                            ).toLowerCase()}
                          </Badge>
                        </View>
                      </PhotoPlaceholder>
                      <View style={styles.info}>
                        <T style={styles.title} numberOfLines={1}>
                          {r.propertyTitle || 'Untitled listing'}
                        </T>
                        <T style={styles.place} numberOfLines={1}>
                          {place || r.referenceId}
                        </T>
                        <T style={styles.price}>
                          {r.askingPrice
                            ? formatINR(r.askingPrice)
                            : 'Price not set'}
                        </T>
                        <View style={styles.metrics}>
                          <View style={styles.metric}>
                            <Icon name="eye" size={10} color="#64748B" />
                            <T style={styles.metricText}>
                              {r.metrics?.views ?? 0}
                            </T>
                          </View>
                          <View style={styles.metric}>
                            <Icon
                              name="message-circle"
                              size={10}
                              color="#64748B"
                            />
                            <T style={styles.metricText}>
                              {r.metrics?.enquiryCount ?? 0}
                            </T>
                          </View>
                        </View>
                      </View>
                    </Press>
                  </View>
                </Rise>
              );
            })}
          </View>
        )}
      </View>
    </AppScreen>
  );
}

/** P-06 No listings yet. */
export function NoListingsScreen() {
  const nav = useNav();
  return (
    <Screen fill topBar={{ title: 'My Listings', back: true }}>
      <View style={styles.center}>
        <StatusHero icon="tag" tone="empty" />
        <T style={styles.emptyTitle}>You haven't listed any properties yet.</T>
        <T style={styles.emptyBody}>
          List your property and start receiving verified buyer enquiries.
        </T>
        <Btn style={styles.mt6} icon="plus" onPress={() => nav.go('sellType')}>
          List a Property
        </Btn>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  full: tw('w-full'),
  body: tw('px-4 pt-3'),
  list: { gap: 12 },
  card: {
    ...tw('rounded-2xl elev-1 overflow-hidden bg-white'),
    boxShadow:
      '0 0 0 1px rgba(226,232,240,0.7), 0 1px 2px rgba(15,23,42,.05), 0 1px 3px rgba(15,23,42,.04)',
  },
  row: tw('w-full flex gap-3 p-3'),
  thumb: { ...tw('rounded-md shrink-0'), width: 80, height: 80 },
  badge: tw('absolute top-1 left-1'),
  info: tw('flex-1 min-w-0 py-1'),
  title: tw('text-[13px] font-semibold'),
  place: tw('text-[11px] text-ink-500'),
  price: {
    ...twh('num text-[15px] font-extrabold text-brand-700 mt-0.5'),
    letterSpacing: 15 * -0.02,
  },
  metrics: tw('flex gap-3 mt-1'),
  metric: tw('flex items-center gap-0.5'),
  metricText: tw('text-[10px] text-ink-500'),
  center: tw('flex-1 items-center justify-center px-8'),
  emptyTitle: tw('text-[18px] font-bold text-ink-900 text-center'),
  emptyBody: tw(
    'text-[13px] text-ink-500 mt-2 max-w-[250px] leading-relaxed text-center',
  ),
  mt6: tw('mt-6 self-center'),
});
