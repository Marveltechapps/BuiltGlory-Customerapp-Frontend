import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Btn, Sheen } from '../../components/Btn';
import { CountdownRing, MoneyUp } from '../../components/Hero';
import { Icon } from '../../components/Icon';
import { Float, Rise } from '../../components/Motion';
import { Press } from '../../components/Press';
import { Screen, ScreenFooter } from '../../components/Screen';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { T } from '../../components/T';
import { useNow, useResource } from '../../lib/useResource';
import { useNav, useRefocus } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { getValuationEstimate } from '../../services/sellRequest.service';
import { meshes, palette, tw, twh } from '../../theme';
import { formatINR, toDate } from '../../utils/format';
import { buzz } from '../../utils/haptics';
import { listingTitle, useSellerActivity } from './sellShared';

const ACCEPTED = [
  'seller_accepted',
  'accepted',
  'token_to_seller',
  'documentation',
  'seller_payout',
  'acquired',
];
const DEFAULT_WINDOW = 48 * 3600;

/** SL-12 Builtglory offer (`offer` from GET /me/sell-requests/:id/activity). */
export function OfferScreen({ params }: ScreenProps<'offer'>) {
  const nav = useNav();
  const res = useSellerActivity(params.id);
  useRefocus(res.refresh);
  const a = res.data;
  const offer = a?.offer ?? null;
  const now = useNow(1000);

  // Area average from the same valuation service the listing wizard uses.
  const avg = useResource(
    signal => getValuationEstimate(params.id, a?.sellRequest ?? {}, signal),
    [params.id, Boolean(a)],
    Boolean(a && offer),
  );
  const delta =
    avg.data && offer
      ? ((offer.amount - avg.data.estimatedPrice) / avg.data.estimatedPrice) *
        100
      : null;

  const expires = toDate(offer?.expiresAt);
  const secs = expires
    ? Math.max(0, Math.floor((expires.getTime() - now) / 1000))
    : null;
  // The ring's full circle is the offer window: at least 48 h, or the time left when the offer was first shown.
  const firstSecs = useRef<number | null>(null);
  if (secs !== null && firstSecs.current === null) firstSecs.current = secs;
  const total = Math.max(DEFAULT_WINDOW, firstSecs.current ?? 0);
  const decided = offer ? ACCEPTED.includes(offer.status) : false;
  const countered = offer?.status === 'seller_countered';

  return (
    <Screen
      topBar={{
        title: 'Builtglory Offer',
        sub: a ? listingTitle(a.sellRequest) : undefined,
        back: true,
      }}
      refreshing={res.refreshing}
      onRefresh={res.refresh}
      footer={
        offer && !decided && secs !== 0 ? (
          <ScreenFooter style={styles.footer}>
            <Btn
              variant="outline"
              style={styles.flex}
              onPress={() =>
                nav.go('acceptNegotiate', { id: params.id, mode: 'negotiate' })
              }
            >
              Negotiate
            </Btn>
            <Press
              haptic
              onPress={() => {
                buzz();
                nav.go('acceptNegotiate', { id: params.id, mode: 'accept' });
              }}
              style={styles.accept}
            >
              <Sheen />
              <T style={styles.acceptText}>Accept Offer</T>
            </Press>
          </ScreenFooter>
        ) : offer && decided ? (
          <ScreenFooter>
            <Btn
              style={styles.full}
              onPress={() => nav.go('dealConfirmed', { id: params.id })}
            >
              Continue to Deal Confirmation
            </Btn>
          </ScreenFooter>
        ) : undefined
      }
    >
      <View style={styles.body}>
        {res.loading ? (
          <LoadingState />
        ) : res.error || !a ? (
          <ErrorState
            message={res.error ?? 'Could not load the offer.'}
            onRetry={res.reload}
          />
        ) : !offer ? (
          <EmptyState
            icon="hand-coins"
            title="No offer yet"
            body="We'll share Builtglory's offer once verification and valuation are complete."
          />
        ) : (
          <>
            <Rise duration={550} distance={16}>
              <View style={styles.offerCard}>
                <Float style={styles.blob}>
                  <View />
                </Float>
                <T style={styles.offerLabel}>Our offer for your property</T>
                <MoneyUp
                  value={offer.amount / 100000}
                  style={styles.offerValue}
                />
                {delta !== null && avg.data ? (
                  <View style={styles.deltaPill}>
                    <Icon name="trending-up" size={12} color="#10B981" />
                    <T style={styles.deltaText}>
                      {Math.abs(delta).toFixed(0)}%{' '}
                      {delta >= 0 ? 'above' : 'below'} area average (
                      {formatINR(avg.data.estimatedPrice)})
                    </T>
                  </View>
                ) : null}
              </View>
            </Rise>
            {countered && (
              <View style={styles.status}>
                <Icon name="clock" size={16} color={palette.amber[600]} />
                <T style={styles.statusText}>
                  Your counter of {formatINR(offer.counterAmount)} is under
                  review.
                </T>
              </View>
            )}
            {decided && (
              <View style={[styles.status, styles.statusOk]}>
                <Icon
                  name="circle-check"
                  size={16}
                  color={palette.emerald[600]}
                />
                <T style={[styles.statusText, { color: palette.emerald[800] }]}>
                  You accepted this offer.
                </T>
              </View>
            )}
            {!decided && (
              <Rise delay={120} duration={550} distance={16}>
                <View style={styles.countdown}>
                  {secs !== null ? (
                    <CountdownRing secs={secs} total={total} />
                  ) : null}
                  <View style={styles.flex}>
                    <T style={styles.cdLabel}>
                      {secs !== null ? 'Offer expires in' : 'Offer status'}
                    </T>
                    <T style={styles.cdTitle}>
                      {secs === null
                        ? 'Open offer'
                        : secs === 0
                        ? 'This offer has expired'
                        : `${Math.floor(secs / 3600)} hours left to decide`}
                    </T>
                    <T style={styles.cdSub}>
                      {secs === 0
                        ? 'Contact Builtglory to request a fresh offer.'
                        : 'You can negotiate before the timer ends.'}
                    </T>
                  </View>
                </View>
              </Rise>
            )}
            <T style={styles.note}>
              This offer is based on Builtglory's AI valuation, recent area
              transactions and your property's condition. Accept to move to deal
              confirmation, or negotiate with a counter offer.
            </T>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: tw('flex-1 min-w-0'),
  full: tw('w-full'),
  body: tw('px-4 pb-24'),
  offerCard: {
    ...tw('rounded-3xl bg-white p-5 items-center mb-4 overflow-hidden'),
    boxShadow: `0 0 0 2px ${palette.brand[500]}, 0 18px 40px -16px rgba(15,23,42,.28), 0 6px 14px -6px rgba(15,23,42,.10)`,
  },
  blob: {
    position: 'absolute',
    top: -64,
    right: -48,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: palette.brand[100],
    opacity: 0.7,
    filter: 'blur(24px)',
  },
  offerLabel: tw(
    'text-[12px] text-ink-500 uppercase tracking-wider text-center',
  ),
  offerValue: {
    ...twh('num text-[44px] font-extrabold text-brand-700 leading-tight mt-1'),
    letterSpacing: 44 * -0.04,
  },
  deltaPill: tw(
    'flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full mt-2',
  ),
  deltaText: tw('text-[11.5px] text-emerald-700'),
  status: tw(
    'flex items-start gap-2 p-3 rounded-card border bg-amber-50 border-amber-200 mb-4',
  ),
  statusOk: tw('bg-emerald-50 border-emerald-200'),
  statusText: {
    ...tw('flex-1 text-[12px] font-medium'),
    color: palette.amber[800],
  },
  countdown: {
    ...tw('rounded-3xl p-5 mb-4 flex items-center gap-4'),
    experimental_backgroundImage: meshes.brand,
    boxShadow:
      '0 18px 40px -16px rgba(15,23,42,.28), 0 6px 14px -6px rgba(15,23,42,.10)',
  },
  cdLabel: {
    ...tw('text-[11px] uppercase tracking-[.12em] font-bold'),
    color: 'rgba(255,255,255,0.7)',
  },
  cdTitle: {
    ...twh('text-[18px] font-extrabold leading-snug mt-1 text-white'),
    letterSpacing: 18 * -0.02,
  },
  cdSub: { ...tw('text-[11.5px] mt-1.5'), color: 'rgba(255,255,255,0.65)' },
  note: tw(
    'rounded-card bg-ink-50 p-3 text-[12px] text-ink-600 leading-relaxed overflow-hidden',
  ),
  footer: tw('flex gap-2'),
  accept: {
    ...tw(
      'flex-1 h-[52px] rounded-full items-center justify-center overflow-hidden',
    ),
    experimental_backgroundImage: 'linear-gradient(135deg, #34D399, #059669)',
    boxShadow: '0 10px 24px -8px rgba(5,150,105,.6)',
  },
  acceptText: tw('text-white font-bold text-[15px]'),
});
