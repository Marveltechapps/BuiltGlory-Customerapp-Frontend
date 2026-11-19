import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import QRCode from 'qrcode';
import { StatusHero } from '../../components/hero/StatusHero';
import { StatusMark } from '../../components/hero/StatusMark';
import { Icon } from '../../components/icons/Icon';
import { JourneyLock } from '../../components/journey/JourneyParts';
import { Grid } from '../../components/layout/Grid';
import { BottomBar, Screen, TopBar } from '../../components/layout/Screen';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { Badge } from '../../components/ui/Badge';
import { Btn } from '../../components/ui/Btn';
import { DocCard } from '../../components/ui/DocCard';
import { Field, Input } from '../../components/ui/Field';
import { Spin } from '../../components/ui/Float';
import { FadeIn } from '../../components/ui/Motion';
import { Sheet } from '../../components/ui/Sheet';
import { T } from '../../components/ui/T';
import { useAuth } from '../../context/AuthContext';
import { TOKEN_AMOUNT, buyStage, jActiveBuyPid, jAdvanceBuy, jCancelBuy, jFind, jRef, jUpsertBuy, useJ } from '../../context/journeyStore';
import type { Ctx, ScreenName, ScreenProps } from '../../navigation/types';
import * as buyEnquiries from '../../services/buyEnquiries.service';
import * as deals from '../../services/deals.service';
import type { BuyerDealRegistration } from '../../services/deals.service';
import * as documents from '../../services/documents.service';
import * as payments from '../../services/payments.service';
import { colors, ring } from '../../theme';
import { formatDateShort } from '../../utils/dates';
import { errorMessage } from '../../utils/errorMessage';
import { formatINR } from '../../utils/format';
import { buildUpiPayUri, isValidUpiId } from '../../lib/upiPay';
import { useResolvedProperty } from '../../utils/useResolvedProperty';

type SharedDocRow = { id: string; name: string; meta: string; documentId?: string };

function normalizeDocRows(raw: unknown[]): SharedDocRow[] {
  return raw.map((item, i) => {
    const d = (item || {}) as Record<string, unknown>;
    const documentId = String(d.documentId || d._id || d.id || '');
    const name = String(d.name || d.fileName || d.type || `Document ${i + 1}`);
    const meta = String(d.meta || d.status || d.type || 'Document');
    return { id: documentId || `doc-${i}`, name, meta, documentId: documentId || undefined };
  }).filter(d => d.documentId || d.name);
}

