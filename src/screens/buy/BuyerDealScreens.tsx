import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { StatusHero } from '../../components/hero/StatusHero';
import { Icon } from '../../components/icons/Icon';
import { JourneyLock, PropMini } from '../../components/journey/JourneyParts';
import { DockBar } from '../../components/layout/AppScreen';
import { Card } from '../../components/layout/Groups';
import { BottomBar, Screen, TopBar } from '../../components/layout/Screen';
import { Btn } from '../../components/ui/Btn';
import { Field, Input } from '../../components/ui/Field';
import { Grid } from '../../components/layout/Grid';
import { FadeIn } from '../../components/ui/Motion';
import { buzz } from '../../components/ui/Press';
import { T } from '../../components/ui/T';
import { useAuth } from '../../context/AuthContext';
import { TOKEN_AMOUNT, buyStage, jActiveBuyPid, jAdvanceBuy, jFind, jUpsertBuy, useJ } from '../../context/journeyStore';
import type { ScreenProps } from '../../navigation/types';
import * as documents from '../../services/documents.service';
import { colors, elev, ring } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { formatDayTime } from '../../utils/dates';
import { formatINR } from '../../utils/format';
import { pickSingleImage } from '../../utils/pickImage';
import { useResolvedProperty } from '../../utils/useResolvedProperty';

const NEXT_STEPS = ['Review title, EC and approval documents', 'Complete KYC verification', 'Pay the token amount', 'Register at the Sub-Registrar office'];

/** B-13c Buyer deal confirmed */
export function BuyerDealScreen({ go, back, ctx }: ScreenProps) {
  const s = useJ();
  const pid = jActiveBuyPid(ctx);
  const b = s.buys.find(x => x.pid === pid && !x.cancelled);
  const p = pid ? jFind(pid) : undefined;
  if (!b || !p || !pid) return <JourneyLock back={back} title="Deal confirmed" body="Start with an enquiry or a site visit on a property." action={() => go('buyTypes')} label="Browse properties" />;
  const st = buyStage(b);
  if (st < 3) return <JourneyLock back={back} title="Deal confirmed" body="Complete your site visit first. You can confirm the deal once you've seen the property." action={() => go('enquiryDetail', { p })} label="Open tracker" />;
  const confirmed = st > 3;
  return (
    <Screen
      footer={
        <DockBar legacy>
          {confirmed
            ? <Btn full iconRight="arrow-right" onPress={() => go('documentsShared', { p })}>Review documents</Btn>
            : <Btn full onPress={() => { jAdvanceBuy(pid, 4); buzz(14); }}>Confirm deal</Btn>}
        </DockBar>
      }>
      <TopBar onBack={back} title="Deal confirmed" sub={p.title} />
      <View style={styles.body}>
        {confirmed && <View style={styles.center}><StatusHero icon="handshake" tone="success" size={84} /></View>}
        <Card pad={16}>
          <T s={11} w={700} upper ls={0.08} c={colors.ink400} align="center">Agreed price</T>
          <T display num s={32} w={800} ls={-0.035} align="center" style={styles.mt4}>{formatINR(p.price)}</T>
          <T s={12} c={colors.ink500} align="center">{formatINR(p.sqftPrice)}/sqft · {p.area} sqft</T>
        </Card>
        <PropMini p={p} />
        <Card pad={16}>
          <T s={13} w={700} style={styles.mb8}>Payment breakdown</T>
          {([['Token amount (at KYC)', TOKEN_AMOUNT], ['Balance at registration', p.price - TOKEN_AMOUNT]] as [string, number][]).map(([l, v]) => (
            <View key={l} style={styles.line}>
              <T s={13} c={colors.ink600}>{l}</T>
              <T num s={13} w={700}>{formatINR(v)}</T>
            </View>
          ))}
          <View style={styles.hairline} />
          <View style={styles.lineTotal}>
            <T s={14} w={700}>Total</T>
            <T num s={14} w={800}>{formatINR(p.price)}</T>
          </View>
        </Card>
        <Card pad={16}>
          <T s={13} w={700} style={styles.mb8}>What happens next</T>
          {NEXT_STEPS.map((t, i) => (
            <View key={t} style={styles.next}>
              <View style={styles.num}><T num s={11} w={700} c={colors.brand700}>{i + 1}</T></View>
              <T s={12.5} style={styles.flex1}>{t}</T>
            </View>
          ))}
        </Card>
        <Pressable onPress={() => go('pdfViewer', { title: 'Term Sheet' })} style={styles.doc}>
          <Icon name="file-text" size={18} color="#E11D48" />
          <T s={13} w={600} style={styles.flex1}>Term sheet.pdf</T>
          <Icon name="chevron-right" size={16} color="#94A3B8" />
        </Pressable>
      </View>
    </Screen>
  );
}

