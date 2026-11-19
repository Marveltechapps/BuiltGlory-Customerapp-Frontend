import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { BottomNav } from '../../components/BottomNav';
import { Badge, Chip, type BadgeColor } from '../../components/Form';
import { EmptyGlyph } from '../../components/Hero';
import { Icon } from '../../components/Icon';
import { Press } from '../../components/Press';
import { Screen } from '../../components/Screen';
import { ErrorState, LoadingState } from '../../components/States';
import { T } from '../../components/T';
import { usePaged } from '../../lib/useResource';
import { subscribeRecords } from '../../lib/realtime';
import { useNav, useRefocus } from '../../navigation/NavContext';
import { listMyVisits } from '../../services/visit.service';
import type { Visit } from '../../types/visit';
import { palette, tw } from '../../theme';
import { dateKey, formatShortDate, fromIsoDate } from '../../utils/format';
import { isUpcoming } from './enquiryShared';

type Tab = 'all' | 'upcoming' | 'completed';
interface VisitRow {
  visit: Visit;
  title: string;
  upcoming: boolean;
}

const STATUS: Record<string, [string, BadgeColor]> = {
  completed: ['completed', 'green'],
  cancelled: ['cancelled', 'rose'],
  missed: ['missed', 'amber'],
};

/** P-04a My visits: GET /me/visits, including visits booked without an enquiry. */
export function MyVisitsScreen() {
  const nav = useNav();
  const res = usePaged(
    (page, signal) => listMyVisits({ page, limit: 20, sort: 'newest' }, signal),
    [],
  );
  useRefocus(res.refresh);
  const refreshRef = useRef(res.refresh);
  refreshRef.current = res.refresh;
  useEffect(() => subscribeRecords(() => refreshRef.current()), []);
  const [tab, setTab] = useState<Tab>('upcoming');
  const rows = useMemo<VisitRow[]>(() => {
    const all = res.items.map(v => ({
      visit: v,
      title: v.propertySnapshot?.title || 'Property',
      upcoming: isUpcoming(v),
    }));
    return all.sort((a, b) =>
      a.upcoming === b.upcoming
        ? a.upcoming
          ? a.visit.visitDate.localeCompare(b.visit.visitDate)
          : b.visit.visitDate.localeCompare(a.visit.visitDate)
        : a.upcoming
        ? -1
        : 1,
    );
  }, [res.items]);
  const filtered = rows.filter(
    r =>
      tab === 'all' ||
      (tab === 'upcoming' ? r.upcoming : r.visit.status === 'completed'),
  );

  return (
    <Screen
      padBottom
      topBar={{
        title: 'My Visits',
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
          {(['all', 'upcoming', 'completed'] as Tab[]).map(t => (
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
            <EmptyGlyph name="calendar" />
            <T style={styles.emptyText}>
              No {tab === 'all' ? '' : `${tab} `}visits
            </T>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map(({ visit: v, title, upcoming }) => {
              const [label, color]: [string, BadgeColor] = upcoming
                ? [v.status === 'confirmed' ? 'confirmed' : 'upcoming', 'brand']
                : STATUS[v.status] ?? [v.status, 'ink'];
              return (
                <View key={v._id} style={styles.card}>
                  <View style={styles.head}>
                    <View style={styles.flex}>
                      <T style={styles.title}>{title}</T>
                      <T style={styles.sub}>
                        Ref: {v.referenceId}
                        {v.visitType === 'virtual' ? ' · Video tour' : ''}
                      </T>
                    </View>
                    <Badge color={color}>{label}</Badge>
                  </View>
                  <View style={styles.when}>
                    <View style={styles.whenItem}>
                      <Icon
                        name="calendar"
                        size={14}
                        color={palette.ink[700]}
                      />
                      <T style={styles.whenText}>
                        {formatShortDate(fromIsoDate(dateKey(v.visitDate)))}
                      </T>
                    </View>
                    <View style={styles.whenItem}>
                      <Icon name="clock" size={14} color={palette.ink[700]} />
                      <T style={styles.whenText}>{v.visitTime ?? '—'}</T>
                    </View>
                  </View>
                  {upcoming && (
                    <View style={styles.actions}>
                      <Press
                        onPress={() =>
                          nav.go('rescheduleVisit', {
                            visit: v,
                            propertyTitle: title,
                          })
                        }
                        style={[styles.action, styles.actionInk]}
                      >
                        <T style={styles.actionText}>Reschedule</T>
                      </Press>
                      <Press
                        onPress={() =>
                          nav.go('cancelEnquiry', { visit: v, title })
                        }
                        style={[styles.action, styles.actionRose]}
                      >
                        <T style={[styles.actionText, styles.rose]}>Cancel</T>
                      </Press>
                    </View>
                  )}
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
  tabs: tw('flex gap-2 pb-2 mb-3'),
  empty: tw('py-12 items-center'),
  emptyText: tw('mt-2 text-[13px] text-ink-400'),
  list: { gap: 12 },
  card: tw('rounded-card border border-ink-200 p-4 bg-white'),
  head: tw('flex items-start justify-between mb-3 gap-2'),
  title: tw('text-[13px] font-semibold text-ink-900'),
  sub: tw('text-[11px] text-ink-500'),
  when: tw('flex items-center gap-4'),
  whenItem: tw('flex items-center gap-1.5'),
  whenText: tw('text-[12px]'),
  actions: tw('flex gap-2 mt-3'),
  action: tw('flex-1 h-9 rounded-card border items-center justify-center'),
  actionInk: tw('border-ink-200'),
  actionRose: tw('border-rose-200'),
  actionText: tw('text-[12px] font-bold'),
  rose: tw('text-rose-600'),
});
