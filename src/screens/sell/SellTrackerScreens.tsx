import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { StatusHero } from '../../components/hero/StatusHero';
import { Icon } from '../../components/icons/Icon';
import { JourneyLock, StageRail, StepRow } from '../../components/journey/JourneyParts';
import { DockBar } from '../../components/layout/AppScreen';
import { Card } from '../../components/layout/Groups';
import { Grid } from '../../components/layout/Grid';
import { BottomBar, Screen, TopBar } from '../../components/layout/Screen';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { Badge } from '../../components/ui/Badge';
import { Btn, type BtnVariant } from '../../components/ui/Btn';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spin } from '../../components/ui/Float';
import { FadeIn } from '../../components/ui/Motion';
import { buzz } from '../../components/ui/Press';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { Sheet } from '../../components/ui/Sheet';
import { T } from '../../components/ui/T';
import {
  SELL_STAGES, jActiveListing, jFind, jSet, jUpsertListing, sellStage, sellStepTime, useJ,
} from '../../context/journeyStore';
import { MAX_ROUNDS, jAgree, jDeclineOffer, listingFromCtx, negoOf } from '../../context/sellStore';
import type { ScreenName, ScreenProps } from '../../navigation/types';
import * as sellRequests from '../../services/sellRequests.service';
import { joinSellRequest } from '../../services/socket.service';
import { colors, elev, ring } from '../../theme';
import { formatDayTime } from '../../utils/dates';
import { errorMessage } from '../../utils/errorMessage';
import { formatINR } from '../../utils/format';
import { listingRecordFromSellRequest } from '../../utils/sellApi';

