import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from '../../components/Icon';
import { Screen, SolidButton } from '../../components/Screen';
import { T } from '../../components/T';
import {
  pickLabel,
  VisitPicker,
  type VisitPick,
} from '../../components/VisitPicker';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { rescheduleVisit } from '../../services/visit.service';
import { palette, tw } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { dateKey } from '../../utils/format';

/** B-12a Reschedule an existing visit (PATCH /visits/:visitId/reschedule). */
export function RescheduleVisitScreen({
  params,
}: ScreenProps<'rescheduleVisit'>) {
  const nav = useNav();
  const { visit, property } = params;
  const [pick, setPick] = useState<VisitPick | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unchanged =
    pick?.date === dateKey(visit.visitDate) && pick?.slot === visit.visitTime;

  const confirm = async () => {
    if (!pick?.slot) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await rescheduleVisit(visit._id, {
        visitDate: pick.date,
        visitTime: pick.slot,
      });
      nav.go('visitConfirmation', {
        visit: updated,
        property,
        propertyTitle: params.propertyTitle,
        rescheduled: true,
      });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen topBar={{ title: 'Reschedule Visit', back: true }}>
      <View style={styles.current}>
        <Icon name="calendar-x" size={16} color="#D97706" />
        <View>
          <T style={styles.currentLabel}>Current booking</T>
          <T style={styles.currentValue}>
            {pickLabel(dateKey(visit.visitDate))} · {visit.visitTime ?? '—'}
          </T>
        </View>
      </View>
      <View style={styles.body}>
        <VisitPicker
          propertyId={visit.propertyId}
          visitType={visit.visitType}
          value={pick}
          onChange={setPick}
        />
        {pick?.slot ? (
          <View style={styles.summary}>
            <Icon name="calendar-check" size={14} color="#1A6FFF" />
            <T style={styles.summaryText}>
              New visit:{' '}
              <T style={styles.bold}>{`${pickLabel(pick.date)} at ${
                pick.slot
              }`}</T>
            </T>
          </View>
        ) : null}
        {error && <T style={styles.error}>{error}</T>}
        <SolidButton
          label="Confirm Reschedule"
          loading={loading}
          loadingLabel="Rescheduling…"
          disabled={!pick?.slot || unchanged}
          onPress={confirm}
          height={52}
          style={[styles.cta, loading && styles.ctaLoading]}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  current: tw(
    'mx-4 mb-4 p-3 rounded-card bg-amber-50 border border-amber-200 flex items-start gap-2',
  ),
  currentLabel: tw('text-[12px] font-semibold text-amber-800'),
  currentValue: tw('text-[12px] text-amber-700'),
  body: tw('px-4'),
  summary: tw('mt-4 p-3 bg-ink-50 rounded-card flex items-center gap-2'),
  summaryText: tw('flex-1 text-[12px]'),
  bold: tw('text-[12px] font-bold'),
  error: tw('mt-3 text-[12px] text-rose-600'),
  cta: { ...tw('mt-4'), borderRadius: 14 },
  ctaLoading: { backgroundColor: palette.brand[400] },
});
