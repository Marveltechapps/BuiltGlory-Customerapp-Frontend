import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Field } from '../../components/Form';
import { SelectField } from '../../components/Interactive';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { Screen, SolidButton } from '../../components/Screen';
import { Sheet } from '../../components/Sheet';
import { T } from '../../components/T';
import { useToast } from '../../context/ToastContext';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { cancelMyEnquiry } from '../../services/enquiry.service';
import { cancelVisit } from '../../services/visit.service';
import { tw } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';

const REASONS = ['Changed my mind', 'Found another property', 'Other'];

/**
 * B-17 Cancel confirmation sheet. Cancels a visit (PATCH /visits/:id/cancel, reason required)
 * or the whole enquiry (PATCH /me/buy-enquiries/:id/cancel, which takes no reason).
 */
export function CancelEnquiryScreen({ params }: ScreenProps<'cancelEnquiry'>) {
  const nav = useNav();
  const toast = useToast();
  const { visit, enquiryId } = params;
  const title = params.title || 'Your enquiry';
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tag = visit?.propertyId ?? enquiryId ?? title;

  const confirm = async () => {
    if (!reason) return;
    setSaving(true);
    setError(null);
    try {
      if (visit) await cancelVisit(visit._id, reason);
      else if (enquiryId) await cancelMyEnquiry(enquiryId);
      toast.show(visit ? 'Visit cancelled' : 'Enquiry cancelled');
      nav.back();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <Screen topBar={{ title: 'Enquiry Detail', sub: title, back: true }}>
        <View style={styles.dim} pointerEvents="none">
          <View style={styles.card}>
            <PhotoPlaceholder tag={tag} style={styles.thumb60} />
            <T style={styles.cardTitle}>{title}</T>
          </View>
        </View>
      </Screen>
      <Sheet
        visible
        onClose={nav.back}
        title={visit ? 'Cancel this visit?' : 'Cancel this enquiry?'}
      >
        <View style={styles.summary}>
          <PhotoPlaceholder tag={tag} style={styles.thumb44} />
          <T style={styles.summaryTitle} numberOfLines={2}>
            {title}
          </T>
        </View>
        <Field label="Reason for cancelling">
          <SelectField
            value={reason}
            placeholder="Select a reason"
            options={REASONS}
            onChange={setReason}
            title="Reason for cancelling"
          />
        </Field>
        {error && <T style={styles.error}>{error}</T>}
        <View style={styles.actions}>
          <SolidButton
            label={visit ? 'Cancel Visit' : 'Cancel Enquiry'}
            tone="rose"
            disabledStyle="faded"
            disabled={!reason}
            loading={saving}
            loadingLabel="Cancelling…"
            onPress={confirm}
          />
          <SolidButton
            label={visit ? 'Keep Visit' : 'Keep Enquiry'}
            tone="neutral"
            onPress={nav.back}
          />
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  dim: { ...tw('px-4'), opacity: 0.4 },
  card: tw('rounded-card border border-ink-200 p-3 flex gap-3 items-center'),
  thumb60: { ...tw('rounded-md shrink-0'), width: 60, height: 60 },
  cardTitle: tw('flex-1 text-[13px] font-semibold'),
  summary: tw('flex items-center gap-3 p-3 rounded-card bg-ink-50 mb-4'),
  thumb44: { ...tw('rounded-md shrink-0'), width: 44, height: 44 },
  summaryTitle: tw('flex-1 text-[13px] font-semibold'),
  error: tw('mt-3 text-[12px] text-rose-600'),
  actions: { ...tw('mt-5'), gap: 8 },
});