/** P-05 / SL-10 Seller tracker (verifyOnly shows the first 6 stages). */
function SellTracker({ go, back, ctx, verifyOnly }: ScreenProps & { verifyOnly?: boolean }) {
  const s = useJ();
  const sellRequestId = String(ctx?.sellRequestId || ctx?.lid || ctx?.p?.id || '');
  const [loadErr, setLoadErr] = useState('');
  useEffect(() => {
    if (!sellRequestId) return;
    let cancelled = false;
    sellRequests.getSellRequestActivity(sellRequestId)
      .then(activity => {
        if (cancelled || !activity.sellRequest) return;
        jUpsertListing(listingRecordFromSellRequest(activity.sellRequest, activity));
      })
      .catch(e => { if (!cancelled) setLoadErr(errorMessage(e)); });
    joinSellRequest(sellRequestId).catch(() => {});
    return () => { cancelled = true; };
  }, [sellRequestId]);
  const l = listingFromCtx(ctx) || (sellRequestId ? s.listings.find(x => x.id === sellRequestId) : null);
  const stage = l ? sellStage(l) : 0;
  const [sel, setSel] = useState<number>(stage);
  const scrollTo = useRef<number[]>([]);
  useEffect(() => { if (l && s.activeListing !== l.id) jSet(x => ({ ...x, activeListing: l.id })); }, [l?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setSel(stage); }, [stage]);
  if (!l) {
    return (
      <Screen>
        <TopBar onBack={back} title={verifyOnly ? 'Verification status' : 'Listing status'} />
        <EmptyState icon="home" title="You haven't listed any properties yet." action={<Btn style={styles.selfCenter} onPress={() => go('sellType')}>List a property</Btn>} />
      </Screen>
    );
  }
  const stages = verifyOnly ? SELL_STAGES.slice(0, 6) : SELL_STAGES;
  const sold = stage >= 12;
  const lctx = { lid: l.id, p: (l.pid && jFind(l.pid)) || { id: l.id, title: l.title, price: l.price, location: l.location, city: l.city, area: l.area } };
  const detail = (i: number) => {
    const k = SELL_STAGES[i][0];
    const map: Record<string, string> = {
      submitted: `Listed at ${formatINR(l.price)}${l.area ? ' · ' + l.area + ' sqft' : ''}.`,
      call: 'Builtglory verification team called to confirm the details.',
      docs: i < stage ? 'Title, parent and revenue documents verified.' : 'Our legal team is checking your uploaded documents.',
      inspection: i < stage ? 'Site inspected by a Builtglory engineer.' : 'An engineer will visit the property.',
      legal: i < stage ? 'No encumbrance or title dispute found.' : 'Legal verification of title and approvals.',
      valuation: i < stage ? 'Valuation complete. Offer prepared.' : 'Valuing the property against recent sales.',
      offer: 'Builtglory has made an offer for your property.',
      negotiation: l.counter ? `Counter-offer of ${formatINR(l.counter)} sent.` : 'Accept the offer or send a counter-offer.',
      deal: 'Final price agreed. Add bank details to receive payment.', bank: 'Bank account saved for payouts.',
      schedule: 'Token and balance payment dates agreed.', registration: 'Sale deed registration at the Sub-Registrar office.', sold: 'Property sold. Payment received.',
    };
    return map[k];
  };
  const actions = (i: number) => {
    const k = SELL_STAGES[i][0];
    const A = (t: string, f: () => void, v: BtnVariant = 'soft') => <Btn key={t} size="sm" variant={v} onPress={f}>{t}</Btn>;
    if (k === 'submitted' && stage === 0) return [A('Edit listing', () => go('editListing', lctx), 'outline')];
    if (k === 'docs') return [A('Verification details', () => go('verificationStatus', lctx), 'outline')];
    if ((k === 'offer' || k === 'negotiation') && stage >= 6) return l.nego ? [A('View negotiation', () => go('negotiationStatus', lctx), i === stage ? 'primary' : 'outline')] : [A('View offer', () => go('offer', lctx), i === stage ? 'primary' : 'outline')];
    if ((k === 'deal' || k === 'bank') && stage >= 8) return [A('Deal & bank details', () => go('dealConfirmed', lctx), i === stage ? 'primary' : 'outline')];
    if (k === 'schedule' && stage >= 10) return [A('Payment schedule', () => go('paymentSchedule', lctx), i === stage ? 'primary' : 'outline')];
    if (k === 'registration' && stage >= 11) return [A('Registration', () => go('sellRegistration', lctx), i === stage ? 'primary' : 'outline')];
    if (k === 'sold' && sold) return [A('Sale summary', () => go('dealComplete', lctx), 'primary')];
    return null;
  };
  const nextKey: [ScreenName, string] | null = stage < 6 ? null : stage <= 7 ? (l.nego ? ['negotiationStatus', 'View negotiation'] : ['offer', 'View offer']) : stage <= 9 ? ['dealConfirmed', 'Confirm deal & bank'] : stage === 10 ? ['paymentSchedule', 'Payment schedule'] : stage === 11 ? ['sellRegistration', 'Registration'] : ['dealComplete', 'Sale summary'];
  return (
    <Screen
      footer={
        <DockBar legacy>
          {stage === 0 ? <Btn variant="outline" full onPress={() => go('editListing', lctx)}>Edit</Btn> : null}
          {nextKey ? <Btn full onPress={() => go(nextKey[0], lctx)}>{nextKey[1]}</Btn> : <Btn variant="soft" full disabled>{SELL_STAGES[stage][1]} in progress…</Btn>}
        </DockBar>
      }>
      <TopBar onBack={back} title={verifyOnly ? 'Verification status' : 'Listing status'} sub={l.title} />
      <View style={styles.body}>
        {loadErr ? <T s={12} c={colors.rose600}>{loadErr}</T> : null}
        <View style={styles.mini}>
          <PhotoPlaceholder tag={l.pid || l.photo} src={typeof l.photo === 'string' && l.photo.startsWith('http') ? l.photo : undefined} style={styles.thumb56} />
          <View style={styles.flex1}>
            <T s={13.5} w={700} truncate>{l.title}</T>
            <T s={11.5} c={colors.ink500} truncate>{l.location}{l.city ? ', ' + l.city : ''}</T>
            <T num s={13} w={800} c={colors.brand700}>{formatINR(l.price)}</T>
          </View>
          <Badge color={sold ? 'green' : 'brand'}>{sold ? 'Sold' : verifyOnly && stage >= 6 ? 'Verified' : 'In progress'}</Badge>
        </View>
        <StageRail stages={stages} cur={sold ? 13 : Math.min(stage, verifyOnly && stage >= 6 ? 6 : stage)} sel={sel} onPick={i => { setSel(i); buzz(); }} />
        <View>
          {stages.map(([k, t], i) => (
            <StepRow key={k} i={i} title={t} onLayout={y => { scrollTo.current[i] = y; }}
              state={i < stage || sold ? 'done' : i === stage ? 'current' : 'future'}
              time={i < stage || sold ? sellStepTime(l, i) : null} detail={detail(i)}
              open={sel === i} onToggle={() => setSel(sel === i ? -1 : i)}>{actions(i)}</StepRow>
          ))}
        </View>
        {verifyOnly && stage >= 6 && (
          <Card pad={14} style={styles.verified}>
            <T s={13} w={700} c={colors.emerald700}>Verification complete</T>
            <T s={12} c="rgba(0,122,85,0.8)" style={styles.mt2}>Your property passed all checks. An offer is ready.</T>
          </Card>
        )}
      </View>
    </Screen>
  );
}

