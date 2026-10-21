import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Btn } from '../../components/Btn';
import { StatusHero } from '../../components/Hero';
import { Grid } from '../../components/Layout';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { tw, twh } from '../../theme';
import { dateKey, formatShortDate, fromIsoDate } from '../../utils/format';
import { VIDEO_LANGUAGES } from './NriVideoCallScreen';

/** B-13b NRI video call booked. */
export function NriVideoConfirmScreen({
  params,
}: ScreenProps<'nriVideoConfirm'>) {
  const nav = useNav();
  const { property: p, visit, language } = params;
  const languageName =
    VIDEO_LANGUAGES.find(([code]) => code === language)?.[1] ?? 'English';
  return (
    <Screen fill>
      <View style={styles.center}>
        <View style={styles.inner}>
          <StatusHero icon="video" tone="info" />
          <T style={styles.title}>Video call scheduled!</T>
          <T style={styles.body}>
            Your NRI property tour is confirmed. Our advisor will call you at
            the scheduled time.
          </T>
          <View style={styles.card}>
            <T style={styles.cardLabel}>Call Details</T>
            <View>
              <T style={styles.k}>Property</T>
              <T style={styles.v}>{p.title}</T>
            </View>
            <Grid cols={2} gap={16}>
              <View>
                <T style={styles.k}>Date</T>
                <T style={styles.v}>
                  {formatShortDate(fromIsoDate(dateKey(visit.visitDate)))}
                </T>
              </View>
              <View>
                <T style={styles.k}>Time (IST)</T>
                <T style={styles.v}>{visit.visitTime ?? '—'}</T>
              </View>
            </Grid>
            <View>
              <T style={styles.k}>Language</T>
              <T style={styles.v}>{languageName}</T>
            </View>
            <T style={styles.note}>
              You'll receive a call link 10 minutes before the scheduled time
            </T>
          </View>
          <View style={styles.actions}>
            <Btn
              variant="outline"
              onPress={() => nav.go('myVisits')}
              style={styles.flex}
            >
              My Visits
            </Btn>
            <Btn onPress={() => nav.jump('home')} style={styles.flex}>
              Home
            </Btn>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: tw('flex-1 items-center justify-center px-6'),
  inner: { width: '100%', alignItems: 'center' },
  title: { ...twh('text-[22px] font-bold text-center') },
  body: tw(
    'text-ink-500 mt-2 max-w-[280px] text-[13px] leading-relaxed text-center',
  ),
  card: {
    ...tw('mt-6 rounded-card border border-ink-200 p-4 w-full'),
    gap: 12,
  },
  cardLabel: tw(
    'text-[12px] text-ink-500 font-semibold uppercase tracking-wider',
  ),
  k: tw('text-[11px] text-ink-500'),
  v: tw('text-[13px] font-semibold text-ink-900'),
  note: {
    ...tw('text-[11px] text-ink-500 pt-2 border-t border-ink-100'),
    fontStyle: 'italic',
  },
  actions: tw('mt-6 flex gap-2 w-full'),
  flex: tw('flex-1'),
});