// ─── B-14 Documents shared ───────────────────────────────────
function DocumentsShared({ go, back, ctx }: ScreenProps) {
  const s = useJ();
  const pid = jActiveBuyPid(ctx);
  const buy = s.buys.find(x => x.pid === pid && !x.cancelled);
  const p = (pid ? jFind(pid) : undefined) || ctx?.p;
  const [docs, setDocs] = useState<SharedDocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [downloaded, setDownloaded] = useState<Record<string, 'loading' | 'done' | 'error'>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        let dealId = String(ctx?.dealId || buy?.dealId || '');
        if (!dealId) {
          const { items } = await deals.listMyDeals({ limit: 50 });
          const match = (items || []).find(d => d.side === 'buyer' && (
            d.id === buy?.enquiry?.enquiryId ||
            d.enquiryId === buy?.enquiry?.enquiryId ||
            (p?.id && String(d.propertyId || '') === String(p.id)) ||
            (p?.title && d.title === p.title)
          ));
          dealId = match?.id ? String(match.id) : '';
        }
        if (!dealId) {
          if (!cancelled) {
            setDocs([]);
            setErr('');
          }
          return;
        }
        const res = await deals.listBuyerDealDocuments(dealId);
        if (!cancelled) setDocs(normalizeDocRows(res.documents || []));
      } catch (e) {
        if (!cancelled) {
          setDocs([]);
          setErr(errorMessage(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [ctx?.dealId, buy?.dealId, buy?.enquiry?.enquiryId, p?.id, p?.title, pid]);

  const download = async (doc: SharedDocRow) => {
    if (!doc.documentId) {
      setDownloaded(d => ({ ...d, [doc.id]: 'error' }));
      setErr('This document has no downloadable id yet.');
      return;
    }
    setDownloaded(d => ({ ...d, [doc.id]: 'loading' }));
    setErr('');
    try {
      const res = await documents.getDocumentReadUrl(doc.documentId);
      if (!res.readUrl) throw new Error('No read URL returned');
      await Linking.openURL(res.readUrl);
      setDownloaded(d => ({ ...d, [doc.id]: 'done' }));
    } catch (e) {
      setDownloaded(d => ({ ...d, [doc.id]: 'error' }));
      setErr(errorMessage(e));
    }
  };

  return (
    <Screen>
      <TopBar onBack={back} title="Documents Shared" sub={p?.title || 'Your deal'} />
      <View style={styles.px4}>
        <View style={styles.banner}>
          <View style={styles.bell}><Icon name="bell" size={15} color="white" /></View>
          <T s={12} c={colors.brand800} lh={1.375} style={styles.flex1}>Builtglory has shared your property documents. Tap any document to view.</T>
        </View>
        {loading ? (
          <View style={styles.load}><ActivityIndicator color={colors.brand600} /></View>
        ) : (
          <View style={styles.gap10}>
            {docs.map(d => (
              <DocCard
                key={d.id}
                name={d.name}
                meta={downloaded[d.id] === 'done' ? `Downloaded · ${d.meta}` : downloaded[d.id] === 'error' ? `Failed · ${d.meta}` : d.meta}
                onView={() => go('pdfViewer', { doc: d, documentId: d.documentId, from: 'documentsShared' })}
                onDownload={() => { void download(d); }}
              />
            ))}
            {!docs.length ? (
              <View style={styles.note}>
                <Icon name="file-text" size={14} color="#64748B" />
                <T s={12} c={colors.ink600} style={styles.flex1}>No documents have been shared for this deal yet. Your advisor will upload them when ready.</T>
              </View>
            ) : null}
          </View>
        )}
        {err ? <T s={12} c={colors.rose600} style={styles.mt8}>{err}</T> : null}
        <View style={styles.note}>
          <Icon name="shield-check" size={14} color="#10B981" />
          <T s={11.5} c={colors.ink600} style={styles.flex1}>All documents are legally verified by the Builtglory team.</T>
        </View>
        <Btn full style={styles.mt16} icon="credit-card" onPress={() => go('payment')}>Proceed to Token Payment</Btn>
      </View>
    </Screen>
  );
}

/** B-14 gate: the deal must be confirmed; leaving to payment goes through KYC. */
export function DocsGateScreen(props: ScreenProps) {
  const s = useJ();
  const pid = jActiveBuyPid(props.ctx);
  const b = s.buys.find(x => x.pid === pid && !x.cancelled);
  const p = pid ? jFind(pid) : undefined;
  if (!b || !pid || buyStage(b) < 4) {
    return <JourneyLock back={props.back} title="Documents" body="Documents are shared after the deal is confirmed." action={() => props.go(b ? 'buyerDeal' : 'buyTypes', { p })} label={b ? 'Go to deal' : 'Browse properties'} />;
  }
  const go = (k: ScreenName, c?: Ctx) => {
    if (k === 'payment') { jAdvanceBuy(pid, 5); props.go('buyerKyc', { p }); return; }
    props.go(k, c);
  };
  return <DocumentsShared {...props} go={go} />;
}

// ─── B-15 Token payment ──────────────────────────────────────
const METHODS = [
  { id: 'bank', label: 'Bank Transfer', icon: 'building-2' },
  { id: 'upi', label: 'UPI', icon: 'smartphone' },
  { id: 'cheque', label: 'Cheque', icon: 'file-text' },
];

function UpiQrMark({ upiId, payee, amount, note }: { upiId: string; payee: string; amount: number; note: string }) {
  const drawn = useMemo(() => {
    const uri = buildUpiPayUri({ upiId, payee, amount, note, transactionRef: `token-${upiId}` });
    const qr = QRCode.create(uri, { errorCorrectionLevel: 'M' });
    const n = qr.modules.size;
    const marks: Array<[number, number]> = [];
    for (let r = 0; r < n; r += 1) {
      for (let c = 0; c < n; c += 1) if (qr.modules.get(r, c)) marks.push([r, c]);
    }
    return { n, marks };
  }, [upiId, payee, amount, note]);
  return (
    <Svg width={176} height={176} viewBox={`-1 -1 ${drawn.n + 2} ${drawn.n + 2}`}>
      <Rect x={-1} y={-1} width={drawn.n + 2} height={drawn.n + 2} fill="#FFFFFF" />
      {drawn.marks.map(([r, c]) => <Rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#0F172A" />)}
    </Svg>
  );
}

type EscrowFields = {
  holder: string;
  bank: string;
  acc: string;
  ifsc: string;
  branch: string;
  upi: string;
};

function resolveEscrow(
  escrow: {
    accountHolder?: string;
    bankName?: string;
    accountNumber?: string;
    ifsc?: string;
    branch?: string;
    upiId?: string;
  } | null | undefined,
): EscrowFields {
  if (escrow && (escrow.accountHolder || escrow.bankName || escrow.accountNumber || escrow.ifsc || escrow.upiId)) {
    return {
      holder: escrow.accountHolder || '',
      bank: escrow.bankName || '',
      acc: escrow.accountNumber || '',
      ifsc: escrow.ifsc || '',
      branch: escrow.branch || '',
      upi: escrow.upiId || '',
    };
  }
  return { holder: '', bank: '', acc: '', ifsc: '', branch: '', upi: '' };
}

function Payment({ go, back, ctx }: ScreenProps) {
  const { appConfig, loadAppConfig } = useAuth();
  const s = useJ();
  const pid = jActiveBuyPid(ctx);
  const buy = s.buys.find(x => x.pid === pid && !x.cancelled);
  const p = (pid ? jFind(pid) : undefined) || ctx?.p;
  const tokenAmount = appConfig?.payment?.tokenAmount || TOKEN_AMOUNT;
  const [method, setMethod] = useState<'bank' | 'upi' | 'cheque'>('bank');
  const [txnRef, setTxnRef] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing'>('idle');
  const [copied, setCopied] = useState('');
  const [payError, setPayError] = useState<string | null>(null);
  const bank = useMemo(
    () => resolveEscrow(appConfig?.payment?.escrow),
    [appConfig?.payment?.escrow],
  );
  const hasBank = !!(bank.holder || bank.bank || bank.acc || bank.ifsc || bank.upi);
  const supportPhone = appConfig?.support?.phone;
  const supportEmail = appConfig?.support?.supportEmail;
  const supportMsg = supportPhone || supportEmail
    ? `Contact support${supportPhone ? ` at ${supportPhone}` : ''}${supportPhone && supportEmail ? ' or ' : ''}${supportEmail ? supportEmail : ''} for escrow details.`
    : 'Contact Builtglory support for escrow details.';

  useEffect(() => {
    if (appConfig?.payment?.escrow) return;
    void loadAppConfig().catch(() => undefined);
  }, [appConfig?.payment?.escrow, loadAppConfig]);

  const copy = (key: string) => { setCopied(key); setTimeout(() => setCopied(''), 1400); };
  const pay = async () => {
    if (!p?.id || status === 'processing') return;
    if (!txnRef.trim()) {
      setPayError('Enter your UPI / transfer / cheque reference.');
      return;
    }
    setStatus('processing');
    setPayError(null);
    try {
      let dealId = ctx?.dealId || buy?.dealId;
      if (!dealId) {
        const { items } = await deals.listMyDeals({ limit: 50 });
        const match = (items || []).find(d => d.side === 'buyer' && (
          d.id === buy?.enquiry?.enquiryId ||
          d.enquiryId === buy?.enquiry?.enquiryId ||
          d.title === p.title
        ));
        dealId = match?.id;
      }
      if (!dealId) {
        throw new Error('No active deal found for this property. Confirm the deal first.');
      }
      const payment = await payments.createTokenPayment({
        dealId,
        propertyId: p.id,
        type: 'token',
        amount: tokenAmount,
        method,
        transactionReference: txnRef.trim(),
        idempotencyKey: `pay-${dealId}-token-${Date.now()}`,
      });
      go('paymentSuccess', {
        method: METHODS.find(m => m.id === method)!.label,
        p,
        paymentId: payment._id,
        paymentRef: payment.referenceId,
        amount: tokenAmount,
        dealId,
      });
    } catch (err) {
      const msg = errorMessage(err);
      setPayError(msg);
      setStatus('idle');
      go('paymentFailure', { method: METHODS.find(m => m.id === method)!.label, p, error: msg });
      return;
    }
    setStatus('idle');
  };
  const busy = status === 'processing';
  return (
    <Screen
      footer={
        <BottomBar>
          <Pressable onPress={pay} disabled={busy} style={({ pressed }) => [styles.payBtn, pressed && styles.payPressed, busy && styles.dim70]}>
            {busy ? <Spin><Icon name="loader-2" size={18} color="white" /></Spin> : null}
            <T s={15} w={600} c="#FFFFFF">{busy ? 'Confirming payment…' : method === 'cheque' ? 'I have handed over the cheque' : `I have paid ${formatINR(tokenAmount)}`}</T>
          </Pressable>
        </BottomBar>
      }>
      <TopBar onBack={back} title="Token Payment" />
      <View style={styles.payBody}>
        <View style={styles.amount}>
          <T s={12} upper ls={0.05} c="rgba(255,255,255,0.7)" align="center">Token Amount</T>
          <T s={36} w={700} c="#FFFFFF" lh={1.25} align="center" style={styles.mt4}>{formatINR(tokenAmount)}</T>
          <T s={12} c="rgba(255,255,255,0.8)" align="center">Transfer this amount, then submit your reference. BuiltGlory confirms it before the property is reserved.</T>
        </View>
        <Grid cols={3} gap={8} style={styles.mb16}>
          {METHODS.map(m => (
            <Pressable key={m.id} onPress={() => setMethod(m.id as 'bank' | 'upi' | 'cheque')} style={[styles.method, method === m.id ? styles.methodOn : styles.methodOff]}>
              <Icon name={m.icon} size={18} color={method === m.id ? '#1A6FFF' : '#64748B'} />
              <T s={11} w={600} c={method === m.id ? colors.brand700 : colors.ink600}>{m.label}</T>
            </Pressable>
          ))}
        </Grid>
        {method === 'bank' && (
          <FadeIn style={styles.bank}>
            {!hasBank ? (
              <View style={styles.bankRow}>
                <T s={12.5} c={colors.ink600} style={styles.flex1}>{supportMsg}</T>
              </View>
            ) : null}
            {([['Account Holder', bank.holder, 'holder'], ['Bank', bank.bank, 'bank'], ['Account No.', bank.acc, 'acc'], ['IFSC', bank.ifsc, 'ifsc'], ['Branch', bank.branch, 'branch']] as [string, string, string][]).map(([k, v, key], i) => (
              <View key={key} style={[styles.bankRow, (i > 0 || !hasBank) && styles.divider]}>
                <View style={styles.flex1}>
                  <T s={10.5} c={colors.ink500}>{k}</T>
                  <T s={13} w={600}>{v || '—'}</T>
                </View>
                {v ? <Pressable onPress={() => copy(key)} style={styles.copy}><T s={11} w={600} c={colors.brand600}>{copied === key ? '✓ Copied' : 'Copy'}</T></Pressable> : null}
              </View>
            ))}
          </FadeIn>
        )}
        {method === 'upi' && (
          <FadeIn style={styles.upi}>
            {bank.upi && isValidUpiId(bank.upi) && tokenAmount > 0 ? (
              <>
                <View style={styles.qr}>
                  <UpiQrMark upiId={bank.upi} payee={bank.holder || 'Builtglory'} amount={tokenAmount} note="Token payment" />
                </View>
                <View style={styles.upiId}>
                  <T s={13} w={600}>{bank.upi}</T>
                  <Pressable onPress={() => copy('upi')}><T s={11} w={600} c={colors.brand600}>{copied === 'upi' ? '✓ Copied' : 'Copy'}</T></Pressable>
                </View>
                <T s={11} c={colors.ink500} style={styles.mt8}>Scan with Google Pay, PhonePe, Paytm, or BHIM. Or copy the UPI ID.</T>
              </>
            ) : (
              <T s={12.5} c={colors.ink600} align="center">{bank.upi ? 'This UPI ID cannot be encoded. Copy it and pay from your UPI app.' : supportMsg}</T>
            )}
          </FadeIn>
        )}
        {method === 'cheque' && (
          <FadeIn style={styles.cheque}>
            <T s={13} w={600}>Cheque instructions</T>
            {(appConfig?.payment?.escrow?.chequeInstructions?.length
              ? appConfig.payment.escrow.chequeInstructions
              : [
                `Draw the cheque in favour of "${appConfig?.payment?.escrow?.chequePayee || bank.holder || 'Builtglory Escrow A/C'}"`,
                'Write your enquiry / deal reference on the reverse',
                supportMsg,
              ]
            ).map((t, i) => (
              <View key={i} style={styles.chequeRow}>
                <View style={styles.chequeNum}><T s={10} w={700} c={colors.brand700}>{i + 1}</T></View>
                <T s={12} c={colors.ink700} style={styles.flex1}>{t}</T>
              </View>
            ))}
          </FadeIn>
        )}
        <View style={styles.mt16}>
          <Field label="Transaction / cheque reference" required>
            <Input
              icon="hash"
              placeholder={method === 'upi' ? 'UPI reference' : method === 'cheque' ? 'Cheque number' : 'NEFT / IMPS reference'}
              value={txnRef}
              onChangeText={setTxnRef}
              autoCapitalize="characters"
            />
          </Field>
          {payError ? <T s={12} c={colors.rose600} style={styles.mt8}>{payError}</T> : null}
        </View>
      </View>
    </Screen>
  );
}

/** B-15 gate: KYC first; success advances the journey. */
export function PaymentGateScreen(props: ScreenProps) {
  const s = useJ();
  const pid = jActiveBuyPid(props.ctx);
  const b = s.buys.find(x => x.pid === pid && !x.cancelled);
  const p = pid ? jFind(pid) : undefined;
  if (!b || !pid || buyStage(b) < 6) {
    const need: [ScreenName, string, string] | null = !b ? null : buyStage(b) < 4 ? ['buyerDeal', 'Confirm deal first', 'Payment opens after the deal is confirmed, documents are reviewed and KYC is verified.']
      : buyStage(b) < 5 ? ['documentsShared', 'Review documents', 'Review the shared documents before paying.']
      : ['buyerKyc', 'Complete KYC', 'Verify your identity before paying.'];
    return <JourneyLock back={props.back} title="Payment" body={need ? need[2] : 'Start with an enquiry on a property.'} action={() => props.go(need ? need[0] : 'buyTypes', { p })} label={need ? need[1] : 'Browse properties'} />;
  }
  const go = (k: ScreenName, c: Ctx = {}) => {
    if (k === 'paymentSuccess') {
      const ref = c.paymentRef || jRef('TXN');
      const amount = typeof c.amount === 'number' ? c.amount : TOKEN_AMOUNT;
      jUpsertBuy(pid, {
        method: c.method,
        dealId: c.dealId,
        payment: { ref, at: Date.now(), amount, method: c.method, paymentId: c.paymentId },
      });
      jAdvanceBuy(pid, 8);
    }
    props.go(k, { ...c, p });
  };
  return <Payment {...props} go={go} />;
}

/** B-15a Payment failed — reason from API/ctx only */
export function PaymentFailureScreen({ go, ctx }: ScreenProps) {
  const reason = String(ctx?.error || ctx?.reason || ctx?.message || '').trim()
    || 'The payment could not be confirmed. Please try again or choose another method.';
  return (
    <Screen fill>
      <View style={styles.center}>
        <View style={styles.inner}>
          <StatusHero icon="circle-x" tone="error" />
          <T display s={21} w={700} align="center">Payment failed</T>
          <T s={13} c={colors.ink500} lh={1.625} align="center" style={styles.failSub}>
            Your token payment could not be confirmed. <T w={700} c={colors.ink700}>Reason: {reason}</T> No amount was deducted.
          </T>
          <View style={styles.failBtns}>
            <Btn full icon="rotate-cw" onPress={() => go('payment', { p: ctx?.p, dealId: ctx?.dealId })}>Try Again</Btn>
            <Btn variant="outline" full icon="arrow-left-right" onPress={() => go('payment', { p: ctx?.p, dealId: ctx?.dealId })}>Choose a Different Method</Btn>
          </View>
          <Pressable onPress={() => go('help')} style={styles.mt16}><T s={13} w={600} c={colors.brand600}>Contact Support</T></Pressable>
        </View>
      </View>
    </Screen>
  );
}

// ─── B-16 Registration details ───────────────────────────────
function RegistrationDetails({ go, back, ctx }: ScreenProps) {
  const s = useJ();
  const pid = jActiveBuyPid(ctx);
  const buy = s.buys.find(x => x.pid === pid && !x.cancelled);
  const p = (pid ? jFind(pid) : undefined) || ctx?.p;
  const [reg, setReg] = useState<BuyerDealRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        let dealId = String(ctx?.dealId || buy?.dealId || '');
        if (!dealId) {
          const { items } = await deals.listMyDeals({ limit: 50 });
          const match = (items || []).find(d => d.side === 'buyer' && (
            d.enquiryId === buy?.enquiry?.enquiryId ||
            (p?.title && d.title === p.title)
          ));
          dealId = match?.id ? String(match.id) : '';
        }
        if (!dealId) {
          if (!cancelled) setReg(null);
          return;
        }
        const detail = await deals.getMyDeal(dealId);
        if (!cancelled) setReg(detail.registration || null);
      } catch (e) {
        if (!cancelled) setErr(errorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [ctx?.dealId, buy?.dealId, buy?.enquiry?.enquiryId, p?.title, pid]);

  const checklist = (reg?.checklist && reg.checklist.length)
    ? reg.checklist.map(String)
    : [];
  const toggle = (d: string) => setChecks(c => ({ ...c, [d]: !c[d] }));
  const allChecked = checklist.length > 0 && checklist.every(d => checks[d]);
  const appt = reg?.appointment || {};
  const dateLabel = appt.date ? formatDateShort(new Date(appt.date)) : '';
  const timeLabel = appt.time || '';
  const office = appt.office || '';
  const address = appt.address || '';
  const mapsQuery = encodeURIComponent([office, address].filter(Boolean).join(' ') || 'Sub Registrar Office');

  return (
    <Screen
      footer={
        <BottomBar>
          <Pressable onPress={() => go('home')} disabled={!allChecked || !checklist.length} style={({ pressed }) => [styles.completeBtn, { backgroundColor: allChecked ? (pressed ? colors.emerald700 : colors.emerald600) : colors.ink100 }]}>
            <T s={15} w={600} c={allChecked ? colors.white : colors.ink400}>Deal Complete</T>
          </Pressable>
        </BottomBar>
      }>
      <TopBar onBack={back} title="Registration Details" sub={p?.title || undefined} />
      <View style={styles.payBody}>
        {loading ? (
          <View style={styles.load}><ActivityIndicator color={colors.brand600} /></View>
        ) : (
          <>
            <View style={styles.appt}>
              <View style={styles.apptHead}>
                <T s={11} upper ls={0.05} c="rgba(255,255,255,0.8)">Your appointment</T>
                {dateLabel || timeLabel ? (
                  <>
                    <T s={20} w={700} c="#FFFFFF" style={styles.mt4}>{dateLabel || 'Date TBA'}</T>
                    {timeLabel ? <T s={13} c="#FFFFFF">{timeLabel}</T> : null}
                  </>
                ) : (
                  <T s={14} c="#FFFFFF" style={styles.mt4}>Appointment not scheduled yet. Your advisor will confirm the Sub-Registrar slot.</T>
                )}
              </View>
              {office || address ? (
                <Pressable onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`)} style={({ pressed }) => [styles.office, pressed && { backgroundColor: colors.ink50 }]}>
                  <View style={styles.officeIcon}><Icon name="landmark" size={18} color="#1A6FFF" /></View>
                  <View style={styles.flex1}>
                    <T s={13} w={600}>{office || 'Registration office'}</T>
                    {address ? <T s={11.5} c={colors.ink500}>{address}</T> : null}
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
            {checklist.length ? (
              <View style={styles.checklist}>
                {checklist.map((d, i) => (
                  <Pressable key={d} onPress={() => toggle(d)} style={[styles.checkRow, i > 0 && styles.divider]} accessibilityRole="checkbox" accessibilityState={{ checked: !!checks[d] }}>
                    <View style={[styles.box, checks[d] ? styles.boxOn : styles.boxOff]}>{checks[d] && <Icon name="check" size={12} color="white" strokeWidth={3} />}</View>
                    <T s={13} c={checks[d] ? colors.ink400 : colors.ink800} style={checks[d] ? styles.strike : null}>{d}</T>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={styles.note}>
                <Icon name="file-text" size={14} color="#64748B" />
                <T s={12} c={colors.ink600} style={styles.flex1}>No registration checklist has been shared for this deal yet.</T>
              </View>
            )}
            {err ? <T s={12} c={colors.rose600} style={styles.mt8}>{err}</T> : null}
          </>
        )}
      </View>
    </Screen>
  );
}

/** B-16 gate: registration opens after the token payment. */
export function RegGateScreen(props: ScreenProps) {
  const s = useJ();
  const pid = jActiveBuyPid(props.ctx);
  const b = s.buys.find(x => x.pid === pid && !x.cancelled);
  const p = pid ? jFind(pid) : undefined;
  if (!b || buyStage(b) < 8) {
    return <JourneyLock back={props.back} title="Registration" body="Registration is scheduled after the token payment." action={() => props.go(b ? 'enquiryDetail' : 'buyTypes', { p })} label={b ? 'Open tracker' : 'Browse properties'} />;
  }
  return <RegistrationDetails {...props} />;
}

// ─── B-17 Cancel enquiry (bottom sheet over the enquiry) ─────
const CANCEL_REASONS = ['Changed my mind', 'Found another property', 'Other'];

export function CancelEnquiryScreen({ go, back, ctx }: ScreenProps) {
  const s = useJ();
  const pid = jActiveBuyPid(ctx);
  const buy = s.buys.find(x => x.pid === pid && !x.cancelled);
  const { property: p, loading } = useResolvedProperty(ctx);
  const title = p?.title || String(ctx?.title || buy?.enquiry?.propertyTitle || 'Your enquiry');
  const price = typeof p?.price === 'number' ? formatINR(p.price) : '';
  const enquiryId = String(ctx?.enquiryId || buy?.enquiry?.enquiryId || buy?.enquiry?.id || '');
  const [reason, setReason] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const confirmCancel = async () => {
    if (!enquiryId || !reason || busy) return;
    setBusy(true);
    setErr('');
    try {
      await buyEnquiries.cancelBuyEnquiry(enquiryId);
      if (pid) jCancelBuy(pid, reason);
      go('home');
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <Screen background={colors.white}>
        <TopBar onBack={back} title="Enquiry Detail" sub={title} />
        <View style={[styles.px4, styles.faint]} pointerEvents="none">
          {loading ? (
            <ActivityIndicator color={colors.brand600} />
          ) : (
            <View style={styles.dimCard}>
              <PhotoPlaceholder tag={p?.id || 'enq'} src={p?.images?.[0]} style={styles.thumb60} />
              <View>
                <T s={13} w={600}>{title}</T>
                {price ? <T s={12} w={500} c={colors.brand600}>{price}</T> : null}
              </View>
            </View>
          )}
        </View>
      </Screen>
      <Sheet onClose={back} title="Cancel this enquiry?">
        <View style={styles.sheetProp}>
          <PhotoPlaceholder tag={p?.id || 'enq'} src={p?.images?.[0]} style={styles.thumb44} />
          <T s={13} w={600}>{title}</T>
        </View>
        {!enquiryId ? (
          <T s={12} c={colors.rose600} style={styles.mb8}>No enquiry id available to cancel.</T>
        ) : null}
        <Field label="Reason for cancelling">
          <View>
            <Pressable onPress={() => setOpen(o => !o)} style={[styles.select, open && { borderColor: colors.brand600 }]} accessibilityRole="combobox">
              <T s={14} c={colors.ink900}>{reason || 'Select a reason'}</T>
              <Icon name="chevron-down" size={16} color="#94A3B8" />
            </Pressable>
            {open && (
              <View style={styles.options}>
                {CANCEL_REASONS.map(r => (
                  <Pressable key={r} onPress={() => { setReason(r); setOpen(false); }} style={({ pressed }) => [styles.option, (pressed || reason === r) && { backgroundColor: colors.brand50 }]}>
                    <T s={14}>{r}</T>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </Field>
        {err ? <T s={12} c={colors.rose600} style={styles.mb8}>{err}</T> : null}
        <View style={styles.sheetBtns}>
          <Pressable onPress={() => { void confirmCancel(); }} disabled={!reason || !enquiryId || busy} style={({ pressed }) => [styles.cancelBtn, { backgroundColor: reason && enquiryId ? (pressed ? colors.rose700 : colors.rose600) : colors.rose200 }]}>
            <T s={15} w={600} c="#FFFFFF">{busy ? 'Cancelling…' : 'Cancel Enquiry'}</T>
          </Pressable>
          <Pressable onPress={back} style={({ pressed }) => [styles.cancelBtn, { backgroundColor: pressed ? colors.ink200 : colors.ink100 }]}>
            <T s={15} w={600} c={colors.ink700}>Keep Enquiry</T>
          </Pressable>
        </View>
      </Sheet>
    </View>
  );
}

/** B-18 Property withdrawn */
export function PropertyWithdrawnScreen({ go, back, ctx }: ScreenProps) {
  const { property: p, loading } = useResolvedProperty(ctx);
  const title = p?.title || String(ctx?.title || 'This property');
  const location = p ? `${p.location}${p.city ? ` · ${p.city}` : ''}` : String(ctx?.location || '');
  const price = typeof p?.price === 'number' ? formatINR(p.price) : '';
  return (
    <Screen>
      <TopBar onBack={back} title="Enquiry Detail" />
      <View style={styles.px4}>
        <View style={styles.warn}>
          <StatusMark kind="warn" size={20} />
          <T s={12.5} w={500} c={colors.amber800} style={styles.flex1}>This property is no longer available.</T>
        </View>
        {loading ? (
          <View style={styles.load}><ActivityIndicator color={colors.brand600} /></View>
        ) : (
          <View style={styles.greyCard}>
            <View style={styles.row12}>
              <PhotoPlaceholder tag={p?.id || 'withdrawn'} src={p?.images?.[0]} style={[styles.thumb72, styles.grayscale]} />
              <View style={styles.flex1}>
                <T s={14} w={600}>{title}</T>
                {location ? <T s={12} c={colors.ink500}>{location}</T> : null}
                {price ? <T s={13} w={700} c={colors.ink400} style={styles.mt4}>{price}</T> : null}
                <Badge color="ink">Withdrawn by owner</Badge>
              </View>
            </View>
          </View>
        )}
        <Btn full icon="search" onPress={() => go('filters')}>Browse Similar Properties</Btn>
      </View>
    </Screen>
  );
}

/** B-19 Sold out */
export function SoldOutScreen({ go, back, ctx }: ScreenProps) {
  const { property: sp, loading } = useResolvedProperty(ctx);
  if (loading) {
    return (
      <Screen>
        <View style={styles.load}><ActivityIndicator color={colors.brand600} /></View>
      </Screen>
    );
  }
  if (!sp) {
    return (
      <Screen>
        <TopBar onBack={back} title="Sold out" />
        <View style={styles.soldBody}>
          <T display s={20} w={700} align="center">This property has been sold</T>
          <Btn full style={styles.mt20} onPress={() => go('home')}>Back to Home</Btn>
        </View>
      </Screen>
    );
  }
  return (
    <Screen padBottom>
      <PhotoPlaceholder tag={sp.id} height={260}>
        <View style={[StyleSheet.absoluteFill, styles.soldOverlay]}>
          <View style={styles.soldStamp}><T s={34} w={900} c="#FFFFFF" ls={0.2}>SOLD</T></View>
        </View>
        <Pressable onPress={back} style={styles.soldBack} accessibilityLabel="Back"><Icon name="arrow-left" size={18} /></Pressable>
      </PhotoPlaceholder>
      <View style={styles.soldBody}>
        <T display s={20} w={700} align="center">This property has been sold</T>
        <T s={13} c={colors.ink500} lh={1.625} align="center" style={styles.soldSub}>
          {sp.title} was sold{sp.soldOn ? ` on ${sp.soldOn}` : ''} and is no longer on the market. Explore similar listings nearby.
        </T>
        <View style={styles.soldGrid}>
          {([['Listed at', formatINR(sp.price)], ['Area', sp.area ? sp.area + ' sqft' : '—'], ['Location', sp.location]] as [string, string][]).map(([k, v]) => (
            <View key={k} style={styles.soldCell}>
              <T s={10} c={colors.ink500}>{k}</T>
              <T s={12} w={700} truncate>{v}</T>
            </View>
          ))}
        </View>
        <Btn full style={styles.mt20} icon="search" onPress={() => go('buyList', { type: sp.type || 'apartment' })}>View Similar Properties</Btn>
        <Btn variant="outline" full style={styles.mt8} onPress={() => go('home')}>Back to Home</Btn>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  load: { paddingVertical: 80, alignItems: 'center' },
  px4: { paddingHorizontal: 16 },
  gap10: { gap: 10 },
  row12: { flexDirection: 'row', gap: 12 },
  mt4: { marginTop: 4 },
  mt8: { marginTop: 8 },
  mt16: { marginTop: 16 },
  mt20: { marginTop: 20 },
  mb8: { marginBottom: 8 },
  mb16: { marginBottom: 16 },
  dim70: { opacity: 0.7 },
  faint: { opacity: 0.4 },
  divider: { borderTopWidth: 1, borderTopColor: colors.ink100 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, backgroundColor: colors.brand50, marginBottom: 16 },
  bell: { width: 32, height: 32, borderRadius: 9999, backgroundColor: colors.brand600, alignItems: 'center', justifyContent: 'center' },
  note: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14, backgroundColor: colors.ink50 },
  payBody: { paddingHorizontal: 16, paddingBottom: 96 },
  amount: { borderRadius: 14, backgroundColor: colors.brand600, padding: 20, marginBottom: 20 },
  method: { padding: 12, borderRadius: 14, borderWidth: 1, alignItems: 'center', gap: 6 },
  methodOn: { borderColor: colors.brand600, backgroundColor: colors.brand50 },
  methodOff: { borderColor: colors.ink200 },
  bank: { borderRadius: 14, borderWidth: 1, borderColor: colors.ink200 },
  bankRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  copy: { paddingHorizontal: 8, paddingVertical: 4 },
  upi: { borderRadius: 14, borderWidth: 1, borderColor: colors.ink200, padding: 16, alignItems: 'center' },
  qr: { width: 176, height: 176, borderRadius: 8, borderWidth: 1, borderColor: colors.ink200, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  qrCenter: { position: 'absolute', width: 64, height: 64, backgroundColor: colors.white, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  upiId: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: colors.ink50, alignSelf: 'stretch' },
  cheque: { borderRadius: 14, borderWidth: 1, borderColor: colors.ink200, padding: 16, gap: 10 },
  chequeRow: { flexDirection: 'row', gap: 8 },
  chequeNum: { width: 20, height: 20, borderRadius: 9999, backgroundColor: colors.brand50, alignItems: 'center', justifyContent: 'center' },
  payBtn: { width: '100%', height: 48, borderRadius: 12, backgroundColor: colors.brand600, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  payPressed: { backgroundColor: colors.brand700 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  inner: { width: '100%', alignItems: 'center' },
  failSub: { marginTop: 8, maxWidth: 260 },
  failBtns: { marginTop: 24, gap: 8, alignSelf: 'stretch' },
  appt: { borderRadius: 14, borderWidth: 1, borderColor: colors.ink200, overflow: 'hidden', marginBottom: 16 },
  apptHead: { backgroundColor: colors.brand600, paddingHorizontal: 16, paddingVertical: 12 },
  office: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  officeIcon: { width: 40, height: 40, borderRadius: 9999, backgroundColor: colors.brand50, alignItems: 'center', justifyContent: 'center' },
  checklist: { borderRadius: 14, borderWidth: 1, borderColor: colors.ink200, marginBottom: 16 },
  checkRow: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  box: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.brand600, borderColor: colors.brand600 },
  boxOff: { borderColor: colors.ink300 },
  strike: { textDecorationLine: 'line-through' },
  completeBtn: { width: '100%', height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dimCard: { borderRadius: 14, borderWidth: 1, borderColor: colors.ink200, padding: 12, flexDirection: 'row', gap: 12 },
  thumb44: { width: 44, height: 44, borderRadius: 6 },
  thumb60: { width: 60, height: 60, borderRadius: 6 },
  thumb72: { width: 72, height: 72, borderRadius: 6 },
  sheetProp: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, backgroundColor: colors.ink50, marginBottom: 16 },
  select: { width: '100%', height: 48, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.ink200, borderRadius: 14, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  options: { marginTop: 4, borderWidth: 1, borderColor: colors.ink200, borderRadius: 14, backgroundColor: colors.white, overflow: 'hidden' },
  option: { paddingHorizontal: 12, paddingVertical: 10 },
  sheetBtns: { marginTop: 20, gap: 8 },
  cancelBtn: { width: '100%', height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  warn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, backgroundColor: colors.amber50, borderWidth: 1, borderColor: colors.amber200, marginBottom: 16 },
  greyCard: { borderRadius: 14, borderWidth: 1, borderColor: colors.ink200, padding: 12, opacity: 0.5, marginBottom: 20 },
  grayscale: { filter: 'grayscale(1)' },
  soldOverlay: { backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  soldStamp: { borderWidth: 4, borderColor: colors.white, paddingHorizontal: 24, paddingVertical: 8, borderRadius: 4, transform: [{ rotate: '-12deg' }] },
  soldBack: { position: 'absolute', left: 16, top: 12, width: 40, height: 40, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)' },
  soldBody: { paddingHorizontal: 16, paddingTop: 20, alignItems: 'center' },
  soldSub: { marginTop: 8, maxWidth: 270 },
  soldGrid: { marginTop: 20, alignSelf: 'stretch', flexDirection: 'row', gap: 1, backgroundColor: 'rgba(226,232,240,0.7)', borderRadius: 16, overflow: 'hidden', boxShadow: ring('rgba(226,232,240,0.7)') },
  soldCell: { flex: 1, minWidth: 0, backgroundColor: colors.white, paddingHorizontal: 10, paddingVertical: 8 },
});
