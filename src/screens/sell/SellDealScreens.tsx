import React, { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { StatusHero } from '../../components/hero/StatusHero';
import { StatusMark } from '../../components/hero/StatusMark';
import { Icon } from '../../components/icons/Icon';
import { JourneyLock } from '../../components/journey/JourneyParts';
import { Grid } from '../../components/layout/Grid';
import { BottomBar, Screen, TopBar } from '../../components/layout/Screen';
import { Btn } from '../../components/ui/Btn';
import { MoneyUp } from '../../components/ui/CountUp';
import { DocCard } from '../../components/ui/DocCard';
import { Field, Input } from '../../components/ui/Field';
import { Float } from '../../components/ui/Float';
import { CountdownRing } from '../../components/hero/StatusHero';
import { RiseIn } from '../../components/ui/Motion';
import { buzz, Press } from '../../components/ui/Press';
import { Sheen } from '../../components/ui/Sheen';
import { Sheet } from '../../components/ui/Sheet';
import { SolidBtn } from '../../components/ui/SolidBtn';
import { T } from '../../components/ui/T';
import { Toast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { saveDraft } from '../../context/draftStore';
import { jFind, jSetListingStage, jUpsertListing, sellStage, useJ, type ListingRecord } from '../../context/journeyStore';
import { BASE_OFFER, jAgree, jCounter, listingFromCtx, negoOf } from '../../context/sellStore';
import type { Ctx, ScreenName, ScreenProps } from '../../navigation/types';
import * as meService from '../../services/me.service';
import * as sellRequests from '../../services/sellRequests.service';
import type { SellActivityApi } from '../../services/sellRequests.service';
import { colors, elev, gradients, type } from '../../theme';
import { formatDateShort } from '../../utils/dates';
import { errorMessage } from '../../utils/errorMessage';
import { formatINR } from '../../utils/format';
import { listingRecordFromSellRequest } from '../../utils/sellApi';
import { useToast } from '../../utils/useToast';

function sellIdFrom(props: ScreenProps, l?: ListingRecord | null): string {
  return String(props.ctx?.sellRequestId || props.ctx?.lid || l?.sellRequestId || l?.id || '');
}

function useSellActivity(sellRequestId: string) {
  const [activity, setActivity] = useState<SellActivityApi | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(!!sellRequestId);
  useEffect(() => {
    if (!sellRequestId) return;
    let cancelled = false;
    setLoading(true);
    sellRequests.getSellRequestActivity(sellRequestId)
      .then(data => {
        if (cancelled) return;
        setActivity(data);
        if (data.sellRequest) {
          jUpsertListing(listingRecordFromSellRequest(data.sellRequest, data));
        }
      })
      .catch(e => { if (!cancelled) setErr(errorMessage(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [sellRequestId]);
  return { activity, err, loading, setActivity };
}

const STAGE_LABEL: Record<number, string> = { 6: 'Offer', 8: 'Deal confirmed', 10: 'Payment schedule', 11: 'Registration', 12: 'Deal complete' };

/** Lifecycle gate for SL-12 → SL-17: shows a lock until the listing reaches `min`. */
function SellGate({ props, min, onGo, lockBody, render }: {
  props: ScreenProps; min: number; lockBody: string;
  onGo?: (k: ScreenName, l: ListingRecord, c: Ctx) => ScreenName | void;
  render: (p: ScreenProps) => React.ReactElement;
}) {
  useJ();
  const l = listingFromCtx(props.ctx);
  if (!l && props.ctx?.p) return render(props);
  if (!l || sellStage(l) < min) {
    return <JourneyLock back={props.back} title={STAGE_LABEL[min] || 'Listing'} body={lockBody}
      action={() => props.go(l ? 'listingDetail' : 'sellType', l ? { lid: l.id } : {})} label={l ? 'Open listing status' : 'List a property'} />;
  }
  const go = (k: ScreenName, c: Ctx = {}) => { const r = onGo && onGo(k, l, c); props.go(r || k, { ...c, lid: l.id }); };
  return render({ ...props, ctx: { ...props.ctx, lid: l.id, p: props.ctx?.p || (l.pid && jFind(l.pid)) || { ...l, id: l.pid || l.id } }, go });
}

// ─── SL-09 Edit listing ──────────────────────────────────────
export function EditListingScreen({ go, back, ctx }: ScreenProps) {
  const src = ctx?.p || {};
  const sellRequestId = String(ctx?.sellRequestId || ctx?.lid || src.id || '');
  const [data, setData] = useState({
    title: src.title || '',
    price: src.price ? String(src.price) : '',
    area: src.sqft || src.area ? String(src.sqft || src.area) : '',
    floor: src.floor ? String(src.floor) : '',
  });
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState('');
  const [draftSaved, setDraftSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!sellRequestId || busy) return;
    setBusy(true);
    try {
      await sellRequests.patchSellRequest(sellRequestId, {
        propertyTitle: data.title,
        askingPrice: Number(data.price) || undefined,
        specifications: {
          builtUpArea: Number(data.area) || undefined,
          floor: data.floor || undefined,
        },
      });
      setSaved(true);
      setToast('Changes saved!');
      go('myListings');
    } catch (e) {
      setToast(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const saveAsDraft = async () => {
    if (busy) return;
    setBusy(true);
    try {
      let id = sellRequestId;
      const body = {
        propertyTitle: data.title,
        askingPrice: Number(data.price) || undefined,
        draftStep: 7,
        specifications: {
          builtUpArea: Number(data.area) || undefined,
          floor: data.floor || undefined,
        },
      };
      if (id) await sellRequests.patchSellRequest(id, body);
      else {
        const created = await sellRequests.createDraft(body);
        id = created._id;
      }
      setDraftSaved(true);
      const dr = saveDraft({ id, title: data.title, step: 7, price: data.price, area: data.area });
      go('draftSuccess', { data: { ...data, id: dr.id } });
    } catch (e) {
      setToast(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen
      footer={
        <>
          <Toast message={toast} />
          <BottomBar style={styles.gap8}>
            <Pressable onPress={() => void save()} style={({ pressed }) => [styles.solid, { backgroundColor: saved ? colors.emerald500 : pressed ? colors.brand700 : colors.brand600 }]}>
              {saved && <Icon name="check" size={18} color="white" />}
              <T s={15} w={600} c="#FFFFFF">{busy ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}</T>
            </Pressable>
            <Pressable onPress={() => void saveAsDraft()} style={({ pressed }) => [styles.solid, styles.outlineBtn, pressed && { backgroundColor: colors.ink50 }]}>
              {draftSaved && <Icon name="check" size={16} color="#10B981" />}
              <T s={15} w={600} c={colors.ink700}>{draftSaved ? 'Draft Saved!' : 'Save as Draft'}</T>
            </Pressable>
          </BottomBar>
        </>
      }>
      <TopBar onBack={back} title="Edit Listing" sub="Status: Submitted" />
      <View style={styles.body}>
        <View style={styles.note}>
          <Icon name="info" size={14} color="#1A6FFF" />
          <T s={12} c={colors.brand700}>You can edit until our team starts the review.</T>
        </View>
        <View style={styles.gap16}>
          <Field label="Property Title" required><Input value={data.title} onChangeText={v => setData({ ...data, title: v })} /></Field>
          <Field label="Asking Price (₹)" required><Input prefix="₹" keyboardType="number-pad" value={data.price} onChangeText={v => setData({ ...data, price: v })} /></Field>
          <Grid cols={2} gap={12}>
            <Field label="Built-up Area"><Input keyboardType="number-pad" value={data.area} onChangeText={v => setData({ ...data, area: v })} /></Field>
            <Field label="Floor"><Input keyboardType="number-pad" value={data.floor} onChangeText={v => setData({ ...data, floor: v })} /></Field>
          </Grid>
          <Pressable onPress={() => go('sellPhotos')} style={styles.linkRow}>
            <T s={13} w={600}>Photos & Amenities</T>
            <Icon name="chevron-right" size={16} color="#94A3B8" />
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

// ─── SL-08a Draft saved ──────────────────────────────────────
export function DraftSuccessScreen({ go, ctx }: ScreenProps) {
  const d = ctx?.data || {};
  return (
    <Screen fill>
      <View style={styles.center}>
        <View style={styles.inner}>
          <StatusHero icon="save" tone="info" />
          <T display s={22} w={700} align="center">Draft saved successfully</T>
          <T s={13} c={colors.ink500} lh={1.625} align="center" style={styles.sub280}>Your listing draft has been saved. Continue it anytime from My Drafts.</T>
          <View style={styles.box}>
            <T s={12} w={600} upper ls={0.05} c={colors.ink500}>Draft Details</T>
            {d.title ? (
              <>
                <View>
                  <T s={11} c={colors.ink500}>Property Title</T>
                  <T s={13} w={600}>{d.title}</T>
                </View>
                <View style={styles.row16}>
                  {d.price ? <View><T s={11} c={colors.ink500}>Expected Price</T><T s={13} w={600} c={colors.brand600}>₹ {formatINR(Number(d.price))}</T></View> : null}
                  {d.area ? <View><T s={11} c={colors.ink500}>Area (sqft)</T><T s={13} w={600}>{String(d.area)}</T></View> : null}
                </View>
              </>
            ) : null}
            <T s={11} c={colors.ink500} style={styles.italic}>Saved on {formatDateShort(new Date())}</T>
          </View>
          <View style={styles.actions}>
            <Btn variant="outline" flex onPress={() => go('home')}>Home</Btn>
            <Btn icon="file-pen" flex onPress={() => go('myDrafts')}>View Drafts</Btn>
          </View>
        </View>
      </View>
    </Screen>
  );
}

// ─── SL-11 Re-upload documents ───────────────────────────────
const FLAGGED = [
  { id: 'title', name: 'Title Document', reason: 'Title document is blurry — please re-scan all 4 pages clearly.' },
  { id: 'ec', name: 'Encumbrance Certificate', reason: 'Last page is missing. Upload the complete EC.' },
];

export function ReuploadScreen({ go, back }: ScreenProps) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const allDone = FLAGGED.every(f => done[f.id]);
  return (
    <Screen footer={<BottomBar><SolidBtn onPress={() => go('verificationStatus')} disabled={!allDone}>Submit for Re-verification</SolidBtn></BottomBar>}>
      <TopBar onBack={back} title="Re-upload Documents" />
      <View style={styles.body}>
        <View style={styles.warn}>
          <StatusMark kind="warn" size={16} />
          <T s={12} c={colors.amber800} style={styles.flex1}>Only the flagged documents need re-uploading.</T>
        </View>
        <View style={styles.gap12}>
          {FLAGGED.map(f => (
            <DocCard key={f.id} name={f.name} meta={done[f.id] ? 'New file uploaded ✓' : 'Flagged'} flagged={!done[f.id]} reason={!done[f.id] ? f.reason : null}
              action={
                <View style={styles.docAction}>
                  <Pressable onPress={() => setDone(d => ({ ...d, [f.id]: true }))} style={({ pressed }) => [styles.reup, { backgroundColor: done[f.id] ? colors.emerald50 : pressed ? colors.brand700 : colors.brand600 }]}>
                    <Icon name={done[f.id] ? 'check' : 'upload'} size={14} color={done[f.id] ? '#10B981' : 'white'} />
                    <T s={13} w={600} c={done[f.id] ? colors.emerald700 : colors.white}>{done[f.id] ? 'Uploaded' : 'Re-upload'}</T>
                  </Pressable>
                </View>
              } />
          ))}
        </View>
      </View>
    </Screen>
  );
}

// ─── SL-12 Offer ─────────────────────────────────────────────
function OfferView(props: ScreenProps) {
  const { go, back, ctx } = props;
  const l = listingFromCtx(ctx);
  const sellRequestId = sellIdFrom(props, l);
  const { activity, err } = useSellActivity(sellRequestId);
  const offer = (activity?.offer || {}) as { amount?: number; expiresAt?: string };
  const title = activity?.sellRequest?.propertyTitle || l?.title || 'Your property';
  const amount = Number(offer.amount || l?.offer || BASE_OFFER);
  const amountL = amount / 1e5;
  const expiresAt = offer.expiresAt ? new Date(offer.expiresAt).getTime() : 0;
  const [secs, setSecs] = useState(() => Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));
  useEffect(() => {
    if (!expiresAt) return;
    setSecs(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));
    const t = setInterval(() => setSecs(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  const hh = Math.floor(secs / 3600);
  return (
    <Screen
      footer={
        <BottomBar style={styles.row8}>
          <Btn variant="outline" flex onPress={() => go('acceptNegotiate', { mode: 'negotiate', lid: sellRequestId, sellRequestId })}>Negotiate</Btn>
          <Press onPress={() => { buzz(); go('acceptNegotiate', { mode: 'accept', lid: sellRequestId, sellRequestId }); }} style={styles.acceptBtn}>
            <View style={[StyleSheet.absoluteFill, styles.pillClip]}><Sheen /></View>
            <T s={15} w={700} c="#FFFFFF">Accept Offer</T>
          </Press>
        </BottomBar>
      }>
      <TopBar onBack={back} title="Builtglory Offer" sub={title} />
      <View style={styles.body}>
        {err ? <T s={12} c={colors.rose600} style={styles.mb8}>{err}</T> : null}
        <RiseIn distance={16} duration={500} style={styles.offerCard}>
          <Float style={styles.offerGlow} />
          <T s={12} c={colors.ink500} upper ls={0.05} align="center">Our offer for your property</T>
          <MoneyUp value={Number(amountL.toFixed(1))} display s={44} w={800} c={colors.brand700} lh={1.25} ls={-0.04} align="center" style={styles.mt4} />
          <View style={styles.above}>
            <Icon name="trending-up" size={12} color="#10B981" />
            <T s={11.5} c={colors.emerald700}>{formatINR(amount)}</T>
          </View>
        </RiseIn>
        {expiresAt ? (
          <RiseIn distance={16} duration={500} delay={120} style={styles.countCard}>
            <CountdownRing secs={secs} total={Math.max(secs, 48 * 3600)} />
            <View style={styles.flex1}>
              <T s={11} w={700} upper ls={0.12} c="rgba(255,255,255,0.7)">Offer expires in</T>
              <T display s={18} w={800} lh={1.375} ls={-0.02} c="#FFFFFF" style={styles.mt4}>{hh} hours left to decide</T>
              <T s={11.5} c="rgba(255,255,255,0.65)" style={styles.mt6}>You can negotiate before the timer ends.</T>
            </View>
          </RiseIn>
        ) : null}
        <View style={styles.basis}>
          <T s={12} c={colors.ink600} lh={1.625}>This offer is based on Builtglory's AI valuation, recent area transactions and your property's condition. Accept to move to deal confirmation, or negotiate with a counter offer.</T>
        </View>
      </View>
    </Screen>
  );
}

export function OfferScreen(props: ScreenProps) {
  return <SellGate props={props} min={6} lockBody="An offer is made once verification and valuation are complete." render={p => <OfferView {...p} />} />;
}

// ─── SL-13 Accept / negotiate ────────────────────────────────
function AcceptNegotiateView(props: ScreenProps) {
  const { go, back, ctx } = props;
  const l = listingFromCtx(ctx);
  const sellRequestId = sellIdFrom(props, l);
  const { activity } = useSellActivity(sellRequestId);
  const offerAmount = Number((activity?.offer as { amount?: number } | undefined)?.amount || l?.offer || BASE_OFFER);
  const mode: string = ctx?.mode || 'negotiate';
  const [counter, setCounter] = useState('');
  const [notes, setNotes] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [focus, setFocus] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const accept = async () => {
    if (!sellRequestId || busy) return;
    setBusy(true);
    setErr('');
    try {
      await sellRequests.decideOffer(sellRequestId, { decision: 'accepted' });
      jAgree(l?.id || sellRequestId, offerAmount);
      go('offerAccepted', { lid: sellRequestId, sellRequestId });
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  };

  const submitCounter = async () => {
    if (!counter || !sellRequestId || busy) return;
    setBusy(true);
    setErr('');
    try {
      await sellRequests.decideOffer(sellRequestId, {
        decision: 'countered',
        counterAmount: Number(counter),
        notes: notes.trim() || undefined,
      });
      jCounter(l?.id || sellRequestId, Number(counter), notes.trim());
      buzz();
      go('negotiationStatus', { counter: Number(counter), note: notes.trim(), lid: sellRequestId, sellRequestId });
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (mode === 'accept') {
    return (
      <Screen
        footer={confirm ? (
          <Sheet onClose={() => setConfirm(false)} title="Confirm acceptance?">
            <T s={13} c={colors.ink500} style={styles.mb20}>You're accepting {formatINR(offerAmount)} for {l?.title || 'your property'}. We'll proceed to deal confirmation.</T>
            {err ? <T s={12} c={colors.rose600} style={styles.mb8}>{err}</T> : null}
            <View style={styles.gap8}>
              <Btn full disabled={busy} onPress={() => void accept()}>{busy ? 'Accepting…' : 'Yes, Accept Offer'}</Btn>
              <Pressable onPress={() => setConfirm(false)} style={[styles.solid, { backgroundColor: colors.ink100 }]}><T s={15} w={600} c={colors.ink700}>Go Back</T></Pressable>
            </View>
          </Sheet>
        ) : null}>
        <TopBar onBack={back} title="Accept Offer" />
        <View style={styles.px4}>
          <View style={styles.acceptCard}>
            <T s={12} c={colors.ink500} align="center">You are accepting Builtglory's offer of</T>
            <T s={32} w={700} c={colors.brand600} align="center" style={styles.mt4}>{formatINR(offerAmount)}</T>
          </View>
          <View style={[styles.basis, styles.mt16]}><T s={12} c={colors.ink600} lh={1.625}>Once you confirm, we'll generate a term sheet and move to deal confirmation. This is binding subject to final document checks.</T></View>
          {err ? <T s={12} c={colors.rose600} style={styles.mt8}>{err}</T> : null}
          <Btn full style={styles.mt20} onPress={() => setConfirm(true)}>Confirm & Accept</Btn>
        </View>
      </Screen>
    );
  }
  return (
    <Screen footer={<BottomBar><SolidBtn disabled={!counter || busy} onPress={() => void submitCounter()}>{busy ? 'Submitting…' : 'Submit Counter Offer'}</SolidBtn></BottomBar>}>
      <TopBar onBack={back} title="Send Counter Offer" />
      <View style={styles.body}>
        <View style={[styles.basis, styles.offerRow]}>
          <T s={12} c={colors.ink500}>Builtglory's offer</T>
          <T s={16} w={700}>{formatINR(offerAmount)}</T>
        </View>
        <Field label="Your counter offer (₹)" required>
          <Input prefix="₹" keyboardType="number-pad" placeholder="e.g. 8800000" value={counter} onChangeText={setCounter} />
        </Field>
        {counter ? <T s={12} c={colors.brand700} style={styles.approx}>≈ {formatINR(Number(counter))}</T> : <View style={styles.h16} />}
        <Field label="Notes (optional)">
          <TextInput value={notes} onChangeText={setNotes} placeholder="Add a note to support your counter offer…" placeholderTextColor={colors.ink400} multiline textAlignVertical="top"
            onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} style={[styles.textarea, focus && { borderColor: colors.brand600 }]} />
        </Field>
        {err ? <T s={12} c={colors.rose600}>{err}</T> : null}
      </View>
    </Screen>
  );
}

export function AcceptNegotiateScreen(props: ScreenProps) {
  return (
    <SellGate props={props} min={6} lockBody="An offer is made once verification and valuation are complete."
      onGo={(k, l, c) => {
        // Local stage updates; AcceptNegotiateView performs API calls before navigating when possible.
        if (k === 'dealConfirmed') { jAgree(l.id, (l.nego ? negoOf(l).cur.amount : null) || BASE_OFFER); return 'offerAccepted'; }
        if (k === 'negotiationStatus' && c.counter) jCounter(l.id, c.counter, c.note);
        if (k === 'offer') jSetListingStage(l.id, 7, c.counter ? { counter: c.counter } : {});
      }}
      render={p => <AcceptNegotiateView {...p} />} />
  );
}

// ─── SL-14 Deal confirmed + bank details ─────────────────────
function DealConfirmedView(props: ScreenProps) {
  const { go, back, ctx } = props;
  const { refreshProfile } = useAuth();
  const l = listingFromCtx(ctx);
  const sellRequestId = sellIdFrom(props, l);
  const { activity } = useSellActivity(sellRequestId);
  const finalPrice = Number(
    l?.finalPrice ||
    (activity?.offer as { amount?: number; counterAmount?: number } | undefined)?.amount ||
    BASE_OFFER,
  );
  const [bank, setBank] = useState({ holder: '', name: '', acc: '', accConfirm: '', ifsc: '', branch: '', upi: '' });
  const [confirmedDeal, setConfirmedDeal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: keyof typeof bank, v: string) => setBank(b => ({ ...b, [k]: v }));
  const accMatch = !!bank.acc && bank.acc === bank.accConfirm;
  const valid = !!bank.holder && !!bank.name && accMatch && bank.ifsc.length >= 6;
  const saveBank = async () => {
    if (!(confirmedDeal && valid) || busy) return;
    setBusy(true);
    setErr('');
    try {
      await meService.patchMe({
        bankDetails: {
          accountHolderName: bank.holder,
          bankName: bank.name,
          accountNumberLast4: bank.acc.slice(-4),
          ifsc: bank.ifsc,
          branch: bank.branch || undefined,
          upiId: bank.upi || undefined,
        },
      });
      await refreshProfile();
      if (l?.id) jSetListingStage(l.id, 10);
      go('paymentSchedule', { lid: sellRequestId, sellRequestId });
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen footer={<BottomBar><SolidBtn onPress={() => void saveBank()} disabled={!(confirmedDeal && valid) || busy}>{busy ? 'Saving…' : 'Save Bank Details'}</SolidBtn></BottomBar>}>
      <TopBar onBack={back} title="Deal Confirmed" />
      <View style={styles.body}>
        <View style={styles.agreed}>
          <View style={styles.agreedHead}>
            <Icon name="circle-check" size={18} color="#10B981" />
            <T s={14} w={700} c={colors.emerald800}>Deal agreed</T>
          </View>
          <View style={styles.gap10}>
            <View style={styles.between}><T s={12} c={colors.ink500}>Final agreed price</T><T s={15} w={700}>{formatINR(finalPrice)}</T></View>
            <Pressable onPress={() => go('pdfViewer', { doc: { name: 'Term Sheet' }, from: 'dealConfirmed' })} style={styles.termRow}>
              <Icon name="file-text" size={16} color="#E11D48" />
              <T s={13} w={600} style={styles.flex1}>Term Sheet.pdf</T>
              <Icon name="chevron-right" size={15} color="#94A3B8" />
            </Pressable>
            <View style={styles.between}><T s={12} c={colors.ink500}>Expected timeline</T><T s={13} w={600}>21–30 days</T></View>
          </View>
          {!confirmedDeal
            ? <Btn full size="sm" style={styles.mt12} onPress={() => setConfirmedDeal(true)}>Confirm Deal</Btn>
            : (
              <View style={styles.confirmedLine}>
                <StatusMark kind="success" size={16} />
                <T s={12} w={600} c={colors.emerald700}>Deal confirmed — now add your bank details</T>
              </View>
            )}
        </View>
        <T display s={14} w={600} style={styles.mb12}>Your bank details for payout</T>
        <View style={styles.gap12}>
          <Field label="Account Holder Name" required><Input value={bank.holder} onChangeText={v => set('holder', v)} placeholder="As per bank records" /></Field>
          <Field label="Bank Name" required><Input value={bank.name} onChangeText={v => set('name', v)} placeholder="e.g. HDFC Bank" /></Field>
          <Field label="Account Number" required><Input keyboardType="number-pad" value={bank.acc} onChangeText={v => set('acc', v)} placeholder="Enter account number" /></Field>
          <Field label="Confirm Account Number" required>
            <Input keyboardType="number-pad" value={bank.accConfirm} onChangeText={v => set('accConfirm', v)} placeholder="Re-enter account number" />
            {bank.accConfirm && !accMatch ? <T s={11} c={colors.rose500} style={styles.mt6}>Account numbers don't match</T> : null}
          </Field>
          <Field label="IFSC Code" required><Input value={bank.ifsc} autoCapitalize="characters" onChangeText={v => set('ifsc', v.toUpperCase())} placeholder="e.g. HDFC0001234" /></Field>
          <Grid cols={2} gap={12}>
            <Field label="Branch (optional)"><Input value={bank.branch} onChangeText={v => set('branch', v)} placeholder="Branch" /></Field>
            <Field label="UPI ID (optional)"><Input value={bank.upi} autoCapitalize="none" onChangeText={v => set('upi', v)} placeholder="name@bank" /></Field>
          </Grid>
          {err ? <T s={12} c={colors.rose600}>{err}</T> : null}
        </View>
      </View>
    </Screen>
  );
}

export function DealConfirmedScreen(props: ScreenProps) {
  return <SellGate props={props} min={8} lockBody="Accept the offer first to confirm the deal." onGo={(k, l) => { if (k === 'paymentSchedule') jSetListingStage(l.id, 10); }} render={p => <DealConfirmedView {...p} />} />;
}

// ─── SL-15 Payment schedule ──────────────────────────────────
function PaymentScheduleView(props: ScreenProps) {
  const { go, back, ctx } = props;
  const l = listingFromCtx(ctx);
  const sellRequestId = sellIdFrom(props, l);
  const { activity, err } = useSellActivity(sellRequestId);
  const [busy, setBusy] = useState(false);
  const [actionErr, setActionErr] = useState('');
  const schedule = (activity?.payoutSchedule || []) as Array<{ key?: string; label?: string; amount?: number; dueLabel?: string; status?: string }>;
  const total = schedule.reduce((s, row) => s + Number(row.amount || 0), 0) || Number(l?.finalPrice || l?.price || 0);
  const confirm = async () => {
    if (!sellRequestId || busy) return;
    setBusy(true);
    setActionErr('');
    try {
      await sellRequests.confirmPayoutSchedule(sellRequestId);
      if (l?.id) jSetListingStage(l.id, 11);
      go('sellRegistration', { lid: sellRequestId, sellRequestId });
    } catch (e) {
      setActionErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen footer={<BottomBar><Btn full disabled={busy} onPress={() => void confirm()}>{busy ? 'Confirming…' : 'Confirm Schedule'}</Btn></BottomBar>}>
      <TopBar onBack={back} title="Payment Schedule" />
      <View style={styles.body}>
        {(err || actionErr) ? <T s={12} c={colors.rose600} style={styles.mb8}>{actionErr || err}</T> : null}
        <View style={styles.gap12}>
          {(schedule.length ? schedule : [{ label: 'Payout', amount: total, dueLabel: 'As agreed' }]).map((row, i) => (
            <View key={row.key || String(i)} style={styles.schedCard}>
              <View style={[styles.between, styles.mb4]}>
                <T s={13} w={600}>{row.label || 'Payment'}</T>
                <T s={16} w={700} c={colors.brand600}>{formatINR(Number(row.amount || 0))}</T>
              </View>
              <View style={styles.inline4}>
                <Icon name="calendar" size={12} color={colors.ink500} />
                <T s={11.5} c={colors.ink500}>{row.dueLabel || row.status || 'Scheduled'}</T>
              </View>
            </View>
          ))}
          <View style={[styles.schedCard, styles.between]}>
            <T s={13} w={600}>Payment Mode</T>
            <View style={styles.inline6}>
              <Icon name="building-2" size={14} color="#64748B" />
              <T s={13} c={colors.ink700}>Bank Transfer (escrow)</T>
            </View>
          </View>
        </View>
        <View style={styles.total}>
          <T s={12} upper ls={0.05} c="rgba(255,255,255,0.7)">Total</T>
          <T s={22} w={700} c="#FFFFFF">{formatINR(total)}</T>
        </View>
      </View>
    </Screen>
  );
}

export function PaymentScheduleScreen(props: ScreenProps) {
  return <SellGate props={props} min={10} lockBody="Confirm the deal and add bank details first." onGo={(k, l) => { if (k === 'sellRegistration') jSetListingStage(l.id, 11); }} render={p => <PaymentScheduleView {...p} />} />;
}

// ─── SL-16 Registration appointment ──────────────────────────
function SellRegistrationView(props: ScreenProps) {
  const { go, back, ctx } = props;
  const l = listingFromCtx(ctx);
  const sellRequestId = sellIdFrom(props, l);
  const { activity, err } = useSellActivity(sellRequestId);
  const reg = (activity?.registration || {}) as {
    appointment?: { date?: string; time?: string; office?: string; address?: string };
    checklist?: string[];
  };
  const docs = Array.isArray(reg.checklist) ? reg.checklist.map(String) : [];
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [toast, showToast] = useToast(2500);
  const [busy, setBusy] = useState(false);
  const [actionErr, setActionErr] = useState('');
  const allChecked = docs.length > 0 && docs.every(d => checks[d]);
  const apptDate = reg.appointment?.date
    ? formatDateShort(new Date(reg.appointment.date))
    : '';
  const apptTime = reg.appointment?.time || '';
  const office = reg.appointment?.office || '';
  const address = reg.appointment?.address || '';
  const mapsQuery = encodeURIComponent([office, address].filter(Boolean).join(' '));

  const confirm = async () => {
    if (!sellRequestId || !allChecked || busy) return;
    setBusy(true);
    setActionErr('');
    try {
      await sellRequests.confirmRegistration(sellRequestId, {
        documentsReady: docs.filter(d => checks[d]),
      });
      if (l?.id) jSetListingStage(l.id, 13);
      go('dealComplete', { lid: sellRequestId, sellRequestId });
    } catch (e) {
      setActionErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen footer={<><Toast message={toast} /><BottomBar><SolidBtn onPress={() => void confirm()} disabled={!allChecked || busy || !docs.length}>{busy ? 'Confirming…' : 'Confirm Appointment'}</SolidBtn></BottomBar></>}>
      <TopBar onBack={back} title="Registration Appointment" />
      <View style={styles.body}>
        {(err || actionErr) ? <T s={12} c={colors.rose600} style={styles.mb8}>{actionErr || err}</T> : null}
        <View style={styles.appt}>
          <View style={styles.apptHead}>
            <T s={11} upper ls={0.05} c="rgba(255,255,255,0.8)">Appointment</T>
            {apptDate ? (
              <>
                <T s={20} w={700} c="#FFFFFF" style={styles.mt4}>{apptDate}</T>
                {apptTime ? <T s={13} c="#FFFFFF">{apptTime}</T> : null}
              </>
            ) : (
              <T s={14} c="#FFFFFF" style={styles.mt4}>Appointment not scheduled yet.</T>
            )}
          </View>
          {office || address ? (
            <Pressable onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`)} style={({ pressed }) => [styles.office, pressed && { backgroundColor: colors.ink50 }]}>
              <View style={styles.officeIcon}><Icon name="landmark" size={18} color="#1A6FFF" /></View>
              <View style={styles.flex1}>
                <T s={13} w={600}>{office || 'Registration office'}</T>
                {address ? <T s={11.5} c={colors.ink500}>{address}</T> : <T s={11.5} c={colors.ink500}>Tap for directions</T>}
              </View>
              <Icon name="map-pin" size={16} color="#1A6FFF" />
            </Pressable>
          ) : (
            <View style={styles.office}>
              <T s={12} c={colors.ink600}>Office details will appear once your appointment is confirmed.</T>
            </View>
          )}
        </View>
        <T display s={14} w={600} style={styles.mb8}>Documents to carry</T>
        {docs.length ? (
          <View style={styles.checklist}>
            {docs.map((d, i) => (
              <Pressable key={d} onPress={() => setChecks(c => ({ ...c, [d]: !c[d] }))} style={[styles.checkRow, i > 0 && styles.divider]} accessibilityRole="checkbox" accessibilityState={{ checked: !!checks[d] }}>
                <View style={[styles.cbox, checks[d] ? styles.cboxOn : styles.cboxOff]}>{checks[d] && <Icon name="check" size={12} color="white" strokeWidth={3} />}</View>
                <T s={13} c={checks[d] ? colors.ink400 : colors.ink800} style={checks[d] ? styles.strike : null}>{d}</T>
              </Pressable>
            ))}
          </View>
        ) : (
          <T s={12} c={colors.ink600} style={styles.mb8}>No registration checklist has been shared for this listing yet.</T>
        )}
        <Btn variant="outline" full icon="calendar-plus" onPress={() => showToast(reg.appointment?.date ? 'Open your calendar app to add this appointment.' : 'Appointment date not set yet.')}>Add to Calendar</Btn>
      </View>
    </Screen>
  );
}

export function SellRegistrationScreen(props: ScreenProps) {
  return <SellGate props={props} min={11} lockBody="Confirm the payment schedule first." onGo={(k, l) => { if (k === 'dealComplete') jSetListingStage(l.id, 13); }} render={p => <SellRegistrationView {...p} />} />;
}

// ─── SL-17 Deal complete ─────────────────────────────────────
function DealCompleteView({ go, ctx }: ScreenProps) {
  const l = listingFromCtx(ctx);
  const title = l?.title || String(ctx?.title || 'your listing');
  return (
    <Screen fill>
      <View style={styles.center}>
        <View style={styles.inner}>
          <StatusHero icon="party-popper" tone="success" />
          <T display s={22} w={700} align="center">Your property has been sold</T>
          <T s={13} c={colors.ink500} lh={1.625} align="center" style={styles.sub250}>Congratulations! The deal for {title} is complete.</T>
          <View style={styles.doneBox}>
            {(['Payment', 'Registration'] as const).map((k, i) => (
              <View key={k} style={[styles.doneRow, i > 0 && styles.divider]}>
                <T s={13} w={500}>{k}</T>
                <View style={styles.inline4}>
                  <StatusMark kind="success" size={16} />
                  <T s={12} w={600} c={colors.emerald700}>{k === 'Payment' ? 'Received' : 'Completed'}</T>
                </View>
              </View>
            ))}
          </View>
          <Btn full style={styles.mt20} icon="file-text" onPress={() => go('pdfViewer', { doc: { name: 'Sale Deed' }, from: 'dealComplete', sellRequestId: ctx?.sellRequestId || l?.id })}>Download Sale Deed</Btn>
          <Pressable onPress={() => go('help')} style={styles.mt16}><T s={13} w={600} c={colors.brand600}>Contact Builtglory</T></Pressable>
        </View>
      </View>
    </Screen>
  );
}

export function DealCompleteScreen(props: ScreenProps) {
  return <SellGate props={props} min={12} lockBody="Registration must be completed first." render={p => <DealCompleteView {...p} />} />;
}

// ─── SL-18 Rejected listing ──────────────────────────────────
export function RejectedListingScreen({ go, back }: ScreenProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <Screen
      footer={confirmDelete ? (
        <Sheet onClose={() => setConfirmDelete(false)} title="Delete this listing?">
          <T s={13} c={colors.ink500} style={styles.mb20}>This permanently removes the listing. Your uploaded documents stay in your account.</T>
          <View style={styles.gap8}>
            <Pressable onPress={() => go('myListings')} style={({ pressed }) => [styles.solid, { backgroundColor: pressed ? colors.rose700 : colors.rose600 }]}><T s={15} w={600} c="#FFFFFF">Delete Listing</T></Pressable>
            <Pressable onPress={() => setConfirmDelete(false)} style={[styles.solid, { backgroundColor: colors.ink100 }]}><T s={15} w={600} c={colors.ink700}>Keep Listing</T></Pressable>
          </View>
        </Sheet>
      ) : null}>
      <TopBar onBack={back} title="Listing Rejected" />
      <View style={styles.px4}>
        <View style={styles.rejected}>
          <StatusMark kind="error" size={22} />
          <View style={styles.flex1}>
            <T s={14} w={600} c={colors.rose800}>Listing could not be approved</T>
            <T s={12.5} c={colors.rose700} style={styles.mt2}>Reason: Title dispute found during legal verification.</T>
          </View>
        </View>
        <View style={[styles.basis, styles.inline8, styles.mb20]}>
          <Icon name="shield-check" size={14} color="#10B981" />
          <T s={12} c={colors.ink600} style={styles.flex1}>All your uploaded documents remain safe in your account.</T>
        </View>
        <View style={styles.gap8}>
          <Btn variant="outline" full icon="headphones" onPress={() => go('help')}>Contact Builtglory Team</Btn>
          <Pressable onPress={() => setConfirmDelete(true)} style={({ pressed }) => [styles.solid, pressed && { backgroundColor: colors.rose50 }]}><T s={14} w={500} c={colors.rose600}>Delete Listing</T></Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  px4: { paddingHorizontal: 16 },
  body: { paddingHorizontal: 16, paddingBottom: 96 },
  gap8: { gap: 8 },
  gap10: { gap: 10 },
  gap12: { gap: 12 },
  gap16: { gap: 16 },
  row8: { flexDirection: 'row', gap: 8 },
  row16: { flexDirection: 'row', gap: 16 },
  inline4: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  inline6: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  inline8: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mt2: { marginTop: 2 },
  mt4: { marginTop: 4 },
  mt6: { marginTop: 6 },
  mt8: { marginTop: 8 },
  mt12: { marginTop: 12 },
  mt16: { marginTop: 16 },
  mt20: { marginTop: 20 },
  mb4: { marginBottom: 4 },
  mb8: { marginBottom: 8 },
  mb12: { marginBottom: 12 },
  mb20: { marginBottom: 20 },
  h16: { height: 0 },
  italic: { fontStyle: 'italic' },
  strike: { textDecorationLine: 'line-through' },
  divider: { borderTopWidth: 1, borderTopColor: colors.ink100 },
  solid: { width: '100%', height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  outlineBtn: { borderWidth: 1, borderColor: colors.ink200 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14, backgroundColor: colors.brand50, marginBottom: 16 },
  linkRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.ink200 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  inner: { width: '100%', alignItems: 'center' },
  sub280: { marginTop: 8, maxWidth: 280 },
  sub250: { marginTop: 8, maxWidth: 250 },
  box: { marginTop: 24, alignSelf: 'stretch', borderRadius: 14, borderWidth: 1, borderColor: colors.ink200, padding: 16, gap: 12 },
  actions: { marginTop: 24, flexDirection: 'row', gap: 8, alignSelf: 'stretch' },
  warn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14, backgroundColor: colors.amber50, borderWidth: 1, borderColor: colors.amber200, marginBottom: 16 },
  docAction: { paddingHorizontal: 12, paddingBottom: 12 },
  reup: { width: '100%', height: 40, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  offerCard: { overflow: 'hidden', borderRadius: 24, backgroundColor: colors.white, boxShadow: elev.e3, padding: 20, marginBottom: 16 },
  offerGlow: { position: 'absolute', top: -64 - 50, right: -48 - 50, width: 160 + 100, height: 160 + 100, experimental_backgroundImage: 'radial-gradient(circle closest-side, rgba(209,227,255,1) 0%, rgba(209,227,255,0.95) 25%, rgba(209,227,255,0.5) 57%, rgba(209,227,255,0) 100%)' },
  above: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.emerald50, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9999, marginTop: 8 },
  countCard: { borderRadius: 24, padding: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 16, experimental_backgroundImage: gradients.meshBrand, boxShadow: elev.e3 },
  basis: { borderRadius: 14, backgroundColor: colors.ink50, padding: 12 },
  acceptBtn: { flex: 1, height: 52, borderRadius: 9999, alignItems: 'center', justifyContent: 'center', experimental_backgroundImage: 'linear-gradient(135deg, #34D399, #059669)', boxShadow: '0 10px 24px -8px rgba(5,150,105,0.6)' },
  pillClip: { borderRadius: 9999, overflow: 'hidden' },
  acceptCard: { borderRadius: 14, borderWidth: 1, borderColor: colors.ink200, padding: 20 },
  offerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  approx: { marginTop: -8, marginBottom: 8, paddingHorizontal: 4 },
  textarea: { width: '100%', height: 96, padding: 12, borderWidth: 1, borderColor: colors.ink200, borderRadius: 14, ...type(14), lineHeight: 20, color: colors.ink900 },
  agreed: { borderRadius: 14, borderWidth: 1, borderColor: colors.emerald200, backgroundColor: 'rgba(236,253,245,0.4)', padding: 16, marginBottom: 20 },
  agreedHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  termRow: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.ink200 },
  confirmedLine: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  schedCard: { borderRadius: 14, borderWidth: 1, borderColor: colors.ink200, padding: 16 },
  total: { borderRadius: 14, backgroundColor: colors.ink900, padding: 16, marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  appt: { borderRadius: 14, borderWidth: 1, borderColor: colors.ink200, overflow: 'hidden', marginBottom: 16 },
  apptHead: { backgroundColor: colors.brand600, paddingHorizontal: 16, paddingVertical: 12 },
  office: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  officeIcon: { width: 40, height: 40, borderRadius: 9999, backgroundColor: colors.brand50, alignItems: 'center', justifyContent: 'center' },
  checklist: { borderRadius: 14, borderWidth: 1, borderColor: colors.ink200, marginBottom: 16 },
  checkRow: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  cbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  cboxOn: { backgroundColor: colors.brand600, borderColor: colors.brand600 },
  cboxOff: { borderColor: colors.ink300 },
  doneBox: { marginTop: 24, alignSelf: 'stretch', borderRadius: 14, borderWidth: 1, borderColor: colors.ink200 },
  doneRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  rejected: { borderRadius: 14, borderWidth: 1, borderColor: colors.rose200, backgroundColor: 'rgba(255,241,242,0.5)', padding: 16, flexDirection: 'row', gap: 12, marginBottom: 16 },
});

