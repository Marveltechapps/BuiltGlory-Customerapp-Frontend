import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, type IconName } from '../../components/Icon';
import { SwipeAction } from '../../components/Interactive';
import { GlowPulse } from '../../components/Motion';
import { Press } from '../../components/Press';
import { Screen } from '../../components/Screen';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { T } from '../../components/T';
import { useToast } from '../../context/ToastContext';
import { usePaged } from '../../lib/useResource';
import { useNav } from '../../navigation/NavContext';
import {
  deleteNotification,
  listNotifications,
  markNotificationRead,
  markNotificationsRead,
} from '../../services/notification.service';
import type { AppNotification } from '../../types/notification';
import { palette, tw, withAlpha } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { dayBucket, shortAge } from '../../utils/format';

const ICONS: Array<[RegExp, IconName]> = [
  [/enquir/i, 'message-circle'],
  [/visit/i, 'calendar'],
  [/price|drop/i, 'trending-up'],
  [/verif|approv|live|listing/i, 'badge-check'],
  [/payment|token|payout/i, 'credit-card'],
  [/offer|deal|negotiat/i, 'handshake'],
  [/document|kyc/i, 'file-text'],
  [/demand|trend/i, 'flame'],
];

function iconFor(n: AppNotification): IconName {
  const key = `${n.notificationType ?? ''} ${n.event} ${n.title ?? ''}`;
  return ICONS.find(([re]) => re.test(key))?.[1] ?? 'bell';
}

/** P-10 Notifications (GET /me/notifications, grouped by day; swipe to dismiss, mark all read). */
export function NotificationsScreen() {
  const nav = useNav();
  const toast = useToast();
  const list = usePaged(
    (page, signal) => listNotifications({ page, limit: 30 }, signal),
    [],
  );
  const [gone, setGone] = useState<Set<string>>(new Set());
  const [read, setRead] = useState<Set<string>>(new Set());
  const [allRead, setAllRead] = useState(false);

  const items = list.items.filter(n => !gone.has(n._id));
  const groups = useMemo(() => {
    const out: Array<{ day: string; items: AppNotification[] }> = [];
    for (const n of items) {
      const day = dayBucket(n.createdAt);
      const g = out.find(x => x.day === day);
      if (g) g.items.push(n);
      else out.push({ day, items: [n] });
    }
    return out;
  }, [items]);
  const isUnread = (n: AppNotification) =>
    !allRead && !n.isRead && !read.has(n._id);

  const markAll = async () => {
    setAllRead(true);
    try {
      await markNotificationsRead([]);
    } catch (e) {
      setAllRead(false);
      toast.show(errorMessage(e), 'error');
    }
  };
  const dismiss = async (n: AppNotification) => {
    setGone(s => new Set(s).add(n._id));
    try {
      await deleteNotification(n._id);
    } catch (e) {
      setGone(s => {
        const next = new Set(s);
        next.delete(n._id);
        return next;
      });
      toast.show(errorMessage(e), 'error');
    }
  };
  const open = (n: AppNotification) => {
    if (isUnread(n)) {
      setRead(s => new Set(s).add(n._id));
      markNotificationRead(n._id).catch(() => undefined);
    }
    const type = (n.entityType ?? '').toLowerCase();
    if (n.enquiryId || type.includes('enquir'))
      nav.go('enquiryDetail', { id: n.enquiryId ?? n.entityId! });
    else if (n.listingId || type.includes('sell'))
      nav.go('listingDetail', { id: n.listingId ?? n.entityId! });
    else if (n.propertyId || type === 'property')
      nav.go('propertyDetail', { id: n.propertyId ?? n.entityId! });
    else if (type.includes('visit')) nav.go('myVisits');
    else if (n.dealId || type.includes('deal') || type.includes('payment'))
      nav.go('myDeals');
  };

  return (
    <Screen
      topBar={{
        title: 'Notifications',
        back: true,
        right: items.some(isUnread) ? (
          <Press onPress={markAll} pressScale={1}>
            <T style={styles.markAll}>Mark all read</T>
          </Press>
        ) : undefined,
      }}
      refreshing={list.refreshing}
      onRefresh={list.refresh}
      onEndReached={list.loadMore}
    >
      <View style={styles.body}>
        {list.loading ? (
          <LoadingState />
        ) : list.error && !items.length ? (
          <ErrorState message={list.error} onRetry={list.reload} />
        ) : items.length === 0 ? (
          <EmptyState
            icon="bell"
            title="No notifications"
            body="Updates about your enquiries, visits and listings will appear here."
          />
        ) : (
          groups.map(g => (
            <View key={g.day}>
              <T style={styles.day}>{g.day}</T>
              <View style={styles.list}>
                {g.items.map(n => {
                  const unread = isUnread(n);
                  return (
                    <SwipeAction
                      key={n._id}
                      label="Dismiss"
                      icon="x"
                      tone="#64748B"
                      onAction={() => dismiss(n)}
                    >
                      <Press
                        onPress={() => open(n)}
                        pressScale={0.99}
                        style={[
                          styles.item,
                          unread ? styles.itemUnread : styles.itemRead,
                        ]}
                      >
                        <View
                          style={[
                            styles.icon,
                            unread ? styles.iconUnread : styles.iconRead,
                          ]}
                        >
                          {unread && <GlowPulse size={36} />}
                          <Icon name={iconFor(n)} size={16} color="#1A6FFF" />
                        </View>
                        <View style={styles.flex}>
                          <View style={styles.titleRow}>
                            <T style={styles.title}>
                              {n.title || 'Builtglory'}
                            </T>
                            {unread && <View style={styles.dot} />}
                          </View>
                          {n.message ? (
                            <T style={styles.message}>{n.message}</T>
                          ) : null}
                        </View>
                        <T style={styles.time}>{shortAge(n.createdAt)}</T>
                      </Press>
                    </SwipeAction>
                  );
                })}
              </View>
            </View>
          ))
        )}
        {list.loadingMore && <LoadingState style={styles.more} />}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: tw('flex-1 min-w-0'),
  body: { ...tw('px-4'), gap: 16 },
  markAll: tw('text-brand-600 text-[12px] font-semibold'),
  day: tw(
    'text-[11px] font-semibold text-ink-500 uppercase tracking-wider mb-2',
  ),
  list: { gap: 8 },
  item: tw('p-3 rounded-card border flex gap-3 bg-white'),
  itemUnread: {
    borderColor: palette.brand[200],
    backgroundColor: withAlpha(palette.brand[50], 0.4),
  },
  itemRead: tw('border-ink-200'),
  icon: tw('w-9 h-9 rounded-full items-center justify-center shrink-0'),
  iconUnread: tw('bg-brand-100'),
  iconRead: tw('bg-brand-50'),
  titleRow: tw('flex items-start justify-between gap-2'),
  title: tw('flex-1 text-[13px] font-semibold'),
  dot: tw('w-2 h-2 rounded-full bg-brand-600 mt-1.5 shrink-0'),
  message: tw('text-[11.5px] text-ink-500 mt-0.5'),
  time: tw('text-[10.5px] text-ink-400 shrink-0'),
  more: tw('py-4'),
});
