import React, { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusHero } from '../../components/hero/StatusHero';
import { Icon } from '../../components/icons/Icon';
import { Screen, TopBar } from '../../components/layout/Screen';
import { Btn } from '../../components/ui/Btn';
import { Field, Input } from '../../components/ui/Field';
import { FadeIn } from '../../components/ui/Motion';
import { T } from '../../components/ui/T';
import { useAuth } from '../../context/AuthContext';
import type { ScreenProps } from '../../navigation/types';
import * as authService from '../../services/auth.service';
import * as documents from '../../services/documents.service';
import * as meService from '../../services/me.service';
import { colors, elev } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { useToast } from '../../utils/useToast';

/** P-03 Change phone number (new number → OTP → verified) */
export function ChangePhoneScreen({ go, back }: ScreenProps) {
  const { refreshProfile } = useAuth();
  const [step, setStep] = useState<'new' | 'otp' | 'verified'>('new');
  const [newPhone, setNewPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [requestId, setRequestId] = useState('');
  const [timer, setTimer] = useState(0);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');
  const sendOtp = async () => {
    if (!newPhone || newPhone.length < 10 || sending) return;
    setSending(true);
    setErr('');
    try {
      const res = await authService.sendOtp({
        countryCode: '+91',
        phone: newPhone,
        purpose: 'change_phone',
      });
      setRequestId(res.requestId);
      setStep('otp');
      const canResend = res.canResendAt ? Math.max(0, Math.ceil((new Date(res.canResendAt).getTime() - Date.now()) / 1000)) : 30;
      setTimer(canResend || 30);
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setSending(false);
    }
  };
  useEffect(() => {
    if (timer <= 0) return;
    const t = setInterval(() => setTimer(tm => tm - 1), 1000);
    return () => clearInterval(t);
  }, [timer]);
  const verifyOtp = async () => {
    if (otp.length !== 6 || !requestId) return;
    setErr('');
    try {
      await authService.verifyOtp({
        countryCode: '+91',
        phone: newPhone,
        otp,
        requestId,
        purpose: 'change_phone',
      });
      await meService.patchMe({ mobileNumber: newPhone });
      await refreshProfile();
      setStep('verified');
    } catch (e) {
      setErr(errorMessage(e));
    }
  };
  if (step === 'verified') {
    return (
      <Screen fill>
        <View style={styles.center}>
          <View style={styles.inner}>
            <StatusHero icon="check-circle" tone="success" />
            <T display s={22} w={700} align="center">Phone number updated</T>
            <T s={13} c={colors.ink500} align="center" style={styles.mt8}>Your new number +91 {newPhone} is now verified.</T>
            <Btn full style={styles.mt24} onPress={() => go('profileEdit')}>Back to profile</Btn>
          </View>
        </View>
      </Screen>
    );
  }
  return (
    <Screen>
      <TopBar onBack={back} title={step === 'new' ? 'Change Phone Number' : 'Verify Phone'} />
      <View style={styles.px4}>
        {step === 'new' ? (
          <>
            <T display s={16} w={600} style={styles.h2}>Enter new phone number</T>
            <T s={12.5} c={colors.ink500} style={styles.mb16}>We'll send a verification code to this number.</T>
            <Field label="New Phone Number" required>
              <Input prefix="+91" keyboardType="phone-pad" maxLength={10} value={newPhone} onChangeText={v => setNewPhone(v.replace(/\D/g, ''))} placeholder="9876543210" />
            </Field>
            {err ? <T s={12} c={colors.rose600}>{err}</T> : null}
            <Btn full style={styles.mt24} disabled={!newPhone || newPhone.length < 10 || sending} onPress={() => void sendOtp()}>{sending ? 'Sending OTP...' : 'Send OTP'}</Btn>
          </>
        ) : (
          <>
            <T display s={16} w={600} style={styles.h2}>Enter verification code</T>
            <T s={12.5} c={colors.ink500} style={styles.mb16}>We sent a 6-digit code to +91 {newPhone}</T>
            <Field label="Verification Code" required>
              <Input keyboardType="number-pad" maxLength={6} value={otp} onChangeText={v => setOtp(v.replace(/\D/g, ''))} placeholder="000000" style={styles.code} />
            </Field>
            {err ? <T s={12} c={colors.rose600}>{err}</T> : null}
            <Btn full style={styles.mt24} disabled={otp.length !== 6} onPress={() => void verifyOtp()}>Verify & Update</Btn>
            <Pressable onPress={() => void sendOtp()} disabled={timer > 0 || sending} style={styles.resend}>
              <T s={13} w={500} c={timer > 0 ? colors.ink400 : colors.brand600} align="center">{timer > 0 ? `Resend in ${timer}s` : 'Resend code'}</T>
            </Pressable>
          </>
        )}
      </View>
    </Screen>
  );
}

function EmptyShell({ back, title, icon, heading, body, action }: { back: () => void; title: string; icon: string; heading: string; body: string; action: React.ReactNode }) {
  return (
    <Screen>
      <TopBar onBack={back} title={title} />
      <View style={styles.emptyBody}>
        <StatusHero icon={icon} tone="empty" />
        <T display s={18} w={700} align="center">{heading}</T>
        <T s={13} c={colors.ink500} lh={1.625} align="center" style={styles.emptySub}>{body}</T>
        <View style={styles.mt24}>{action}</View>
      </View>
    </Screen>
  );
}

/** P-06 No listings */
export function NoListingsScreen({ go, back }: ScreenProps) {
  return (
    <EmptyShell back={back} title="My Listings" icon="tag" heading="You haven't listed any properties yet."
      body="List your property and start receiving verified buyer enquiries."
      action={<Btn icon="plus" style={styles.selfCenter} onPress={() => go('sellType')}>List a Property</Btn>} />
  );
}

/** P-09 No enquiries */
export function NoEnquiriesScreen({ go, back }: ScreenProps) {
  return (
    <EmptyShell back={back} title="My Enquiries" icon="inbox" heading="You haven't submitted any enquiries yet."
      body="Browse verified properties and submit an enquiry to get started."
      action={<Btn icon="search" style={styles.selfCenter} onPress={() => go('home')}>Browse Properties</Btn>} />
  );
}

/** P-11 Document viewer — opens read-url when documentId is provided. */
export function DocumentViewerScreen({ back, ctx }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const doc = ctx?.doc || { name: ctx?.title || 'Document' };
  const documentId = ctx?.documentId || doc?._id || doc?.id;
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const totalPages = 6;
  const [toast, showToast] = useToast(1400);
  const [readUrl, setReadUrl] = useState<string | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!documentId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await documents.getDocumentReadUrl(String(documentId));
        if (!cancelled) setReadUrl(res.readUrl);
      } catch (e) {
        if (!cancelled) setErr(errorMessage(e));
      }
    })();
    return () => { cancelled = true; };
  }, [documentId]);

  const openRemote = async () => {
    if (!readUrl) {
      showToast(err || 'No document URL available');
      return;
    }
    try {
      await Linking.openURL(readUrl);
    } catch {
      showToast('Unable to open document');
    }
  };

  return (
    <View style={styles.viewer}>
      <View style={{ height: insets.top }} />
      <View style={styles.toolbar}>
        <Pressable onPress={back} style={({ pressed }) => [styles.tool, pressed && styles.toolPressed]} accessibilityLabel="Back"><Icon name="arrow-left" size={20} color="white" /></Pressable>
        <View style={styles.flex1}>
          <T s={14} w={600} c="#FFFFFF" truncate>{doc.name || 'Document'}.pdf</T>
          <T s={10.5} c="rgba(255,255,255,0.5)">{readUrl ? 'Secure link ready' : err || `Page ${page} of ${totalPages}`}</T>
        </View>
        <Pressable onPress={() => void openRemote()} style={({ pressed }) => [styles.tool, pressed && styles.toolPressed]} accessibilityLabel="Download"><Icon name="download" size={17} color="white" /></Pressable>
        <Pressable onPress={() => void openRemote()} style={({ pressed }) => [styles.tool, pressed && styles.toolPressed]} accessibilityLabel="Share"><Icon name="share-2" size={16} color="white" /></Pressable>
      </View>
      <ScrollView style={styles.flex1} contentContainerStyle={styles.pageWrap} horizontal={false} showsVerticalScrollIndicator={false}>
        <View style={[styles.page, { width: 280 * zoom }]}>
          <View style={styles.p24}>
            <View style={styles.pageHead}>
              <T s={11} w={700} upper ls={0.05} align="center">{doc.name}</T>
              <T s={8} c={colors.ink400} align="center" style={styles.mt4}>Builtglory · Legally Verified Document</T>
            </View>
            <View style={styles.lines}>
              {Array.from({ length: 14 }).map((_, i) => <View key={i} style={[styles.line, { width: `${60 + ((i * 37) % 40)}%` }]} />)}
            </View>
            <View style={styles.stamp}><Icon name="stamp" size={28} color="#CBD5E1" /></View>
            <View style={styles.lines}>
              {Array.from({ length: 8 }).map((_, i) => <View key={i} style={[styles.line, { width: `${55 + ((i * 53) % 42)}%` }]} />)}
            </View>
            <View style={styles.pageFoot}>
              <T s={8} c={colors.ink400}>Page {page}</T>
              <View style={styles.sign}><T s={7} c={colors.ink400}>Signature</T></View>
            </View>
          </View>
        </View>
      </ScrollView>
      <View style={[styles.controls, { paddingBottom: 12 + insets.bottom }]}>
        <Pressable onPress={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={[styles.ctrl, page === 1 && styles.dim]} accessibilityLabel="Previous page"><Icon name="chevron-left" size={18} color="white" /></Pressable>
        <View style={styles.zoomRow}>
          <Pressable onPress={() => setZoom(z => Math.max(0.8, z - 0.2))} style={styles.ctrl} accessibilityLabel="Zoom out"><Icon name="zoom-out" size={16} color="white" /></Pressable>
          <T s={12} c="rgba(255,255,255,0.7)" align="center" style={styles.w40}>{Math.round(zoom * 100)}%</T>
          <Pressable onPress={() => setZoom(z => Math.min(2, z + 0.2))} style={styles.ctrl} accessibilityLabel="Zoom in"><Icon name="zoom-in" size={16} color="white" /></Pressable>
        </View>
        <Pressable onPress={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={[styles.ctrl, page === totalPages && styles.dim]} accessibilityLabel="Next page"><Icon name="chevron-right" size={18} color="white" /></Pressable>
      </View>
      {toast ? (
        <View style={[styles.toastWrap, { bottom: 96 + insets.bottom }]} pointerEvents="none">
          <FadeIn style={styles.toast}><T s={12} w={500}>{toast}</T></FadeIn>
        </View>
      ) : null}
      {readUrl ? (
        <Pressable onPress={() => void openRemote()} style={[styles.openBtn, { bottom: 96 + insets.bottom }]}>
          <T s={13} w={700} c="#FFFFFF">Open document</T>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  px4: { paddingHorizontal: 16 },
  selfCenter: { alignSelf: 'center' },
  p24: { padding: 24 },
  w40: { width: 40 },
  mt4: { marginTop: 4 },
  mt8: { marginTop: 8 },
  mt24: { marginTop: 24 },
  mb16: { marginBottom: 16 },
  dim: { opacity: 0.3 },
  h2: { marginBottom: 4, marginTop: 8 },
  code: { letterSpacing: 7.2, textAlign: 'center', fontSize: 24, fontFamily: 'Inter-Bold' },
  resend: { width: '100%', marginTop: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  inner: { width: '100%', alignItems: 'center' },
  emptyBody: { paddingHorizontal: 32, alignItems: 'center' },
  emptySub: { marginTop: 8, maxWidth: 250 },
  viewer: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.ink900 },
  toolbar: { paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.ink900 },
  tool: { width: 36, height: 36, borderRadius: 9999, alignItems: 'center', justifyContent: 'center' },
  toolPressed: { backgroundColor: 'rgba(255,255,255,0.1)' },
  pageWrap: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  page: { backgroundColor: colors.white, borderRadius: 4, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
  pageHead: { alignItems: 'center', marginBottom: 16 },
  lines: { gap: 6 },
  line: { height: 6, borderRadius: 9999, backgroundColor: colors.ink100 },
  stamp: { marginVertical: 16, height: 80, borderRadius: 4, backgroundColor: colors.ink50, alignItems: 'center', justifyContent: 'center' },
  pageFoot: { marginTop: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  sign: { width: 56, height: 24, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.ink300, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  controls: { paddingHorizontal: 16, paddingTop: 12, backgroundColor: colors.ink900, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  ctrl: { width: 40, height: 40, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  zoomRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toastWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  toast: { backgroundColor: colors.white, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999, boxShadow: elev.lg },
  openBtn: { position: 'absolute', alignSelf: 'center', left: 24, right: 24, height: 44, borderRadius: 12, backgroundColor: colors.brand600, alignItems: 'center', justifyContent: 'center' },
});