export function SellTrackerScreen(props: ScreenProps) {
  return <SellTracker {...props} />;
}

export function SellVerifyScreen(props: ScreenProps) {
  return <SellTracker {...props} verifyOnly />;
}

/** Three bouncing dots while Builtglory reviews a counter-offer. */
function TypingDots() {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(t, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [t]);
  return (
    <View style={styles.dots}>
      {[0, 1, 2].map(k => (
        <Animated.View key={k} style={[styles.dot, {
          opacity: t.interpolate({ inputRange: [0, k * 0.17, k * 0.17 + 0.42, k * 0.17 + 0.84, 1], outputRange: [1, 1, 0.5, 1, 1], extrapolate: 'clamp' }),
        }]} />
      ))}
    </View>
  );
}

/** SL-13a Negotiation status */
export function NegotiationStatusScreen({ go, back, ctx }: ScreenProps) {
  useJ();
  const sellRequestId = String(ctx?.sellRequestId || ctx?.lid || '');
  useEffect(() => {
    if (!sellRequestId) return;
    sellRequests.getSellRequestActivity(sellRequestId)
      .then(activity => {
        if (activity.sellRequest) jUpsertListing(listingRecordFromSellRequest(activity.sellRequest, activity));
      })
      .catch(() => {});
  }, [sellRequestId]);
  const l = jActiveListing(ctx);
  const [sheet, setSheet] = useState<'accept' | 'decline' | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  if (!l || sellStage(l) < 6) return <JourneyLock back={back} title="Negotiation" body="Negotiation opens once Builtglory sends you an offer." action={() => go('myListings')} label="My Listings" />;
  const n = negoOf(l);
  const closed = l.nego && l.nego.closed;
  const canCounter = !n.waiting && !n.cur.final && !n.cur.accepted && n.youCount < MAX_ROUNDS;
  const title = closed === 'declined' ? 'Offer declined' : n.waiting ? 'Counter-offer under review' : n.cur.accepted ? 'Builtglory accepted your price' : n.cur.final ? 'Final offer received' : n.youCount === 0 ? 'Offer received' : 'Revised offer received';
  const tone = closed === 'declined' ? { bg: colors.rose50, fg: colors.rose700, ic: '#E11D48', name: 'circle-x' }
    : n.waiting ? { bg: colors.amber50, fg: colors.amber700, ic: '#D97706', name: 'loader' }
    : { bg: colors.emerald50, fg: colors.emerald700, ic: '#10B981', name: n.cur.accepted ? 'handshake' : 'badge-indian-rupee' };

  const accept = async () => {
    if (busy) return;
    setBusy(true);
    setErr('');
    try {
      await sellRequests.decideOffer(l.id, { decision: 'accepted' });
      jAgree(l.id, n.cur.amount);
      setSheet(null);
      go('offerAccepted', { lid: l.id, sellRequestId: l.id });
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const decline = async () => {
    if (busy) return;
    setBusy(true);
    setErr('');
    try {
      await sellRequests.withdrawSellRequest(l.id);
      jDeclineOffer(l.id);
      setSheet(null);
      buzz();
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      footer={
        <>
          <BottomBar style={styles.gap8}>
            {closed === 'declined' ? (
              <Btn full onPress={() => go('myListings')}>Back to My Listings</Btn>
            ) : n.waiting ? (
              <>
                <Btn full variant="outline" icon="phone" onPress={() => go('callUs')}>Talk to your advisor</Btn>
                <Btn full variant="ghost" onPress={() => go('myListings')}>Back to My Listings</Btn>
              </>
            ) : (
              <>
                <Btn full icon="check" onPress={() => setSheet('accept')}>Accept {formatINR(n.cur.amount)}</Btn>
                <Grid cols={2} gap={8}>
                  <Btn variant="outline" full icon="repeat" disabled={!canCounter} onPress={() => go('acceptNegotiate', { mode: 'negotiate', lid: l.id, sellRequestId: l.id, against: n.cur.amount })}>{canCounter ? (n.youCount === 0 ? 'Counter-offer' : 'Counter again') : 'No rounds left'}</Btn>
                  <Btn variant="outline" full icon="x" onPress={() => setSheet('decline')}>Decline</Btn>
                </Grid>
              </>
            )}
          </BottomBar>
          {sheet === 'accept' && (
            <Sheet title="Accept this offer?" onClose={() => setSheet(null)}>
              <T s={13} c={colors.ink600}>You're agreeing to sell <T w={700}>{l.title}</T> to Builtglory for <T w={700} num>{formatINR(n.cur.amount)}</T>. A term sheet will be generated next.</T>
              {err ? <T s={12} c={colors.rose600} style={styles.mt4}>{err}</T> : null}
              <View style={styles.sheetBtns}>
                <Btn full disabled={busy} onPress={() => void accept()}>{busy ? 'Accepting…' : 'Yes, accept offer'}</Btn>
                <Btn full variant="ghost" onPress={() => setSheet(null)}>Go back</Btn>
              </View>
            </Sheet>
          )}
          {sheet === 'decline' && (
            <Sheet title="Decline and withdraw?" onClose={() => setSheet(null)}>
              <T s={13} c={colors.ink600}>Declining ends the negotiation and withdraws your listing. Your uploaded documents remain safe in your account.</T>
              {err ? <T s={12} c={colors.rose600} style={styles.mt4}>{err}</T> : null}
              <View style={styles.sheetBtns}>
                <Btn full style={styles.roseBtn} disabled={busy} onPress={() => void decline()}>{busy ? 'Withdrawing…' : 'Decline offer'}</Btn>
                <Btn full variant="ghost" onPress={() => setSheet(null)}>Keep negotiating</Btn>
              </View>
            </Sheet>
          )}
        </>
      }>
      <TopBar onBack={back} title="Negotiation" sub={l.title} />
      <View style={styles.negoBody}>
        <FadeIn style={[styles.toneCard, { backgroundColor: tone.bg }]}>
          <View style={styles.inline8}>
            {n.waiting ? <Spin period={1400}><Icon name={tone.name} size={14} color={tone.ic} /></Spin> : <Icon name={tone.name} size={14} color={tone.ic} />}
            <T s={12} w={700} upper ls={0.08} c={tone.fg}>{n.waiting ? 'In review' : closed === 'declined' ? 'Closed' : n.youCount === 0 ? 'Builtglory offer' : `Round ${n.youCount} of ${MAX_ROUNDS}`}</T>
          </View>
          <T display s={21} w={800} ls={-0.03} style={styles.mt6}>{title}</T>
          <T s={12.5} c={colors.ink600} style={styles.mt4}>
            {n.waiting ? <>Builtglory's pricing team usually replies within 24 hours.</>
              : closed === 'declined' ? 'You declined the offer. Your listing has been withdrawn. Documents remain safe in your account.'
              : n.cur.accepted ? 'Builtglory has agreed to your counter-offer. Accept to confirm the deal.'
              : n.cur.final ? 'This is Builtglory\'s final offer. You can accept it or decline.'
              : n.youCount === 0 ? `Accept the offer or send a counter-offer. You can counter up to ${MAX_ROUNDS} times.`
              : 'Builtglory has revised its offer. Accept it, or send one more counter-offer.'}
          </T>
          {!n.waiting && !closed && (
            <View style={styles.offerBox}>
              <T s={11} w={700} upper ls={0.08} c={colors.ink400}>{n.cur.accepted ? 'Agreed price' : 'Current offer'}</T>
              <T display num s={30} w={800} lh={1.25}>{formatINR(n.cur.amount)}</T>
              {l.price ? <T s={12} c={colors.ink500}>Your expected price: <T num w={700}>{formatINR(l.price)}</T></T> : null}
            </View>
          )}
        </FadeIn>
        <View>
          <SectionTitle>Offer history</SectionTitle>
          <View style={styles.gap10}>
            {n.rounds.map((r, i) => {
              const you = r.by === 'you';
              return (
                <FadeIn key={i} style={[styles.bubbleRow, { justifyContent: you ? 'flex-end' : 'flex-start' }]}>
                  <View style={[styles.bubble, you ? styles.bubbleYou : styles.bubbleBg]}>
                    <T s={11} w={700} c={you ? 'rgba(255,255,255,0.8)' : colors.ink500}>{you ? 'Your counter-offer' : i === 0 ? 'Builtglory offer' : r.accepted ? 'Builtglory accepted' : r.final ? 'Builtglory final offer' : 'Builtglory revised offer'}</T>
                    <T num s={18} w={800} c={you ? colors.white : colors.ink900}>{formatINR(r.amount)}</T>
                    {r.note ? <T s={12} c={you ? 'rgba(255,255,255,0.9)' : colors.ink600} style={styles.mt2}>"{r.note}"</T> : null}
                    <T s={10.5} c={you ? 'rgba(255,255,255,0.7)' : colors.ink400} style={styles.mt4}>{formatDayTime(r.at)}</T>
                  </View>
                </FadeIn>
              );
            })}
            {n.waiting && (
              <View style={styles.bubbleRow}>
                <View style={[styles.bubbleBg, styles.typing]}><TypingDots /></View>
              </View>
            )}
          </View>
        </View>
      </View>
    </Screen>
  );
}

const ACCEPT_STEPS: [string, string][] = [['file-signature', 'Review & sign the term sheet'], ['landmark', 'Add bank details for payout'], ['calendar-clock', 'Agree the payment schedule'], ['stamp', 'Registration at Sub-Registrar office']];

/** SL-13b Offer accepted */
export function OfferAcceptedScreen({ go, ctx }: ScreenProps) {
  useJ();
  const l = jActiveListing(ctx);
  if (!l) return null;
  const n = negoOf(l);
  const price = l.finalPrice || n.cur.amount;
  return (
    <Screen
      fill
      footer={
        <BottomBar style={styles.gap8}>
          <Btn full iconRight="arrow-right" onPress={() => go('dealConfirmed', { lid: l.id })}>Continue to deal confirmation</Btn>
          <Btn full variant="outline" icon="list-checks" onPress={() => go('listingDetail', { lid: l.id })}>View listing status</Btn>
        </BottomBar>
      }>
      <View style={styles.accepted}>
        <View style={styles.center}><StatusHero icon="handshake" tone="success" /></View>
        <FadeIn><T display s={24} w={800} ls={-0.03} align="center" style={styles.mt20}>Offer accepted</T></FadeIn>
        <FadeIn><T s={13.5} c={colors.ink500} align="center" style={styles.acceptedSub}>You and Builtglory have agreed on a price{n.youCount ? ` after ${n.youCount} ${n.youCount === 1 ? 'round' : 'rounds'} of negotiation` : ''}.</T></FadeIn>
        <FadeIn style={styles.receipt}>
          <View style={styles.receiptHead}>
            <T s={11} w={700} upper ls={0.08} c={colors.emerald700} align="center">Agreed sale price</T>
            <T display num s={32} w={800} lh={1.25} align="center" style={styles.mt2}>{formatINR(price)}</T>
            <T s={12} c={colors.ink500} align="center">{l.title}</T>
          </View>
          <View style={styles.p16}>
            <T s={11} w={700} upper ls={0.08} c={colors.ink400} style={styles.mb8}>What happens next</T>
            {ACCEPT_STEPS.map(([ic, t], i) => (
              <View key={t} style={styles.nextRow}>
                <View style={styles.nextIcon}><Icon name={ic} size={15} color="#1A6FFF" /></View>
                <T s={13} w={600} c={colors.ink800} style={styles.flex1}><T num c={colors.ink400}>{i + 1}. </T>{t}</T>
              </View>
            ))}
          </View>
        </FadeIn>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  center: { alignItems: 'center' },
  selfCenter: { alignSelf: 'center' },
  gap8: { gap: 8 },
  gap10: { gap: 10 },
  inline8: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mt2: { marginTop: 2 },
  mt4: { marginTop: 4 },
  mt6: { marginTop: 6 },
  mt20: { marginTop: 20 },
  mb8: { marginBottom: 8 },
  p16: { padding: 16 },
  body: { paddingHorizontal: 16, paddingBottom: 128, gap: 16 },
  mini: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, backgroundColor: colors.white, boxShadow: elev.e1 },
  thumb56: { width: 56, height: 56, borderRadius: 12 },
  verified: { backgroundColor: '#F4FEF9' },
  negoBody: { paddingHorizontal: 16, paddingBottom: 176, gap: 16 },
  toneCard: { borderRadius: 24, padding: 16 },
  offerBox: { marginTop: 12, borderRadius: 16, backgroundColor: colors.white, boxShadow: ring('rgba(226,232,240,0.7)'), padding: 14 },
  bubbleRow: { flexDirection: 'row' },
  bubble: { maxWidth: '78%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleYou: { backgroundColor: colors.brand600, borderBottomRightRadius: 6 },
  bubbleBg: { backgroundColor: colors.white, boxShadow: ring('rgba(226,232,240,0.7)'), borderBottomLeftRadius: 6, borderRadius: 16 },
  typing: { paddingHorizontal: 16, paddingVertical: 12 },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 9999, backgroundColor: colors.ink400 },
  sheetBtns: { marginTop: 16, gap: 8 },
  roseBtn: { backgroundColor: colors.rose600 },
  accepted: { flex: 1, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 144 },
  acceptedSub: { marginTop: 6, maxWidth: 290, alignSelf: 'center' },
  receipt: { marginTop: 24, borderRadius: 24, backgroundColor: colors.white, boxShadow: elev.e2, overflow: 'hidden' },
  receiptHead: { padding: 16, backgroundColor: colors.emerald50, borderBottomWidth: 1, borderBottomColor: colors.emerald100 },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  nextIcon: { width: 32, height: 32, borderRadius: 12, backgroundColor: colors.brand50, alignItems: 'center', justifyContent: 'center' },
});
