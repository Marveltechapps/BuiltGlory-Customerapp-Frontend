import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Btn } from '../../components/Btn';
import { StatusHero } from '../../components/Hero';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { tw, twh } from '../../theme';
import { formatDate, formatINR } from '../../utils/format';

/** SL-08a Draft saved (PATCH /me/sell-requests/:id or POST /sell-requests/drafts). */
export function DraftSuccessScreen({ params }: ScreenProps<'draftSuccess'>) {
  const nav = useNav();
  const r = params.request;
  const area =
    r.specifications?.builtUpArea ?? r.specifications?.plotArea ?? null;
  return (
    <Screen fill>
      <View style={styles.center}>
        <View style={styles.inner}>
          <StatusHero icon="save" tone="info" />
          <T style={styles.title}>Draft saved successfully</T>
          <T style={styles.body}>
            Your listing draft has been saved. You can continue editing it
            anytime from My Listings.
          </T>
          <View style={styles.card}>
            <T style={styles.cardLabel}>Draft Details</T>
            {r.propertyTitle ? (
              <>
                <View>
                  <T style={styles.k}>Property Title</T>
                  <T style={styles.v}>{r.propertyTitle}</T>
                </View>
                <View style={styles.row}>
                  {r.askingPrice ? (
                    <View>
                      <T style={styles.k}>Expected Price</T>
                      <T style={[styles.v, styles.brand]}>
                        {formatINR(r.askingPrice)}
                      </T>
                    </View>
                  ) : null}
                  {area ? (
                    <View>
                      <T style={styles.k}>Area (sqft)</T>
                      <T style={styles.v}>{area}</T>
                    </View>
                  ) : null}
                </View>
              </>
            ) : null}
            <T style={styles.saved}>
              Saved on {formatDate(r.draftSavedAt ?? r.updatedAt ?? new Date())}
            </T>
          </View>
          <View style={styles.actions}>
            <Btn
              variant="outline"
              onPress={() => nav.jump('myListings')}
              style={styles.flex}
            >
              My Listings
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
  flex: tw('flex-1'),
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
  brand: tw('text-brand-600'),
  row: tw('flex gap-4'),
  saved: { ...tw('text-[11px] text-ink-500'), fontStyle: 'italic' },
  actions: tw('mt-6 flex gap-2 w-full'),
});
