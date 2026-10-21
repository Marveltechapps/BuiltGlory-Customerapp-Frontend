import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Btn } from '../../components/Btn';
import { Badge } from '../../components/Form';
import { Icon } from '../../components/Icon';
import { Screen, ScreenFooter } from '../../components/Screen';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { T } from '../../components/T';
import { useNav, useRefocus } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { palette, tw } from '../../theme';
import { formatINR } from '../../utils/format';
import { useSellerActivity } from './sellShared';

const STATUS: Record<
  string,
  { label: string; color: 'green' | 'amber' | 'ink' }
> = {
  paid: { label: 'Paid', color: 'green' },
  pending: { label: 'Pending', color: 'amber' },
  upcoming: { label: 'Upcoming', color: 'ink' },
};

/** SL-15 Payout schedule (`payoutSchedule` from GET /me/sell-requests/:id/activity). */
export function PaymentScheduleScreen({
  params,
}: ScreenProps<'paymentSchedule'>) {
  const nav = useNav();
  const res = useSellerActivity(params.id);
  useRefocus(res.refresh);
  const items = res.data?.payoutSchedule ?? [];
  const total = items.reduce((n, i) => n + i.amount, 0);

  return (
    <Screen
      topBar={{ title: 'Payment Schedule', back: true }}
      refreshing={res.refreshing}
      onRefresh={res.refresh}
      footer={
        items.length ? (
          <ScreenFooter>
            <Btn
              style={styles.full}
              onPress={() => nav.go('sellRegistration', { id: params.id })}
            >
              Confirm Schedule
            </Btn>
          </ScreenFooter>
        ) : undefined
      }
    >
      <View style={styles.body}>
        {res.loading ? (
          <LoadingState />
        ) : res.error ? (
          <ErrorState message={res.error} onRetry={res.reload} />
        ) : items.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="Schedule not ready yet"
            body="Your payout schedule appears once the offer is agreed."
          />
        ) : (
          <>
            <View style={styles.list}>
              {items.map(item => {
                const st = STATUS[item.status] ?? {
                  label: item.status,
                  color: 'ink' as const,
                };
                return (
                  <View key={item.key} style={styles.card}>
                    <View style={styles.cardHead}>
                      <T style={styles.label}>{item.label}</T>
                      <T style={styles.amount}>{formatINR(item.amount)}</T>
                    </View>
                    <View style={styles.dueRow}>
                      <Icon
                        name="calendar"
                        size={12}
                        color={palette.ink[500]}
                      />
                      <T style={styles.due}>{item.dueLabel}</T>
                      <Badge color={st.color} style={styles.badge}>
                        {st.label}
                      </Badge>
                    </View>
                  </View>
                );
              })}
              <View style={[styles.card, styles.modeRow]}>
                <T style={styles.label}>Payment Mode</T>
                <View style={styles.mode}>
                  <Icon name="building-2" size={14} color="#64748B" />
                  <T style={styles.modeText}>Bank Transfer (escrow)</T>
                </View>
              </View>
            </View>
            <View style={styles.total}>
              <T style={styles.totalLabel}>Total</T>
              <T style={styles.totalValue}>{formatINR(total)}</T>
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  full: tw('w-full'),
  body: tw('px-4 pb-24'),
  list: { gap: 12 },
  card: tw('rounded-card border border-ink-200 p-4'),
  cardHead: tw('flex items-center justify-between mb-1'),
  label: tw('text-[13px] font-semibold'),
  amount: tw('text-[16px] font-bold text-brand-600'),
  dueRow: tw('flex items-center gap-1'),
  due: tw('flex-1 text-[11.5px] text-ink-500'),
  badge: { alignSelf: 'center' },
  modeRow: tw('flex items-center justify-between'),
  mode: tw('flex items-center gap-1.5'),
  modeText: tw('text-[13px] text-ink-700'),
  total: tw(
    'rounded-card bg-ink-900 p-4 mt-4 flex items-center justify-between',
  ),
  totalLabel: {
    ...tw('text-[12px] uppercase tracking-wider'),
    color: 'rgba(255,255,255,0.7)',
  },
  totalValue: tw('text-[22px] font-bold text-white'),
});
