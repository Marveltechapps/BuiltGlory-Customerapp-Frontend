import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Btn } from '../../components/Btn';
import { StatusHero } from '../../components/Hero';
import { Icon } from '../../components/Icon';
import { Grid } from '../../components/Layout';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { Press } from '../../components/Press';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { pickLabel } from '../../components/VisitPicker';
import { useAuth } from '../../context/AuthContext';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { tw, twh } from '../../theme';
import { dateKey, formatINR, fromIsoDate } from '../../utils/format';
import { calendarUrl, mapsUrl, openUrl } from '../../utils/links';

/** Start of a visit slot ("11:00 AM") on its day, for the calendar template link. */
function slotStart(date: string, slot?: string) {
  const d = fromIsoDate(date);
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(slot ?? '');
  if (m)
    d.setHours(
      (Number(m[1]) % 12) + (m[3].toUpperCase() === 'PM' ? 12 : 0),
      Number(m[2]),
    );
  return d;
}

/** B-13 Visit booked / rescheduled. */
export function VisitConfirmationScreen({
  params,
}: ScreenProps<'visitConfirmation'>) {
  const nav = useNav();
  const { user } = useAuth();
  const { visit, property: p, rescheduled } = params;
  const isNRI = user?.userType === 'nri' || user?.userType === 'pio';
  const day = dateKey(visit.visitDate);
  const title = p?.title ?? params.propertyTitle ?? 'Property visit';
  const place = p ? [p.location, p.city].filter(Boolean).join(', ') : '';

  const addToCalendar = () =>
    openUrl(
      calendarUrl(
        `Site visit: ${title}`,
        slotStart(day, visit.visitTime),
        60,
        p?.fullAddress || place,
      ),
    );

  return (
    <Screen>
      <View style={styles.head}>
        <StatusHero icon="calendar-check" tone="success" />
        <T style={styles.title}>
          {rescheduled ? 'Visit rescheduled!' : 'Visit confirmed!'}
        </T>
        <Press
          onPress={addToCalendar}
          pressScale={1}
          accessibilityLabel="Add to calendar"
        >
          <T style={styles.sub}>Add it to your calendar.</T>
        </Press>
      </View>
      <View style={styles.body}>
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <T style={styles.cardLabel}>Your visit</T>
            <T style={styles.cardDate}>{pickLabel(day)}</T>
            <T style={styles.cardSlot}>{visit.visitTime ?? '—'}</T>
          </View>
          <View style={styles.cardBody}>
            <View style={styles.propRow}>
              <PhotoPlaceholder
                tag={p?.id ?? visit.propertyId}
                src={p?.images[0]}
                style={styles.thumb}
              />
              <View style={styles.propText}>
                <T style={styles.propTitle} numberOfLines={1}>
                  {title}
                </T>
                {place ? <T style={styles.propPlace}>{place}</T> : null}
                {p ? (
                  <T style={styles.propPrice}>{formatINR(p.price)}</T>
                ) : null}
              </View>
            </View>
            <Grid cols={2} gap={8} style={styles.meta}>
              <View>
                <T style={styles.metaLabel}>Advisor</T>
                <T style={styles.metaValue}>
                  {visit.assignedAdmin ? 'Assigned' : 'To be assigned'}
                </T>
              </View>
              <View>
                <T style={styles.metaLabel}>Reference</T>
                <T style={styles.metaValue}>#{visit.referenceId}</T>
              </View>
            </Grid>
          </View>
        </View>

        {isNRI && p && (
          <View style={styles.nri}>
            <View style={styles.nriRow}>
              <View style={styles.nriIcon}>
                <Icon name="video" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.flex}>
                <T style={styles.nriTitle}>Video Call Available</T>
                <T style={styles.nriBody}>
                  Schedule a live video tour with our advisor before visiting in
                  person.
                </T>
              </View>
            </View>
            <Press
              onPress={() =>
                nav.go('nriVideoCall', {
                  property: p,
                  enquiryId: visit.enquiryId,
                })
              }
              pressScale={0.98}
              style={styles.nriBtn}
            >
              <Icon name="video" size={14} color="#FFFFFF" />
              <T style={styles.nriBtnText}>Schedule Video Call</T>
            </Press>
          </View>
        )}

        <Grid cols={2} gap={8} style={styles.mb3}>
          <Btn
            variant="outline"
            icon="map-pin"
            onPress={() =>
              openUrl(
                mapsUrl({
                  latitude: p?.latitude,
                  longitude: p?.longitude,
                  query: p?.fullAddress || place || title,
                }),
              )
            }
            style={styles.stretch}
          >
            Directions
          </Btn>
          <Btn
            variant="outline"
            icon="calendar"
            onPress={() =>
              nav.go('rescheduleVisit', {
                visit,
                property: p,
                propertyTitle: params.propertyTitle,
              })
            }
            style={styles.stretch}
          >
            Reschedule
          </Btn>
        </Grid>
        <Btn style={styles.full} onPress={() => nav.jump('home')}>
          Done
        </Btn>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: tw('flex-1'),
  head: tw('px-4 pt-8 items-center'),
  title: { ...twh('text-[22px] font-bold text-center') },
  sub: tw('text-ink-500 mt-2 text-[13px] text-center'),
  body: tw('px-4 mt-6'),
  card: tw('rounded-card border border-ink-200 overflow-hidden mb-4'),
  cardHead: tw('bg-brand-600 px-4 py-3'),
  cardLabel: {
    ...tw('text-[11px] uppercase tracking-wider text-white'),
    opacity: 0.8,
  },
  cardDate: tw('text-[18px] font-bold mt-1 text-white'),
  cardSlot: tw('text-[13px] text-white'),
  cardBody: { ...tw('p-4'), gap: 12 },
  propRow: tw('flex gap-3'),
  thumb: { ...tw('rounded-md shrink-0'), width: 60, height: 60 },
  propText: tw('flex-1 min-w-0'),
  propTitle: tw('text-[13px] font-semibold'),
  propPlace: tw('text-[11px] text-ink-500'),
  propPrice: tw('text-[12px] font-bold text-brand-600 mt-0.5'),
  meta: tw('pt-2 border-t border-ink-100'),
  metaLabel: tw('text-[10px] text-ink-500'),
  metaValue: tw('text-[12px] font-semibold'),
  nri: tw('rounded-card border border-blue-200 bg-blue-50 p-4 mb-4'),
  nriRow: tw('flex items-start gap-3'),
  nriIcon: tw(
    'w-10 h-10 rounded-full bg-blue-600 items-center justify-center shrink-0',
  ),
  nriTitle: tw('text-[13px] font-semibold text-blue-900'),
  nriBody: tw('text-[12px] text-blue-700 mt-0.5'),
  nriBtn: tw(
    'w-full mt-3 h-10 rounded-card bg-blue-600 flex items-center justify-center gap-2',
  ),
  nriBtnText: tw('text-white font-semibold text-[13px]'),
  mb3: tw('mb-3'),
  stretch: { alignSelf: 'stretch' },
  full: tw('w-full'),
});
