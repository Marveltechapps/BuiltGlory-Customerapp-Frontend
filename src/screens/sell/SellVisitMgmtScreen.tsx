import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Badge, Field, Input } from '../../components/Form';
import { Icon } from '../../components/Icon';
import { Grid } from '../../components/Layout';
import { Press } from '../../components/Press';
import { Screen, SolidButton } from '../../components/Screen';
import { Sheet } from '../../components/Sheet';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { T } from '../../components/T';
import { VisitPicker, type VisitPick } from '../../components/VisitPicker';
import { useToast } from '../../context/ToastContext';
import { useRefocus } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { actOnSellerVisit, saveSellerAvailability } from '../../services/sellRequest.service';
import type { SellerActivity, SellerVisit } from '../../types/sellRequest';
import { palette, tw } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { DAYS_SHORT, toDate } from '../../utils/format';
import { buzz } from '../../utils/haptics';
import { useSellerActivity } from './sellShared';

const SLOTS = ['9–11 AM', '11–1 PM', '3–5 PM', '5–7 PM'];
const OPEN = ['scheduled', 'rescheduled'];

/**
 * Seller visit scheduling. Requests come from the seller activity; confirming or proposing another time uses
 * POST /me/sell-requests/:id/visits/:visitId/action. Availability chips are saved with
 * PUT /me/sell-requests/:id/availability.
 */
