import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Btn } from '../../components/Btn';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import {
  pickLabel,
  VisitPicker,
  type VisitPick,
} from '../../components/VisitPicker';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { createBuyEnquiry } from '../../services/enquiry.service';
import { createVisit } from '../../services/visit.service';
import { tw } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';

/** B-12 Schedule a site visit (POST /visits, linked to the buyer's enquiry). */
export function VisitCalendarScreen({ params }: ScreenProps<'visitCalendar'>) {
  const nav = useNav();
  const { property } = params;
  const [pick, setPick] = useState<VisitPick | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    if (!pick?.slot) return;
    setSaving(true);
    setError(null);
    try {
      let enquiryId = params.enquiryId;
      if (!enquiryId && params.pendingEnquiry) {
        const enquiry = await createBuyEnquiry({
          ...params.pendingEnquiry,
          preferredVisitDate: pick.date,
          preferredVisitTimeSlot: pick.slot,
        });
        enquiryId = enquiry._id;
      }
      const visit = await createVisit({
        propertyId: property.id,
        enquiryId,
        visitDate: pick.date,
        visitTime: pick.slot,
        visitType: 'physical',
      });
      nav.go('visitConfirmation', { visit, property });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen topBar={{ title: 'Schedule a visit', back: true }}>
      <View style={styles.body}>
        <VisitPicker propertyId={property.id} value={pick} onChange={setPick} />
        {pick?.slot ? (
          <View style={styles.summary}>
            <Icon name="calendar" size={14} color="#1A6FFF" />
            <T style={styles.summaryText}>
              Visit on{' '}
              <T style={styles.bold}>{`${pickLabel(pick.date)} at ${
                pick.slot
              }`}</T>
            </T>
          </View>
        ) : null}
        {error && <T style={styles.error}>{error}</T>}
        <Btn
          style={styles.cta}
          onPress={confirm}
          disabled={!pick?.slot}
          loading={saving}
        >
          Confirm visit
        </Btn>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: tw('px-4'),
  summary: tw('mt-4 p-3 bg-ink-50 rounded-card flex items-center gap-2'),
  summaryText: tw('flex-1 text-[12px]'),
  bold: tw('text-[12px] font-bold'),
  error: tw('mt-3 text-[12px] text-rose-600'),
  cta: tw('w-full mt-4'),
});
