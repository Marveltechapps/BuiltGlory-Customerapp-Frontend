import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Btn } from '../../components/Btn';
import { Field, Input } from '../../components/Form';
import { StatusHero } from '../../components/Hero';
import { Press } from '../../components/Press';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { useAuth } from '../../context/AuthContext';
import { useNav } from '../../navigation/NavContext';
import { sendOtp, verifyPhoneChangeOtp } from '../../services/auth.service';
import { tw, twh } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';

/**
 * P-03 Change phone number: POST /auth/customer/otp/send (purpose change_phone), POST …/otp/verify,
 * then PATCH /me with the verified number.
 */
export function ChangePhoneScreen() {
  const nav = useNav();
  const { user, saveProfile } = useAuth();
  const [step, setStep] = useState<'new' | 'otp' | 'verified'>('new');
  const [newPhone, setNewPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [requestId, setRequestId] = useState<string | undefined>();
  const [timer, setTimer] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = /^[6-9]\d{9}$/.test(newPhone);
  const same = newPhone === (user?.mobileNumber ?? '').slice(-10);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setInterval(() => setTimer(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [timer > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = async () => {
    if (!valid || same) return;
    setBusy(true);
    setError(null);
    try {
      const res = await sendOtp(newPhone, 'change_phone');
      setRequestId(res.requestId);
      setTimer(
        res.canResendAt
          ? Math.max(
              0,
              Math.round(
                (new Date(res.canResendAt).getTime() - Date.now()) / 1000,
              ),
            )
          : 30,
      );
      setStep('otp');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (otp.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      await verifyPhoneChangeOtp(newPhone, otp, requestId);
      await saveProfile({ mobileNumber: newPhone });
      setStep('verified');
      setTimeout(() => nav.popTo('profileEdit'), 1500);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (step === 'verified') {
    return (
      <Screen fill>
        <View style={styles.center}>
          <StatusHero icon="check-circle" tone="success" />
          <T style={styles.doneTitle}>Phone number updated</T>
          <T style={styles.doneText}>
            Your new number +91 {newPhone} is now verified.
          </T>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      topBar={{
        title: step === 'new' ? 'Change Phone Number' : 'Verify Phone',
        back: step === 'new' ? true : () => setStep('new'),
      }}
    >
      <View style={styles.body}>
        {step === 'new' ? (
          <>
            <T style={styles.h2}>Enter new phone number</T>
            <T style={styles.lead}>
              We'll send a verification code to this number.
            </T>
            <Field
              label="New Phone Number"
              required
              error={same && newPhone ? 'This is already your number.' : null}
            >
              <Input
                prefix="+91"
                keyboardType="phone-pad"
                maxLength={10}
                value={newPhone}
                onChangeText={v => setNewPhone(v.replace(/\D/g, ''))}
                placeholder="9876543210"
              />
            </Field>
            {error && <T style={styles.error}>{error}</T>}
            <Btn
              style={styles.cta}
              disabled={!valid || same}
              loading={busy}
              onPress={send}
            >
              {busy ? 'Sending OTP...' : 'Send OTP'}
            </Btn>
          </>
        ) : (
          <>
            <T style={styles.h2}>Enter verification code</T>
            <T style={styles.lead}>We sent a 6-digit code to +91 {newPhone}</T>
            <Field label="Verification Code" required>
              <Input
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={v => setOtp(v.replace(/\D/g, ''))}
                placeholder="000000"
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                inputStyle={styles.otp}
              />
            </Field>
            {error && <T style={styles.error}>{error}</T>}
            <Btn
              style={styles.cta}
              disabled={otp.length !== 6}
              loading={busy}
              onPress={verify}
            >
              Verify & Update
            </Btn>
            <Press
              onPress={send}
              disabled={timer > 0 || busy}
              pressScale={1}
              style={styles.resend}
            >
              <T style={[styles.resendText, timer > 0 && styles.resendOff]}>
                {timer > 0 ? `Resend in ${timer}s` : 'Resend code'}
              </T>
            </Press>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: tw('px-4'),
  h2: tw('text-[16px] font-semibold mb-1 mt-2'),
  lead: tw('text-[12.5px] text-ink-500 mb-4'),
  error: tw('text-[12px] text-rose-600 mt-2'),
  cta: tw('w-full mt-6'),
  otp: { ...twh('text-[24px] font-bold text-center'), letterSpacing: 24 * 0.3 },
  resend: tw('w-full mt-3 items-center'),
  resendText: tw('text-[13px] text-brand-600 font-medium'),
  resendOff: tw('text-ink-400'),
  center: tw('flex-1 items-center justify-center px-6'),
  doneTitle: { ...twh('text-[22px] font-bold text-center') },
  doneText: tw('text-ink-500 mt-2 text-[13px] text-center'),
});
