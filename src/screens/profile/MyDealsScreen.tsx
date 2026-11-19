import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { BottomNav } from '../../components/BottomNav';
import { Badge, Chip } from '../../components/Form';
import { EmptyGlyph } from '../../components/Hero';
import { Press } from '../../components/Press';
import { Screen } from '../../components/Screen';
import { ErrorState, LoadingState } from '../../components/States';
import { T } from '../../components/T';
import { usePaged } from '../../lib/useResource';
import { subscribeRecords } from '../../lib/realtime';
import { useNav, useRefocus } from '../../navigation/NavContext';
import type { ScreenName } from '../../navigation/types';
import { listMyDeals } from '../../services/deal.service';
import { tw } from '../../theme';
import { formatINR } from '../../utils/format';

type Tab = 'all' | 'active' | 'completed';
interface DealRow {
  id: string;
  title: string;
  price: number | null;
  stage: string;
  progress: number;
  status: 'active' | 'completed' | 'lost';
  role: 'Buying' | 'Selling';
  open: () => void;
}

const completedDeal = (stage: string, label: string, progress: number) =>
  progress >= 100 || stage === 'closed' || stage === 'acquired' || label === 'Completed';

/** P-04b My deals: GET /me/deals (buyer and seller rows from the same API the web app uses). */
export function MyDealsScreen() {
  const nav = useNav();
  const res = usePaged((page, signal) => listMyDeals({ page, limit: 20 }, signal), []);
  useRefocus(res.refresh);
  const refreshRef = useRef(res.refresh);
  refreshRef.current = res.refresh;
  useEffect(() => subscribeRecords(() => refreshRef.current()), []);
  const [tab, setTab] = useState<Tab>('active');
  const go = (name: ScreenName, params: object) => () =>
    nav.go(name, params as never);

  const deals = useMemo<DealRow[]>(() => {
    return res.items.map(d => {
      const done = completedDeal(d.stage, d.stageLabel, d.progressPercent);
      const selling = d.side === 'seller';
      return {
        id: d.id,
        title: d.title || 'Property',
        price: d.price,
        stage: d.stageLabel || d.stage,
        progress: d.progressPercent,
        status: done ? 'completed' : d.stage === 'lost' ? 'lost' : 'active',
        role: selling ? 'Selling' : 'Buying',
        open: selling
          ? go(done ? 'dealComplete' : 'listingDetail', { id: d.sellRequestId || d.id })
          : go('enquiryDetail', { id: d.enquiryId || d.id }),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [res.items]);
  const filtered = deals.filter(d => tab === 'all' || d.status === tab);

  return (
    <Screen
      padBottom
      topBar={{
        title: 'My Deals',
        sub: res.loading && res.items.length === 0 ? undefined : `${res.total} total`,
        back: true,
      }}
      refreshing={res.refreshing}
      onRefresh={res.refresh}
      onEndReached={res.loadMore}
      overlay={<BottomNav active="profile" />}
    >
      <View style={styles.body}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {(['all', 'active', 'completed'] as Tab[]).map(t => (
            <Chip key={t} active={tab === t} onPress={() => setTab(t)}>
              {t === 'all' ? 'All' : t[0].toUpperCase() + t.slice(1)}
            </Chip>
          ))}
        </ScrollView>
        {res.loading ? (
          <LoadingState />
        ) : res.error ? (
          <ErrorState message={res.error} onRetry={res.reload} />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <EmptyGlyph name="handshake" />
            <T style={styles.emptyText}>
              No {tab === 'all' ? '' : `${tab} `}deals
            </T>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map(d => (
              <View key={`${d.role}-${d.id}`} style={styles.card}>
                <View style={styles.head}>
                  <View style={styles.flex}>
                    <T style={styles.title}>{d.title}</T>
                    <T style={styles.price}>
                      {d.price ? formatINR(d.price) : '—'} · {d.role}
                    </T>
                  </View>
                  <Badge
                    color={
                      d.status === 'active'
                        ? 'brand'
                        : d.status === 'lost'
                        ? 'rose'
                        : 'green'
                    }
                  >
                    {d.stage}
                  </Badge>
                </View>
                <View style={styles.mb2}>
                  <View style={styles.progressRow}>
                    <T style={styles.progressLabel}>Progress</T>
                    <T style={styles.progressValue}>{d.progress}%</T>
                  </View>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${d.progress}%` }]} />
                  </View>
                </View>
                <Press onPress={d.open} pressScale={0.99} style={styles.view}>
                  <T style={styles.viewText}>View Details →</T>
                </Press>
              </View>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: tw('flex-1 min-w-0'),
  body: tw('px-4'),
  tabs: tw('flex gap-2 pb-2 mb-3'),
  empty: tw('py-12 items-center'),
  emptyText: tw('mt-2 text-[13px] text-ink-400'),
  list: { gap: 12 },
  card: tw('rounded-card border border-ink-200 p-4 bg-white'),
  head: tw('flex items-start justify-between mb-3 gap-2'),
  title: tw('text-[13px] font-semibold text-ink-900'),
  price: tw('text-[11px] text-brand-600 font-medium'),
  mb2: tw('mb-2'),
  progressRow: tw('flex items-center justify-between mb-1'),
  progressLabel: tw('text-[11px] text-ink-500'),
  progressValue: tw('text-[11px] font-semibold text-ink-700'),
  track: tw('w-full h-2 bg-ink-100 rounded-full overflow-hidden'),
  fill: tw('h-full bg-brand-600 rounded-full'),
  view: tw('w-full h-9 rounded-card bg-brand-50 items-center justify-center'),
  viewText: tw('text-brand-600 text-[12px] font-semibold'),
});
