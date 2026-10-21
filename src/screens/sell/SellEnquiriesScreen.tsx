import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Btn } from '../../components/Btn';
import { Badge, Chip, type BadgeColor } from '../../components/Form';
import { EmptyGlyph } from '../../components/Hero';
import { Screen } from '../../components/Screen';
import { ErrorState, LoadingState } from '../../components/States';
import { T } from '../../components/T';
import { useNav, useRefocus } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import type { SellerEnquiry } from '../../types/sellRequest';
import { tw } from '../../theme';
import { formatShortDate, initials, timeAgo } from '../../utils/format';
import { callPhone } from '../../utils/links';
import { useSellerActivity } from './sellShared';

type Tab = 'all' | 'new' | 'contacted' | 'shortlisted';
const TABS: Tab[] = ['all', 'new', 'contacted', 'shortlisted'];

/** Buyer enquiry status → the seller-facing bucket shown in the reference tabs. */
function bucket(status: string): Exclude<Tab, 'all'> | 'closed' {
  if (status === 'new') return 'new';
  if (status === 'responded') return 'contacted';
  if (status === 'visit_scheduled' || status === 'negotiating')
    return 'shortlisted';
  return 'closed';
}
const COLOR: Record<string, BadgeColor> = {
  new: 'rose',
  contacted: 'brand',
  shortlisted: 'green',
  closed: 'ink',
};
const INTEREST: Record<string, string> = {
  schedule_visit: 'Wants to schedule a site visit.',
  price_negotiation: 'Interested in negotiating the price.',
  more_details: 'Asked for more details about the property.',
};

function message(e: SellerEnquiry) {
  const visit = e.preferredVisitDate
    ? ` Preferred visit: ${formatShortDate(e.preferredVisitDate)}${
        e.preferredVisitTimeSlot ? `, ${e.preferredVisitTimeSlot}` : ''
      }.`
    : '';
  return `${
    INTEREST[e.interestType] ?? 'Enquired about your property.'
  }${visit}`;
}

/** Seller view of buyer enquiries on the live listing (`enquiries` from the seller activity). */
export function SellEnquiriesScreen({ params }: ScreenProps<'sellEnquiries'>) {
  const nav = useNav();
  const res = useSellerActivity(params.id);
  useRefocus(res.refresh);
  const [tab, setTab] = useState<Tab>('all');
  const all = res.data?.enquiries ?? [];
  const list = all.filter(e => tab === 'all' || bucket(e.status) === tab);

  return (
    <Screen
      topBar={{
        title: 'Buyer enquiries',
        sub: res.data ? `${all.length} total` : undefined,
        back: true,
      }}
      refreshing={res.refreshing}
      onRefresh={res.refresh}
    >
      <View style={styles.body}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {TABS.map(t => (
            <Chip key={t} active={tab === t} onPress={() => setTab(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </Chip>
          ))}
        </ScrollView>
        {res.loading ? (
          <LoadingState />
        ) : res.error ? (
          <ErrorState message={res.error} onRetry={res.reload} />
        ) : list.length === 0 ? (
          <View style={styles.empty}>
            <EmptyGlyph name="inbox" />
            <T style={styles.emptyText}>
              {all.length === 0 && !res.data?.property
                ? 'Enquiries appear once your listing is live'
                : 'No enquiries in this category'}
            </T>
          </View>
        ) : (
          <View style={styles.list}>
            {list.map(e => {
              const name = e.buyerSnapshot?.name || 'Buyer';
              const b = bucket(e.status);
              return (
                <View key={e._id} style={styles.card}>
                  <View style={styles.head}>
                    <View style={styles.avatar}>
                      <T style={styles.avatarText}>
                        {initials(name).charAt(0) || 'B'}
                      </T>
                    </View>
                    <View style={styles.flex}>
                      <View style={styles.nameRow}>
                        <T style={styles.name} numberOfLines={1}>
                          {name}
                        </T>
                        <Badge color={COLOR[b]}>{b}</Badge>
                      </View>
                      <T style={styles.meta}>
                        {e.referenceId} · {timeAgo(e.submittedAt)}
                      </T>
                    </View>
                  </View>
                  <T style={styles.msg}>{message(e)}</T>
                  <View style={styles.actions}>
                    <Btn
                      size="sm"
                      variant="outline"
                      icon="phone"
                      disabled={!e.buyerSnapshot?.phone}
                      onPress={() =>
                        e.buyerSnapshot?.phone &&
                        callPhone(e.buyerSnapshot.phone)
                      }
                    >
                      Call
                    </Btn>
                    <Btn
                      size="sm"
                      variant="outline"
                      icon="calendar"
                      onPress={() => nav.go('sellVisitMgmt', { id: params.id })}
                    >
                      Schedule
                    </Btn>
                    <Btn
                      size="sm"
                      icon="message-circle"
                      onPress={() => nav.go('sellChat', { id: params.id })}
                    >
                      Chat
                    </Btn>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: tw('flex-1 min-w-0'),
  body: tw('px-4'),
  tabs: tw('flex gap-2 pb-2 mb-2'),
  empty: tw('py-12 items-center'),
  emptyText: tw('mt-2 text-[13px] text-ink-400 text-center'),
  list: { gap: 8 },
  card: tw('p-3 rounded-card border border-ink-200'),
  head: tw('flex items-center gap-3'),
  avatar: tw('w-10 h-10 rounded-full bg-brand-100 items-center justify-center'),
  avatarText: tw('text-brand-700 font-bold text-[15px]'),
  nameRow: tw('flex items-center gap-2'),
  name: tw('text-[13px] font-semibold shrink'),
  meta: tw('text-[10.5px] text-ink-500'),
  msg: tw('text-[12.5px] text-ink-700 mt-2 leading-relaxed'),
  actions: tw('flex gap-2 mt-2.5'),
});