/** B-14a KYC verification — status from GET /me; upload via documents.upload when a file URI is available. */
export function BuyerKycScreen({ go, back, ctx }: ScreenProps) {
  const { user, refreshProfile } = useAuth();
  const s = useJ();
  const pid = jActiveBuyPid(ctx);
  const b = s.buys.find(x => x.pid === pid && !x.cancelled);
  const p = pid ? jFind(pid) : undefined;
  const [pan, setPan] = useState('');
  const [aad, setAad] = useState('');
  const [idUri, setIdUri] = useState<string | null>(typeof ctx?.kycUri === 'string' ? ctx.kycUri : null);
  const [idUp, setIdUp] = useState(false);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState('');
  const [err, setErr] = useState('');
  if (!b || !pid || buyStage(b) < 5) {
    return <JourneyLock back={back} title="KYC verification" body="Review the property documents first. KYC opens once documents are reviewed." action={() => go(b ? 'documentsShared' : 'buyTypes', { p })} label={b ? 'Review documents' : 'Browse properties'} />;
  }
  const apiVerified = user?.kycStatus === 'verified';
  const apiPending = user?.kycStatus === 'pending';
  const done = buyStage(b) > 5 || apiVerified;
  const panOk = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan), aadOk = /^\d{12}$/.test(aad);
  const valid = panOk && aadOk && (idUp || apiPending || apiVerified) && ok;

  const uploadIdProof = async (uri: string) => {
    if (!user?._id) {
      setHint('Sign in required to upload KYC documents.');
      return;
    }
    setBusy(true);
    setErr('');
    setHint('');
    try {
      await documents.uploadDocument(
        { uri, name: uri.split('/').pop() || `kyc-${Date.now()}.jpg`, type: 'image/jpeg' },
        { ownerType: 'user', ownerId: user._id, purpose: 'kyc', documentType: panOk ? 'pan' : 'aadhaar' },
      );
      setIdUri(uri);
      setIdUp(true);
      await refreshProfile();
      buzz(14);
    } catch (e) {
      setErr(errorMessage(e));
      setIdUp(false);
    } finally {
      setBusy(false);
    }
  };

  const onUploadPress = async () => {
    try {
      const existing = typeof ctx?.kycUri === 'string' ? ctx.kycUri : idUri;
      if (existing) {
        await uploadIdProof(existing);
        return;
      }
      const picked = await pickSingleImage();
      if (!picked) return;
      await uploadIdProof(picked.uri);
    } catch (e) {
      setErr(errorMessage(e));
      buzz();
    }
  };

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setErr('');
    try {
      if (idUri && !idUp) await uploadIdProof(idUri);
      const me = await refreshProfile();
      const verified = me?.kycStatus === 'verified' || me?.kycStatus === 'pending' || apiVerified || apiPending || idUp;
      if (!verified && !idUp) {
        setErr('Upload your ID proof before continuing. KYC is verified by Builtglory after review.');
        return;
      }
      jUpsertBuy(pid, {
        kyc: {
          pan: pan.slice(0, 2) + '•••••' + pan.slice(-3),
          aadhaar: '•••• ' + aad.slice(-4),
          at: Date.now(),
          status: me?.kycStatus || user?.kycStatus || (idUp ? 'pending' : undefined),
        },
      });
      jAdvanceBuy(pid, 6);
      buzz(14);
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <Screen footer={<DockBar legacy><Btn full iconRight="arrow-right" onPress={() => go('payment', { p })}>Pay token {formatINR(TOKEN_AMOUNT)}</Btn></DockBar>}>
        <TopBar onBack={back} title="KYC verified" />
        <View style={styles.verified}>
          <View style={[styles.center, styles.mt16]}><StatusHero icon="shield-check" tone="success" size={88} /></View>
          <T display s={22} w={800} align="center" style={styles.mt16}>Identity verified</T>
          <T s={13} c={colors.ink500} align="center" style={styles.mt4}>
            {b.kyc ? `PAN ${b.kyc.pan} · Aadhaar ${b.kyc.aadhaar}` : `KYC status: ${user?.kycStatus || 'verified'}`}
          </T>
        </View>
      </Screen>
    );
  }
  return (
    <Screen footer={<DockBar legacy><Btn full disabled={!valid || busy} onPress={() => { void submit(); }}>{busy ? 'Submitting…' : apiPending ? 'Continue' : 'Submit for verification'}</Btn></DockBar>}>
      <TopBar onBack={back} title="KYC verification" sub={apiPending ? 'Pending Builtglory review' : 'Required before any payment'} />
      <View style={styles.body}>
        {user?.kycStatus ? <T s={12} c={colors.ink500}>Current status: {user.kycStatus.replace(/_/g, ' ')}</T> : null}
        <Field label="PAN number" required>
          <Input icon="id-card" placeholder="ABCDE1234F" maxLength={10} autoCapitalize="characters" value={pan} onChangeText={v => setPan(v.toUpperCase().replace(/[^A-Z0-9]/g, ''))} />
        </Field>
        {pan && !panOk ? <T s={11.5} c={colors.rose600} style={styles.errLine}>Enter a valid PAN (5 letters, 4 digits, 1 letter)</T> : null}
        <Field label="Aadhaar number" required>
          <Input icon="fingerprint" keyboardType="number-pad" placeholder="12-digit Aadhaar" maxLength={12} value={aad} onChangeText={v => setAad(v.replace(/\D/g, ''))} />
        </Field>
        {aad && !aadOk ? <T s={11.5} c={colors.rose600} style={styles.errLine}>Aadhaar must be 12 digits</T> : null}
        <Pressable onPress={onUploadPress} disabled={busy} style={[styles.upload, idUp ? styles.uploadOn : styles.uploadOff]}>
          <Icon name={idUp ? 'check-circle-2' : 'upload'} size={20} color={idUp ? '#10B981' : '#1A6FFF'} />
          <View style={styles.flex1}>
            <T s={13} w={700}>{idUp ? 'ID proof uploaded' : 'Upload ID proof'}</T>
            <T s={11.5} c={colors.ink500}>PAN card or Aadhaar · JPG or PDF</T>
          </View>
        </Pressable>
        {hint ? <T s={11.5} c={colors.ink500}>{hint}</T> : null}
        {err ? <T s={11.5} c={colors.rose600}>{err}</T> : null}
        <Pressable onPress={() => setOk(!ok)} style={styles.consent} accessibilityRole="checkbox" accessibilityState={{ checked: ok }}>
          <View style={[styles.checkbox, ok ? styles.checkOn : styles.checkOff]}>{ok && <Icon name="check" size={11} color="white" strokeWidth={3} />}</View>
          <T s={12.5} c={colors.ink700} style={styles.flex1}>I confirm these details are mine and consent to Builtglory verifying them.</T>
        </Pressable>
      </View>
    </Screen>
  );
}

