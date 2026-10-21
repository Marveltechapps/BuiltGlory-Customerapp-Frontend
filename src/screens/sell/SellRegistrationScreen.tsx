import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Btn } from '../../components/Btn';
import { Icon } from '../../components/Icon';
import { Divided } from '../../components/Layout';
import { Press } from '../../components/Press';
import { Screen, ScreenFooter, SolidButton } from '../../components/Screen';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { T } from '../../components/T';
import { useToast } from '../../context/ToastContext';
import { useNav, useRefocus } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { tw } from '../../theme';
import { formatLongDate, formatTime, toDate } from '../../utils/format';
import { calendarUrl, mapsUrl, openUrl } from '../../utils/links';
import { listingTitle, useSellerActivity } from './sellShared';

/** Registration appointment as written by the admin dashboard (`registrationAppointment` or `registration`). */
export function parseAppointment(raw: unknown) {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const str = (...keys: string[]) =>
    keys.map(k => r[k]).find(v => typeof v === 'string' && v.trim()) as
      | string
      | undefined;
  const date = toDate(
    str(
      'dateTime',
      'date',
      'appointmentDate',
      'registrationDate',
      'scheduledAt',
    ),
  );
  if (!date) return null;
  const time = str('time', 'slot', 'appointmentTime');
  return {
    date,
    time:
      time ?? (date.getHours() || date.getMinutes() ? formatTime(date) : null),
    office:
      str('office', 'registrationOffice', 'location', 'venue') ??
      'Sub-Registrar Office',
    address: str('address', 'officeAddress', 'subRegistrarName') ?? null,
  };
}

/** SL-16 Registration appointment (`registration` from GET /me/sell-requests/:id/activity). */
export function SellRegistrationScreen({
  params,
}: ScreenProps<'sellRegistration'>) {
  const nav = useNav();
  const toast = useToast();
  const res = useSellerActivity(params.id);
  useRefocus(res.refresh);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const reg = res.data?.registration;
  const appt = parseAppointment(reg?.appointment);
  const docs = reg?.checklist ?? [];
  const allChecked = docs.length > 0 && docs.every(d => checks[d]);

  const addToCalendar = async () => {
    if (!appt) return;
    const ok = await openUrl(
      calendarUrl(
        `Property registration: ${listingTitle(res.data?.sellRequest)}`,
        appt.date,
        120,
        [appt.office, appt.address].filter(Boolean).join(', '),
      ),
    );
    if (!ok) toast.show('Could not open your calendar', 'error');
  };

  return (
    <Screen
      topBar={{ title: 'Registration Appointment', back: true }}
      refreshing={res.refreshing}
      onRefresh={res.refresh}
      footer={
        appt ? (
          <ScreenFooter>
            <SolidButton
              label="Confirm Appointment"
              disabled={!allChecked}
              onPress={() => nav.go('dealComplete', { id: params.id })}
            />
          </ScreenFooter>
        ) : undefined
      }
    >
      <View style={styles.body}>
        {res.loading ? (
          <LoadingState />
        ) : res.error ? (
          <ErrorState message={res.error} onRetry={res.reload} />
        ) : !appt ? (
          <EmptyState
            icon="calendar-clock"
            title="Appointment not booked yet"
            body="The Builtglory team books the Sub-Registrar slot once documentation is complete. It will appear here."
          />
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <T style={styles.cardLabel}>Appointment</T>
                <T style={styles.cardDate}>{formatLongDate(appt.date)}</T>
                {appt.time ? <T style={styles.cardTime}>{appt.time}</T> : null}
              </View>
              <Press
                onPress={() =>
                  openUrl(
                    mapsUrl({
                      query: [appt.office, appt.address]
                        .filter(Boolean)
                        .join(', '),
                    }),
                  )
                }
                pressScale={1}
                pressedStyle={styles.pressed}
                style={styles.office}
              >
                <View style={styles.officeIcon}>
                  <Icon name="landmark" size={18} color="#1A6FFF" />
                </View>
                <View style={styles.flex}>
                  <T style={styles.officeName}>{appt.office}</T>
                  {appt.address ? (
                    <T style={styles.officeSub}>{appt.address}</T>
                  ) : null}
                </View>
                <Icon name="map-pin" size={16} color="#1A6FFF" />
              </Press>
            </View>
            <T style={styles.h3}>Documents to carry</T>
            <Divided style={styles.list}>
              {docs.map(d => (
                <Press
                  key={d}
                  pressScale={1}
                  onPress={() => setChecks(c => ({ ...c, [d]: !c[d] }))}
                  style={styles.check}
                >
                  <View
                    style={[
                      styles.box,
                      checks[d] ? styles.boxOn : styles.boxOff,
                    ]}
                  >
                    {checks[d] && (
                      <Icon
                        name="check"
                        size={12}
                        color="#FFFFFF"
                        strokeWidth={3}
                      />
                    )}
                  </View>
                  <T style={[styles.checkText, checks[d] && styles.checkDone]}>
                    {d}
                  </T>
                </Press>
              ))}
            </Divided>
            <Btn
              variant="outline"
              style={styles.full}
              icon="calendar-plus"
              onPress={addToCalendar}
            >
              Add to Calendar
            </Btn>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: tw('flex-1'),
  full: tw('w-full'),
  body: tw('px-4 pb-24'),
  card: tw('rounded-card border border-ink-200 overflow-hidden mb-4'),
  cardHead: tw('bg-brand-600 px-4 py-3'),
  cardLabel: {
    ...tw('text-[11px] uppercase tracking-wider text-white'),
    opacity: 0.8,
  },
  cardDate: tw('text-[20px] font-bold mt-1 text-white'),
  cardTime: tw('text-[13px] text-white'),
  office: tw('w-full flex items-center gap-3 p-3.5'),
  pressed: tw('bg-ink-50'),
  officeIcon: tw(
    'w-10 h-10 rounded-full bg-brand-50 items-center justify-center shrink-0',
  ),
  officeName: tw('text-[13px] font-semibold'),
  officeSub: tw('text-[11.5px] text-ink-500'),
  h3: tw('text-[14px] font-semibold mb-2'),
  list: tw('rounded-card border border-ink-200 mb-4'),
  check: tw('w-full flex items-center gap-3 p-3'),
  box: tw('w-5 h-5 rounded-md border-2 items-center justify-center shrink-0'),
  boxOn: tw('bg-brand-600 border-brand-600'),
  boxOff: tw('border-ink-300'),
  checkText: tw('flex-1 text-[13px] text-ink-800'),
  checkDone: { ...tw('text-ink-400'), textDecorationLine: 'line-through' },
});
