import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Btn } from '../../components/Btn';
import { StatusHero } from '../../components/Hero';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { tw, twh } from '../../theme';

// Review stages shown to the seller after submission (reference copy; actual progress lives on SL-10).
const NEXT = [
  { num: '1', title: 'Document Review', desc: '12-24 hours' },
  { num: '2', title: 'Site Inspection', desc: '2-3 days' },
  { num: '3', title: 'Legal Verification', desc: '3-5 days' },
  { num: '4', title: 'Offer from Builtglory', desc: 'After verification' },
];

/** SL-08 Listing submitted (POST /me/sell-requests/:id/submit succeeded). */
export function SellSuccessScreen({ params }: ScreenProps<'sellSuccess'>) {
  const nav = useNav();
  const ref = params?.request?.referenceId;
  return (
    <Screen fill>
      <View style={styles.center}>
        <View style={styles.inner}>
          <StatusHero icon="party-popper" tone="success" />
          <T style={styles.title}>Your property has been submitted</T>
          <T style={styles.body}>
            Builtglory team will review within 48 hours. You'll receive updates
            on your progress.
          </T>
          {ref ? <T style={styles.ref}>Reference {ref}</T> : null}
          <View style={styles.card}>
            <T style={styles.cardLabel}>4 next steps</T>
            {NEXT.map(s => (
              <View key={s.num} style={styles.step}>
                <View style={styles.num}>
                  <T style={styles.numText}>{s.num}</T>
                </View>
                <View>
                  <T style={styles.stepTitle}>{s.title}</T>
                  <T style={styles.stepDesc}>{s.desc}</T>
                </View>
              </View>
            ))}
          </View>
          <View style={styles.actions}>
            <Btn
              variant="outline"
              onPress={() => nav.jump('home')}
              style={styles.flex}
            >
              Home
            </Btn>
            <Btn onPress={() => nav.jump('myListings')} style={styles.flex}>
              My Listings
            </Btn>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: tw('flex-1'),
  center: tw('flex-1 items-center justify-center px-6'),
  inner: { width: '100%', alignItems: 'center' },
  title: { ...twh('text-[22px] font-bold text-center') },
  body: tw(
    'text-ink-500 mt-2 max-w-[280px] text-[13px] leading-relaxed text-center',
  ),
  ref: tw('num text-[11px] text-ink-400 mt-1'),
  card: {
    ...tw('mt-6 rounded-card border border-ink-200 p-4 w-full'),
    gap: 12,
  },
  cardLabel: tw(
    'text-[12px] text-ink-500 font-semibold uppercase tracking-wider',
  ),
  step: tw('flex items-start gap-3'),
  num: tw(
    'w-7 h-7 rounded-full bg-brand-100 items-center justify-center shrink-0',
  ),
  numText: tw('text-brand-600 font-bold text-[12px]'),
  stepTitle: tw('text-[13px] font-semibold text-ink-900'),
  stepDesc: tw('text-[11px] text-ink-500'),
  actions: tw('mt-6 flex gap-2 w-full'),
});
