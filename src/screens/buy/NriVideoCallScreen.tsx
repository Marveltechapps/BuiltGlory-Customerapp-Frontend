import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from '../../components/Icon';
import { Grid } from '../../components/Layout';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { Press } from '../../components/Press';
import { Screen, ScreenFooter, SolidButton } from '../../components/Screen';
import { ErrorState, LoadingState } from '../../components/States';
import { T } from '../../components/T';
import { useResource } from '../../lib/useResource';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { createVisit, getAvailability } from '../../services/visit.service';
import { tw } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import {
  formatINR,
  formatShortDate,
  fromIsoDate,
  isoDate,
} from '../../utils/format';

export const VIDEO_LANGUAGES: Array<[string, string]> = [
  ['english', 'English'],
  ['tamil', 'Tamil'],
  ['hindi', 'Hindi'],
  ['kannada', 'Kannada'],
];

/** B-13a NRI live video tour: books a virtual visit (POST /visits, visitType "virtual"). */
export function NriVideoCallScreen({ params }: ScreenProps<'nriVideoCall'>) {
  const nav = useNav();
  const { property: p, enquiryId } = params;
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [language, setLanguage] = useState('english');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = useMemo(() => {
    const d = new Date();
    return isoDate(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));
  }, []);
  const avail = useResource(
    signal =>
      getAvailability(
        { propertyId: p.id, visitType: 'virtual', from, days: 7 },
        signal,
      ),
    [p.id, from],
  );
  const dates = useMemo(
    () =>
      (avail.data?.days ?? [])
        .filter(d => d.slots.some(s => s.available))
        .slice(0, 5),
    [avail.data],
  );
  const slots = dates.find(d => d.date === selectedDate)?.slots ?? [];

  const ready = Boolean(selectedDate && selectedSlot);
  const schedule = async () => {
    if (!ready) return;
    setSaving(true);
    setError(null);
    try {
      const visit = await createVisit({
        propertyId: p.id,
        enquiryId,
        visitDate: selectedDate,
        visitTime: selectedSlot,
        visitType: 'virtual',
        language,
      });
      nav.go('nriVideoConfirm', { property: p, visit, language });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      topBar={{
        title: 'Schedule Video Call',
        sub: 'NRI Property Tour',
        back: true,
      }}
      footer={
        <ScreenFooter>
          {error && <T style={styles.error}>{error}</T>}
          <SolidButton
            label="Schedule Video Call"
            disabled={!ready}
            loading={saving}
            onPress={schedule}
          />
        </ScreenFooter>
      }
    >
      <View style={styles.body}>
        <View style={styles.prop}>
          <PhotoPlaceholder tag={p.id} src={p.images[0]} style={styles.thumb} />
          <View style={styles.propText}>
            <T style={styles.propTitle} numberOfLines={1}>
              {p.title}
            </T>
            <T style={styles.propPlace} numberOfLines={1}>
              {p.location}
            </T>
            <T style={styles.propPrice}>{formatINR(p.price)}</T>
          </View>
        </View>

        <View style={styles.mb4}>
          <T style={styles.label}>Preferred Language</T>
          <Grid cols={2} gap={8}>
            {VIDEO_LANGUAGES.map(([code, name]) => (
              <Press
                key={code}
                onPress={() => setLanguage(code)}
                style={[
                  styles.opt,
                  language === code ? styles.optOn : styles.optOff,
                ]}
              >
                <T
                  style={[
                    styles.optText,
                    language === code && styles.optTextOn,
                  ]}
                >
                  {name}
                </T>
              </Press>
            ))}
          </Grid>
        </View>

        <View style={styles.mb4}>
          <T style={styles.label}>Select Date</T>
          {avail.loading ? (
            <LoadingState style={styles.load} />
          ) : avail.error ? (
            <ErrorState compact message={avail.error} onRetry={avail.reload} />
          ) : dates.length === 0 ? (
            <T style={styles.none}>No video call slots in the next 7 days.</T>
          ) : (
            <Grid cols={3} gap={8}>
              {dates.map(d => (
                <Press
                  key={d.date}
                  onPress={() => {
                    setSelectedDate(d.date);
                    setSelectedSlot('');
                  }}
                  style={[
                    styles.date,
                    selectedDate === d.date ? styles.optOn : styles.optOff,
                  ]}
                >
                  <T
                    style={[
                      styles.optText,
                      selectedDate === d.date && styles.optTextOn,
                    ]}
                  >
                    {formatShortDate(fromIsoDate(d.date))}
                  </T>
                </Press>
              ))}
            </Grid>
          )}
        </View>

        <View style={styles.mb6}>
          <T style={styles.label}>Select Time (IST)</T>
          <View style={styles.slots}>
            {selectedDate ? (
              slots.map(s => (
                <Press
                  key={s.time}
                  disabled={!s.available}
                  onPress={() => setSelectedSlot(s.time)}
                  pressScale={0.99}
                  style={[
                    styles.slot,
                    selectedSlot === s.time ? styles.optOn : styles.optOff,
                    !s.available && styles.booked,
                  ]}
                >
                  <T
                    style={[
                      styles.slotText,
                      selectedSlot === s.time && styles.optTextOn,
                    ]}
                  >
                    {s.time}
                  </T>
                </Press>
              ))
            ) : (
              <T style={styles.none}>
                Select a date to see the available times.
              </T>
            )}
          </View>
        </View>

        <View style={styles.info}>
          <Icon name="info" size={16} color="#2563EB" style={styles.infoIcon} />
          <View style={styles.flex}>
            <T style={styles.infoTitle}>Live Video Tour</T>
            <T style={styles.infoBody}>
              Our advisor will give you a complete property walkthrough via
              video call. Duration: 30-45 minutes.
            </T>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: tw('flex-1'),
  body: tw('px-4'),
  prop: tw('rounded-card border border-ink-200 p-3 mb-4 flex gap-3'),
  thumb: { ...tw('rounded-md shrink-0'), width: 56, height: 56 },
  propText: tw('flex-1 min-w-0'),
  propTitle: tw('text-[13px] font-semibold'),
  propPlace: tw('text-[11px] text-ink-500'),
  propPrice: tw('text-[12px] font-bold text-brand-600'),
  mb4: tw('mb-4'),
  mb6: tw('mb-6'),
  label: tw('text-[13px] font-semibold text-ink-900 mb-2'),
  opt: tw('py-2.5 rounded-card border items-center'),
  date: tw('py-2 rounded-card border items-center'),
  optOn: tw('border-brand-600 bg-brand-50'),
  optOff: tw('border-ink-200'),
  optText: tw('text-[12px] font-medium'),
  optTextOn: tw('text-brand-700'),
  slots: { gap: 8 },
  slot: tw('w-full p-3 rounded-card border'),
  slotText: tw('text-[13px] font-medium'),
  booked: { opacity: 0.4 },
  load: tw('py-4'),
  none: tw('text-[12px] text-ink-400 py-2'),
  info: tw(
    'rounded-card bg-blue-50 border border-blue-200 p-4 mb-4 flex gap-2',
  ),
  infoIcon: { marginTop: 2 },
  infoTitle: tw('text-[12px] font-semibold text-blue-900'),
  infoBody: tw('text-[11px] text-blue-700 mt-0.5'),
  error: tw('text-[12px] text-rose-600 mb-2'),
});