/** B-15b Token payment successful */
export function PaymentSuccessScreen({ go, ctx }: ScreenProps) {
  const { appConfig } = useAuth();
  const s = useJ();
  const pid = jActiveBuyPid(ctx);
  const { property: resolved } = useResolvedProperty(ctx);
  const p = resolved || (pid && jFind(pid)) || ctx?.p;
  const b = s.buys.find(x => x.pid === pid && !x.cancelled);
  const tokenAmount = appConfig?.payment?.tokenAmount || TOKEN_AMOUNT;
  const pay = (b && b.payment) || {
    ref: ctx?.paymentRef || '—',
    at: Date.now(),
    amount: typeof ctx?.amount === 'number' ? ctx.amount : tokenAmount,
    method: (ctx && ctx.method) || 'Bank Transfer',
  };
  if (!p) {
    return (
      <Screen fill>
        <View style={styles.success}>
          <StatusHero icon="check" tone="success" />
          <T display s={22} w={800} align="center" style={styles.mt20}>Token payment successful</T>
          <Btn full style={styles.mt20} onPress={() => go('home')}>Home</Btn>
        </View>
      </Screen>
    );
  }
  const rows: [string, string][] = [['Payment mode', pay.method], ['Transaction ID', pay.ref], ['Date & time', formatDayTime(pay.at)], ['Paid to', 'Builtglory Escrow A/C']];
  return (
    <Screen
      fill
      footer={
        <BottomBar style={styles.gap8}>
          <Btn full iconRight="arrow-right" onPress={() => go('registrationDetails', { p })}>Continue to Registration</Btn>
          <Grid cols={2} gap={8}>
            <Btn variant="outline" full icon="receipt" onPress={() => go('pdfViewer', { title: 'Token Receipt' })}>Receipt</Btn>
            <Btn variant="outline" full icon="list-checks" onPress={() => go('enquiryDetail', { p })}>Track status</Btn>
          </Grid>
        </BottomBar>
      }>
      <View style={styles.success}>
        <View style={styles.center}><StatusHero icon="check" tone="success" /></View>
        <FadeIn><T display s={24} w={800} ls={-0.03} align="center" style={styles.mt20}>Token payment successful</T></FadeIn>
        <FadeIn><T s={13.5} c={colors.ink500} align="center" style={styles.successSub}>Your reference is submitted for verification. A refund is recorded only after BuiltGlory confirms the return transfer.</T></FadeIn>
        <FadeIn style={styles.receipt}>
          <View style={styles.receiptHead}>
            <T s={11} w={700} upper ls={0.08} c={colors.emerald700} align="center">Amount paid</T>
            <T display num s={32} w={800} lh={1.25} align="center" style={styles.mt2}>{formatINR(pay.amount)}</T>
          </View>
          {rows.map(([k, v], i) => (
            <View key={k} style={[styles.receiptRow, i > 0 && styles.divider]}>
              <T s={12.5} c={colors.ink500}>{k}</T>
              <T num s={13} w={700} align="right" style={styles.shrink}>{v}</T>
            </View>
          ))}
        </FadeIn>
        <View style={styles.mt12}><PropMini p={p} /></View>
        <View style={styles.nextBox}>
          <Icon name="calendar-check" size={18} color="#1A6FFF" style={styles.mt2} />
          <T s={12.5} c={colors.brand800} lh={1.625} style={styles.flex1}>
            <T w={700}>Next: Registration.</T> Your advisor will confirm the Sub-Registrar appointment. The balance of {formatINR(p.price - pay.amount)} is due at registration.
          </T>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  shrink: { flexShrink: 1 },
  center: { alignItems: 'center' },
  gap8: { gap: 8 },
  mt2: { marginTop: 2 },
  mt4: { marginTop: 4 },
  mt12: { marginTop: 12 },
  mt16: { marginTop: 16 },
  mt20: { marginTop: 20 },
  mb8: { marginBottom: 8 },
  body: { paddingHorizontal: 16, paddingBottom: 128, gap: 16 },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  hairline: { height: 1, marginVertical: 8, experimental_backgroundImage: 'linear-gradient(90deg, rgba(15,23,42,0), rgba(15,23,42,0.1), rgba(15,23,42,0))' },
  lineTotal: { flexDirection: 'row', justifyContent: 'space-between' },
  next: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  num: { width: 24, height: 24, borderRadius: 9999, backgroundColor: colors.brand50, alignItems: 'center', justifyContent: 'center' },
  doc: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, backgroundColor: colors.white, boxShadow: ring(colors.ink200) },
  verified: { paddingHorizontal: 16, paddingBottom: 128 },
  errLine: { marginTop: -8 },
  upload: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed' },
  uploadOn: { borderColor: colors.emerald300, backgroundColor: colors.emerald50 },
  uploadOff: { borderColor: colors.ink200 },
  consent: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox: { marginTop: 2, width: 16, height: 16, borderRadius: 3, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: '#1A6FFF', borderColor: '#1A6FFF' },
  checkOff: { borderColor: '#767676', backgroundColor: colors.white },
  success: { flex: 1, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 160 },
  successSub: { marginTop: 6, maxWidth: 290, alignSelf: 'center' },
  receipt: { marginTop: 24, borderRadius: 24, backgroundColor: colors.white, boxShadow: elev.e2, overflow: 'hidden' },
  receiptHead: { padding: 16, backgroundColor: colors.emerald50, borderBottomWidth: 1, borderBottomColor: colors.emerald100 },
  receiptRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  divider: { borderTopWidth: 1, borderTopColor: colors.ink100 },
  nextBox: { marginTop: 12, borderRadius: 16, backgroundColor: colors.brand50, boxShadow: ring(colors.brand100), padding: 14, flexDirection: 'row', gap: 12 },
});