export function SellVisitMgmtScreen({ params }: ScreenProps<'sellVisitMgmt'>) {
  const toast = useToast();
  const res = useSellerActivity(params.id);
  useRefocus(res.refresh);
  const [override, setOverride] = useState<SellerActivity | null>(null);
  const a = override ?? res.data;
  const visits = a?.visits ?? [];
  const [slots, setSlots] = useState<string[]>(['9–11 AM', '3–5 PM', '5–7 PM']);
  const [busy, setBusy] = useState<string | null>(null);
  const [moving, setMoving] = useState<SellerVisit | null>(null);
  const [pick, setPick] = useState<VisitPick | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (a?.availability?.length) setSlots(a.availability);
  }, [a?.availability]);
  const toggleSlot = (sl: string) => {
    buzz();
    setSlots(prev => {
      const next = prev.includes(sl)
        ? prev.filter(x => x !== sl)
        : [...prev, sl];
      saveSellerAvailability(params.id, next).catch(() => toast.show('Could not save availability', 'error'));
      return next;
    });
  };

  const act = async (
    visit: SellerVisit,
    body: Parameters<typeof actOnSellerVisit>[2],
  ) => {
    setBusy(visit._id);
    try {
      setOverride(await actOnSellerVisit(params.id, visit._id, body));
      buzz();
      return true;
    } catch (e) {
      toast.show(errorMessage(e), 'error');
      return false;
    } finally {
      setBusy(null);
    }
  };
  const proposeTime = async () => {
    if (!moving || !pick?.slot) return;
    const ok = await act(moving, {
      action: 'reschedule',
      visitDate: pick.date,
      visitTime: pick.slot,
      reason: reason.trim() || null,
    });
    if (ok) {
      toast.show('New time sent to the buyer');
      setMoving(null);
      setPick(null);
      setReason('');
    }
  };

  const requested = visits.filter(v => OPEN.includes(v.status)).length;
  const confirmed = visits.filter(v => v.status === 'confirmed').length;
  const propertyId = a?.property?._id;

  return (
    <Screen
      topBar={{
        title: 'Visit scheduling',
        sub: a ? `${requested} requests · ${confirmed} confirmed` : undefined,
        back: true,
      }}
      refreshing={res.refreshing}
      onRefresh={res.refresh}
    >
      <View style={styles.body}>
        <T style={styles.h3}>Your availability</T>
        <Grid cols={4} gap={8} style={styles.mb5}>
          {SLOTS.map(sl => {
            const on = slots.includes(sl);
            return (
              <Press
                key={sl}
                onPress={() => toggleSlot(sl)}
                style={[styles.slot, on ? styles.slotOn : styles.slotOff]}
              >
                <T
                  style={[
                    styles.slotText,
                    { color: on ? palette.emerald[700] : palette.ink[500] },
                  ]}
                >
                  {sl}
                </T>
              </Press>
            );
          })}
        </Grid>
        <T style={styles.h3}>Visit requests</T>
        {res.loading && !a ? (
          <LoadingState />
        ) : res.error && !a ? (
          <ErrorState message={res.error} onRetry={res.reload} />
        ) : visits.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="No visit requests yet"
            body="Buyers' site visit requests for your listing will appear here."
          />
        ) : (
          <View style={styles.list}>
            {visits.map(v => {
              const d = toDate(v.visitDate);
              return (
                <View key={v._id} style={styles.card}>
                  <View style={styles.day}>
                    <T style={styles.dow}>{d ? DAYS_SHORT[d.getDay()] : ''}</T>
                    <T style={styles.date}>{d ? d.getDate() : '—'}</T>
                  </View>
                  <View style={styles.flex}>
                    <T style={styles.name}>{v.referenceId}</T>
                    <T style={styles.time}>
                      {v.visitTime ?? '—'}
                      {v.visitType === 'virtual' ? ' · Video tour' : ''}
                    </T>
                  </View>
                  {v.status === 'confirmed' ? (
                    <Badge color="green" icon="check">
                      Confirmed
                    </Badge>
                  ) : v.status === 'cancelled' || v.status === 'missed' ? (
                    <Badge color="rose" icon="x">
                      {v.status === 'missed' ? 'Missed' : 'Cancelled'}
                    </Badge>
                  ) : v.status === 'completed' ? (
                    <Badge color="ink">Completed</Badge>
                  ) : (
                    <View style={styles.decide}>
                      <Press
                        disabled={busy !== null}
                        onPress={() => act(v, { action: 'confirm' })}
                        style={[styles.round, styles.ok]}
                        accessibilityLabel="Confirm visit"
                      >
                        <Icon name="check" size={14} color="#10B981" />
                      </Press>
                      <Press
                        disabled={busy !== null || !propertyId}
                        onPress={() => setMoving(v)}
                        style={[styles.round, styles.no]}
                        accessibilityLabel="Suggest another time"
                      >
                        <Icon name="x" size={14} color="#E11D48" />
                      </Press>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>
      <Sheet
        visible={!!moving}
        onClose={() => setMoving(null)}
        title="Suggest another time"
      >
        {moving && propertyId ? (
          <View style={styles.sheet}>
            <VisitPicker
              propertyId={propertyId}
              visitType={
                moving.visitType === 'virtual' ? 'virtual' : 'physical'
              }
              value={pick}
              onChange={setPick}
            />
            <Field label="Reason (optional)">
              <Input
                value={reason}
                onChangeText={setReason}
                placeholder="e.g. Not available that morning"
                maxLength={500}
              />
            </Field>
            <SolidButton
              label="Send New Time"
              disabled={!pick?.slot}
              loading={busy === moving._id}
              onPress={proposeTime}
            />
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: tw('flex-1'),
  body: tw('px-4'),
  h3: tw('text-[13px] font-semibold mb-2'),
  mb5: tw('mb-5'),
  slot: tw('py-2 rounded-card border items-center'),
  slotOn: tw('border-emerald-500 bg-emerald-50'),
  slotOff: tw('border-ink-200'),
  slotText: tw('text-[11px] font-bold'),
  list: { gap: 8 },
  card: tw('p-3 rounded-card border border-ink-200 flex items-center gap-3'),
  day: tw(
    'w-12 h-12 rounded-card bg-brand-50 items-center justify-center shrink-0',
  ),
  dow: tw('text-[9px] uppercase text-brand-700'),
  date: tw('text-[14px] font-bold leading-none text-brand-700'),
  name: tw('text-[13px] font-semibold'),
  time: tw('text-[11px] text-ink-500'),
  decide: tw('flex gap-1'),
  round: tw('w-8 h-8 rounded-full items-center justify-center'),
  ok: {
    ...tw('bg-emerald-50'),
    boxShadow: `0 0 0 1px ${palette.emerald[200]}`,
  },
  no: { ...tw('bg-rose-50'), boxShadow: `0 0 0 1px ${palette.rose[200]}` },
  sheet: { gap: 16 },
});
