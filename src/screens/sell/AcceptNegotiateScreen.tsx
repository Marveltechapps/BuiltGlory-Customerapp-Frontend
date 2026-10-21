import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Btn } from '../../components/Btn';
import { Field, Input, TextArea } from '../../components/Form';
import { Icon } from '../../components/Icon';
import { Divided } from '../../components/Layout';
import { Spin } from '../../components/Motion';
import { Screen, ScreenFooter, SolidButton } from '../../components/Screen';
import { Sheet } from '../../components/Sheet';
import { ErrorState, LoadingState } from '../../components/States';
import { T } from '../../components/T';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { decideOffer } from '../../services/sellRequest.service';
import type { SellerActivity } from '../../types/sellRequest';
import { tw } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { formatINR } from '../../utils/format';
import { listingTitle, useSellerActivity } from './sellShared';

/** SL-13 Accept the offer or send a counter (POST /me/sell-requests/:id/offer-decision). */
export function AcceptNegotiateScreen({
  params,
}: ScreenProps<'acceptNegotiate'>) {
  const nav = useNav();
  const res = useSellerActivity(params.id);
  const [result, setResult] = useState<SellerActivity | null>(null);
  const a = result ?? res.data;
  const offer = a?.offer;
  const [counter, setCounter] = useState('');
  const [notes, setNotes] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = async () => {
    setSaving(true);
    setError(null);
    try {
      await decideOffer(params.id, { decision: 'accepted' });
      setConfirm(false);
      nav.replace('dealConfirmed', { id: params.id });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };
  const sendCounter = async () => {
    const amount = Number(counter);
    if (!(amount > 0)) return;
    setSaving(true);
    setError(null);
    try {
      setResult(
        await decideOffer(params.id, {
          decision: 'countered',
          counterAmount: amount,
          notes: notes.trim() || null,
        }),
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (res.loading) {
    return (
      <Screen
        topBar={{
          title:
            params.mode === 'accept' ? 'Accept Offer' : 'Send Counter Offer',
          back: true,
        }}
      >
        <LoadingState />
      </Screen>
    );
  }
  if (res.error || !a || !offer) {
    return (
      <Screen
        topBar={{
          title:
            params.mode === 'accept' ? 'Accept Offer' : 'Send Counter Offer',
          back: true,
        }}
      >
        <ErrorState
          message={res.error ?? 'No offer is available for this listing yet.'}
          onRetry={res.reload}
        />
      </Screen>
    );
  }

  if (params.mode === 'accept') {
    return (
      <Screen topBar={{ title: 'Accept Offer', back: true }}>
        <View style={styles.body}>
          <View style={styles.acceptCard}>
            <T style={styles.acceptLabel}>
              You are accepting Builtglory's offer of
            </T>
            <T style={styles.acceptValue}>{formatINR(offer.amount)}</T>
          </View>
          <T style={styles.note}>
            Once you confirm, we'll generate a term sheet and move to deal
            confirmation. This is binding subject to final document checks.
          </T>
          <Btn style={styles.cta} onPress={() => setConfirm(true)}>
            Confirm & Accept
          </Btn>
        </View>
        <Sheet
          visible={confirm}
          onClose={() => setConfirm(false)}
          title="Confirm acceptance?"
        >
          <T style={styles.sheetText}>
            You're accepting {formatINR(offer.amount)} for{' '}
            {listingTitle(a.sellRequest)}. We'll proceed to deal confirmation.
          </T>
          {error && <T style={styles.error}>{error}</T>}
          <View style={styles.sheetActions}>
            <Btn style={styles.full} loading={saving} onPress={accept}>
              Yes, Accept Offer
            </Btn>
            <SolidButton
              label="Go Back"
              tone="neutral"
              onPress={() => setConfirm(false)}
            />
          </View>
        </Sheet>
      </Screen>
    );
  }

  const sent =
    result?.offer?.status === 'seller_countered' ||
    (!result && offer.status === 'seller_countered' && !!offer.counterAmount);
  if (sent) {
    const counterAmount =
      result?.offer?.counterAmount ?? offer.counterAmount ?? Number(counter);
    return (
      <Screen
        topBar={{
          title: 'Counter Offer Sent',
          back: () => nav.popTo('offer', { id: params.id }),
        }}
      >
        <View style={styles.body}>
          <View style={styles.pending}>
            <View style={styles.pendingIcon}>
              <Spin>
                <Icon name="loader-2" size={20} color="#D97706" />
              </Spin>
            </View>
            <View style={styles.flex}>
              <T style={styles.pendingTitle}>Negotiation in progress</T>
              <T style={styles.pendingSub}>
                Your counter of {formatINR(counterAmount)} is under review.
              </T>
            </View>
          </View>
          <Divided style={styles.compare}>
            <View style={styles.compareRow}>
              <T style={styles.compareKey}>Builtglory offer</T>
              <T style={styles.compareVal}>{formatINR(offer.amount)}</T>
            </View>
            <View style={styles.compareRow}>
              <T style={styles.compareKey}>Your counter</T>
              <T style={[styles.compareVal, styles.brand]}>
                {formatINR(counterAmount)}
              </T>
            </View>
          </Divided>
          <Btn
            variant="outline"
            style={styles.cta}
            onPress={() => nav.jump('myListings')}
          >
            Back to My Listings
          </Btn>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      topBar={{ title: 'Send Counter Offer', back: true }}
      footer={
        <ScreenFooter>
          {error && <T style={styles.error}>{error}</T>}
          <SolidButton
            label="Submit Counter Offer"
            disabled={!counter}
            loading={saving}
            loadingLabel="Sending…"
            onPress={sendCounter}
          />
        </ScreenFooter>
      }
    >
      <View style={styles.body}>
        <View style={styles.offerRow}>
          <T style={styles.offerKey}>Builtglory's offer</T>
          <T style={styles.offerVal}>{formatINR(offer.amount)}</T>
        </View>
        <Field label="Your counter offer (₹)" required>
          <Input
            prefix="₹"
            keyboardType="number-pad"
            placeholder="e.g. 8800000"
            value={counter}
            onChangeText={v => setCounter(v.replace(/[^\d]/g, ''))}
          />
        </Field>
        {counter ? (
          <T style={styles.approx}>≈ {formatINR(Number(counter))}</T>
        ) : null}
        <Field label="Notes (optional)" style={styles.mt4}>
          <TextArea
            value={notes}
            onChangeText={setNotes}
            placeholder="Add a note to support your counter offer…"
            height={96}
            maxLength={1000}
          />
        </Field>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: tw('flex-1'),
  full: tw('w-full'),
  body: tw('px-4 pb-24'),
  acceptCard: tw('rounded-card border border-ink-200 p-5 items-center'),
  acceptLabel: tw('text-[12px] text-ink-500 text-center'),
  acceptValue: tw('text-[32px] font-bold text-brand-600 mt-1'),
  note: tw(
    'mt-4 p-3 rounded-card bg-ink-50 text-[12px] text-ink-600 leading-relaxed overflow-hidden',
  ),
  cta: tw('w-full mt-5'),
  sheetText: tw('text-[13px] text-ink-500 mb-5'),
  sheetActions: { gap: 8 },
  error: tw('text-[12px] text-rose-600 mb-2'),
  pending: tw(
    'rounded-card bg-amber-50 border border-amber-200 p-4 flex items-center gap-3',
  ),
  pendingIcon: tw(
    'w-11 h-11 rounded-full bg-amber-100 items-center justify-center',
  ),
  pendingTitle: tw('text-[14px] font-semibold text-amber-900'),
  pendingSub: tw('text-[12px] text-amber-700'),
  compare: tw('mt-4 rounded-card border border-ink-200'),
  compareRow: tw('flex justify-between px-3 py-2.5'),
  compareKey: tw('text-[12px] text-ink-500'),
  compareVal: tw('text-[13px] font-semibold'),
  brand: tw('text-brand-600'),
  offerRow: tw(
    'rounded-card bg-ink-50 p-3 mb-4 flex justify-between items-center',
  ),
  offerKey: tw('text-[12px] text-ink-500'),
  offerVal: tw('text-[16px] font-bold text-ink-900'),
  approx: tw('text-[12px] text-brand-700 mt-2 px-1'),
  mt4: tw('mt-4'),
});
