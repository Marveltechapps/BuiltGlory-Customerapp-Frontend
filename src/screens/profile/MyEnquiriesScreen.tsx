import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppScreen } from '../../components/AppScreen';
import { Btn } from '../../components/Btn';
import { Badge } from '../../components/Form';
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
import { listMyEnquiries } from '../../services/enquiry.service';
import { palette, tw } from '../../theme';
import { formatDate, formatINR } from '../../utils/format';
import { buzz } from '../../utils/haptics';
import {
  enquiryBadge,
  enquiryBucket,
  enquiryNote,
  type EnquiryBucket,
} from './enquiryShared';

type Tab = 'all' | EnquiryBucket;

/** P-07 My enquiries (GET /me/buy-enquiries). */
export function MyEnquiriesScreen() {
  const nav = useNav();
  const res = useResource(
    signal => listMyEnquiries({ sort: 'newest' }, signal),
    [],
  );
  useRefocus(res.refresh);
  const [tab, setTab] = useState<Tab>('all');
  const enquiries = res.data?.data ?? [];
  const filtered =
    tab === 'all' ? enquiries : enquiries.filter(e => enquiryBucket(e) === tab);

  if (!res.loading && !res.error && enquiries.length === 0)
    return <NoEnquiriesScreen />;

  return (
    <AppScreen
      title="My Enquiries"
      sub={
        res.loading
          ? 'Loading…'
          : `${enquiries.length} ${
              enquiries.length === 1 ? 'property' : 'properties'
            } enquired`
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
            { id: 'completed', label: 'Done' },
            { id: 'cancelled', label: 'Cancelled' },
          ]}
        />
      }
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
            icon="inbox"
            title={`No ${tab === 'completed' ? 'done' : tab} enquiries`}
            body="Enquiries in this state will appear here."
          />
        ) : (
          <View style={styles.list}>
            {filtered.map((e, i) => {
              const [label, color] = enquiryBadge(e);
              const snap = e.propertySnapshot ?? {};
              return (
                <Rise key={e._id} delay={Math.min(i * 50, 300)}>
                  <View style={styles.card}>
                    <Press
                      onPress={() => {
                        buzz();
                        nav.go('propertyDetail', { id: e.propertyId });
                      }}
                      style={styles.eye}
                      accessibilityLabel="View property"
                    >
                      <Icon name="eye" size={15} color="#1A6FFF" />
                    </Press>
                    <Press
                      onPress={() => nav.go('enquiryDetail', { id: e._id })}
                      pressScale={0.98}
                      style={styles.row}
                    >
                      <PhotoPlaceholder
                        tag={e.propertyId}
                        style={styles.thumb}
                      />
                      <View style={styles.info}>
                        <View style={styles.titleRow}>
                          <T style={styles.title} numberOfLines={1}>
                            {snap.title || 'Property'}
                          </T>
                          <Badge color={color}>{label}</Badge>
                        </View>
                        <T style={styles.place} numberOfLines={1}>
                          {[
                            snap.location,
                            snap.price ? formatINR(snap.price) : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </T>
                        <View style={styles.dateRow}>
                          <Icon name="clock" size={10} color="#94A3B8" />
                          <T style={styles.date}>
                            {formatDate(e.submittedAt ?? e.createdAt)}
                          </T>
                        </View>
                        <T style={styles.note}>{enquiryNote(e)}</T>
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

/** P-09 No enquiries yet. */
export function NoEnquiriesScreen() {
  const nav = useNav();
  return (
    <Screen fill topBar={{ title: 'My Enquiries', back: true }}>
      <View style={styles.center}>
        <StatusHero icon="inbox" tone="empty" />
        <T style={styles.emptyTitle}>
          You haven't submitted any enquiries yet.
        </T>
        <T style={styles.emptyBody}>
          Browse verified properties and submit an enquiry to get started.
        </T>
        <Btn style={styles.mt6} icon="search" onPress={() => nav.jump('home')}>
          Browse Properties
        </Btn>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: tw('px-4 pt-3'),
  list: { gap: 12 },
  card: {
    ...tw('rounded-2xl overflow-hidden bg-white'),
    boxShadow:
      '0 0 0 1px rgba(226,232,240,0.7), 0 1px 2px rgba(15,23,42,.05), 0 1px 3px rgba(15,23,42,.04)',
  },
  eye: {
    ...tw(
      'absolute w-8 h-8 rounded-full bg-brand-50 items-center justify-center z-10',
    ),
    top: 10,
    right: 10,
    boxShadow: `0 0 0 1px ${palette.brand[100]}`,
  },
  row: { ...tw('w-full flex gap-3 p-3'), paddingRight: 48 },
  thumb: { ...tw('rounded-xl shrink-0'), width: 72, height: 72 },
  info: tw('flex-1 min-w-0'),
  titleRow: tw('flex items-center gap-2 mb-0.5'),
  title: tw('flex-1 text-[13px] font-semibold'),
  place: tw('text-[11px] text-ink-500'),
  dateRow: tw('flex items-center gap-1 mt-0.5'),
  date: tw('text-[11px] text-ink-400'),
  note: tw('text-[10.5px] mt-1'),
  center: tw('flex-1 items-center justify-center px-8'),
  emptyTitle: tw('text-[18px] font-bold text-ink-900 text-center'),
  emptyBody: tw(
    'text-[13px] text-ink-500 mt-2 max-w-[250px] leading-relaxed text-center',
  ),
  mt6: tw('mt-6 self-center'),
});
