import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Field, Input, Toggle } from '../../components/Form';
import { Icon } from '../../components/Icon';
import { Screen, ScreenFooter, SolidButton } from '../../components/Screen';
import { SellHeader } from '../../components/SellHeader';
import { Skeleton } from '../../components/States';
import { T } from '../../components/T';
import { toSellPayload, useSellFlow } from '../../context/SellFlowContext';
import { useDebounced, useResource } from '../../lib/useResource';
import { useNav } from '../../navigation/NavContext';
import { getValuationEstimate } from '../../services/sellRequest.service';
import { tw } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { formatINR, groupIN } from '../../utils/format';

const MIN_PRICE = 50000; // sell request validator: askingPrice min 50,000

/** SL-07 Expected price (step 7/7), with the market estimate from POST /me/sell-requests/:id/valuation-estimate. */
export function SellPriceScreen() {
  const nav = useNav();
  const sell = useSellFlow();
  const { form, set } = sell;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const price = Number(form.price) || 0;
  const area =
    Number(form.builtUp) || Number(form.plotArea) || Number(form.landArea) || 0;
  const debouncedPrice = useDebounced(price, 600);

  const estimate = useResource(
    async signal => {
      const id = await sell.ensureDraft();
      return getValuationEstimate(
        id,
        toSellPayload({ ...form, price: String(debouncedPrice) }),
        signal,
      );
    },
    [debouncedPrice],
    debouncedPrice >= MIN_PRICE,
  );
  const place = form.locality || form.city;

  const submit = async () => {
    if (price < MIN_PRICE) {
      setError(`Enter a price of at least ₹ ${groupIN(MIN_PRICE)}.`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const request = await sell.submit();
      nav.reset('sellSuccess', { request });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      footer={
        <ScreenFooter>
          {error && <T style={styles.error}>{error}</T>}
          <SolidButton
            label="Submit Listing"
            loading={submitting}
            loadingLabel="Submitting…"
            disabled={!price}
            onPress={submit}
          />
        </ScreenFooter>
      }
    >
      <SellHeader step={7} title="Expected Price" />
      <View style={styles.body}>
        <T style={styles.h2}>Set your asking price</T>
        <Field label="Expected Price (₹)" required>
          <Input
            prefix="₹"
            keyboardType="number-pad"
            placeholder="e.g. 8500000"
            value={form.price}
            onChangeText={v => set('price', v.replace(/[^\d]/g, ''))}
          />
        </Field>
        {price > 0 && (
          <>
            {area > 0 && (
              <View style={styles.rate}>
                <T style={styles.rateLabel}>Price per sqft</T>
                <T style={styles.rateValue}>
                  ₹ {groupIN(Math.round(price / area))}
                </T>
              </View>
            )}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Icon name="trending-up" size={16} color="#1A6FFF" />
                <T style={styles.cardTitle}>Market estimate</T>
              </View>
              {price < MIN_PRICE ? (
                <T style={styles.cardBody}>
                  Enter your expected price to see the market estimate.
                </T>
              ) : estimate.loading || !estimate.data ? (
                estimate.error ? (
                  <T style={styles.cardBody}>{estimate.error}</T>
                ) : (
                  <View style={styles.skeletons}>
                    <Skeleton h={12} w="80%" />
                    <Skeleton h={28} />
                  </View>
                )
              ) : (
                <>
                  <T style={styles.cardBody}>
                    {estimate.data.comparableCount > 0
                      ? `Based on ${estimate.data.comparableCount} similar ${
                          estimate.data.comparableCount === 1
                            ? 'property'
                            : 'properties'
                        }${place ? ` in ${place}` : ''}:`
                      : `Based on baseline rates${
                          place ? ` for ${place}` : ''
                        }:`}
                  </T>
                  <View style={styles.range}>
                    <View style={styles.rangeCol}>
                      <T style={styles.rangeLabel}>Low</T>
                      <T style={styles.rangeValue}>
                        {formatINR(estimate.data.low)}
                      </T>
                    </View>
                    <T style={styles.dash}>—</T>
                    <View style={styles.rangeCol}>
                      <T style={styles.rangeLabel}>High</T>
                      <T style={styles.rangeValue}>
                        {formatINR(estimate.data.high)}
                      </T>
                    </View>
                  </View>
                </>
              )}
              <T style={styles.note}>
                Informational only · final offer from Builtglory based on
                verification
              </T>
            </View>
          </>
        )}
        <View style={styles.negotiable}>
          <View style={styles.flex}>
            <T style={styles.negTitle}>Price negotiable?</T>
            <T style={styles.negSub}>Buyers can request a quote</T>
          </View>
          <Toggle on={form.negotiable} onChange={v => set('negotiable', v)} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: tw('flex-1'),
  body: { ...tw('px-4 mt-4 pb-24'), gap: 16 },
  h2: tw('text-[16px] font-semibold text-ink-900'),
  rate: tw('p-3 bg-brand-50 rounded-card'),
  rateLabel: tw('text-[12px] text-brand-700 mb-1'),
  rateValue: tw('text-[20px] font-bold text-brand-600'),
  card: tw('rounded-card border border-ink-200 p-4'),
  cardHead: tw('flex items-center gap-2 mb-3'),
  cardTitle: tw('text-[13px] font-semibold'),
  cardBody: tw('text-[12px] text-ink-600 leading-relaxed'),
  skeletons: { gap: 8, marginTop: 4 },
  range: tw('mt-2 flex gap-2 items-center justify-between'),
  rangeCol: tw('flex-1 items-center'),
  rangeLabel: tw('text-[10px] text-ink-500'),
  rangeValue: tw('text-[16px] font-bold text-ink-900'),
  dash: tw('text-[12px] text-ink-400'),
  note: {
    ...tw('text-[11px] text-ink-500 mt-2 text-center'),
    fontStyle: 'italic',
  },
  negotiable: tw(
    'flex items-center justify-between p-3 rounded-card border border-ink-200',
  ),
  negTitle: tw('text-[14px] font-semibold'),
  negSub: tw('text-[11px] text-ink-500'),
  error: tw('text-[12px] text-rose-600 mb-2'),
});
