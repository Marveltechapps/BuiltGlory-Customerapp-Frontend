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
import { useResource } from '../../lib/useResource';
import { useNav, useRefocus } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { getMyEnquiry } from '../../services/enquiry.service';
import { tw } from '../../theme';
import {
  formatLongDate,
  formatRupees,
  formatTime,
  toDate,
} from '../../utils/format';
import { calendarUrl, mapsUrl, openUrl } from '../../utils/links';
import { enquiryTitle } from './DocumentsSharedScreen';

// Personal checklist from the reference (B-16); ticks stay on this screen only.
const DOCS = [
  'Original Sale Deed',
  'Aadhaar & PAN (buyer)',
  'Token payment receipt',
  '2 passport photos',
  'Witness ID proofs',
];

/** B-16 Registration appointment from `deal.documentation.registration` (set by the Builtglory team). */
export function RegistrationDetailsScreen({
  params,
}: ScreenProps<'registrationDetails'>) {
  const nav = useNav();
  const toast = useToast();
  const res = useResource(
    signal => getMyEnquiry(params.enquiryId, signal),
    [params.enquiryId],
  );
  useRefocus(res.refresh);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const allChecked = DOCS.every(d => checks[d]);

  const reg = res.data?.deal?.documentation?.registration;
  const date = toDate(reg?.registrationDate);
  const hasTime = date
    ? date.getHours() !== 0 || date.getMinutes() !== 0
    : false;
  const office = reg?.registrationOffice || '';

  const addToCalendar = async () => {
    if (!date) return;
    const ok = await openUrl(
      calendarUrl(
        `Property registration: ${enquiryTitle(res.data)}`,
        date,
        120,
        office,
      ),
    );
    if (!ok) toast.show('Could not open your calendar', 'error');
  };

  return (
    <Screen
      topBar={{ title: 'Registration Details', back: true }}
      refreshing={res.refreshing}
      onRefresh={res.refresh}
      footer={
        date ? (
          <ScreenFooter>
            <SolidButton
              label="Deal Complete"
              tone="emerald"
              disabled={!allChecked}
              onPress={() => nav.jump('home')}
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
        ) : !date ? (
          <EmptyState
            icon="calendar-clock"
            title="Registration not scheduled yet"
            body="Your advisor will book the Sub-Registrar appointment after the token payment is verified. You'll see the date and office here."
          />
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <T style={styles.cardLabel}>Your appointment</T>
                <T style={styles.cardDate}>{formatLongDate(date)}</T>
                {hasTime ? (
                  <T style={styles.cardTime}>{formatTime(date)}</T>
                ) : null}
              </View>
              <Press
                onPress={() => office && openUrl(mapsUrl({ query: office }))}
                pressScale={1}
                pressedStyle={styles.pressed}
                style={styles.office}
              >
                <View style={styles.officeIcon}>
                  <Icon name="landmark" size={18} color="#1A6FFF" />
                </View>
                <View style={styles.flex}>
                  <T style={styles.officeName}>
                    {office || 'Sub-Registrar Office'}
                  </T>
                  {reg?.subRegistrarName ? (
                    <T style={styles.officeSub}>
                      Sub-Registrar: {reg.subRegistrarName}
                    </T>
                  ) : null}
                  {reg?.stampDuty || reg?.registrationFee ? (
                    <T style={styles.officeSub}>
                      {[
                        reg.stampDuty
                          ? `Stamp duty ${formatRupees(reg.stampDuty)}`
                          : null,
                        reg.registrationFee
                          ? `Fee ${formatRupees(reg.registrationFee)}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </T>
                  ) : null}
                </View>
                {office ? (
                  <Icon name="map-pin" size={16} color="#1A6FFF" />
                ) : null}
              </Press>
            </View>
            {reg?.notes ? <T style={styles.notes}>{reg.notes}</T> : null}

            <T style={styles.h3}>Documents to carry</T>
            <Divided style={styles.list}>
              {DOCS.map(d => (
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
                  <T
                    style={[
                      styles.checkText,
                      checks[d] && styles.checkTextDone,
                    ]}
                  >
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
  notes: tw('text-[12px] text-ink-600 mb-4 leading-relaxed'),
  h3: tw('text-[14px] font-semibold mb-2'),
  list: tw('rounded-card border border-ink-200 mb-4'),
  check: tw('w-full flex items-center gap-3 p-3'),
  box: tw('w-5 h-5 rounded-md border-2 items-center justify-center shrink-0'),
  boxOn: tw('bg-brand-600 border-brand-600'),
  boxOff: tw('border-ink-300'),
  checkText: tw('flex-1 text-[13px] text-ink-800'),
  checkTextDone: { ...tw('text-ink-400'), textDecorationLine: 'line-through' },
  full: tw('w-full'),
});
