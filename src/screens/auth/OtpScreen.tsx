import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { ApiError, getDeviceId } from '../../api';
import type { AuthSessionApi } from '../../api/types';
import { Icon } from '../../components/icons/Icon';
import { AmbientBackground } from '../../components/layout/AmbientBackground';
import { Screen, TopBar } from '../../components/layout/Screen';
import { FadeIn } from '../../components/ui/Motion';
import { SolidBtn } from '../../components/ui/SolidBtn';
import { T } from '../../components/ui/T';
import { useAuth } from '../../context/AuthContext';
import { setPendingOtp, session } from '../../lib/session';
import type { ScreenProps } from '../../navigation/types';
import * as authService from '../../services/auth.service';
import { colors, ease } from '../../theme';
import { pad2 } from '../../utils/format';

type OtpState = 'idle' | 'error' | 'success';

function secondsUntil(iso: string | null | undefined): number {
  if (!iso) return 60;
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms)) return 60;
  return Math.max(0, Math.ceil(ms / 1000));
}

function formatPhone(phone: string, countryCode: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${countryCode} ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return `${countryCode} ${phone}`.trim();
}

function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.details?.[0]?.message || error.message || 'Invalid OTP. Please try again.';
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Invalid OTP. Please try again.';
}

function isAuthSession(data: unknown): data is AuthSessionApi {
  return Boolean(
    data &&
      typeof data === 'object' &&
      'accessToken' in data &&
      'refreshToken' in data,
  );
}

function OtpBox({ i, value, state, inputRef, onChange, onBackspace }: {
  i: number; value: string; state: OtpState; inputRef: (r: TextInput | null) => void; onChange: (v: string) => void; onBackspace: () => void;
}) {
  const [focus, setFocus] = useState(false);
  const enter = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 450, delay: i * 50, easing: ease.spring, useNativeDriver: true }).start();
  }, [enter, i]);
  useEffect(() => {
    if (state !== 'error') return;
    shake.setValue(0);
    Animated.timing(shake, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [state, shake]);
  const err = state === 'error';
  const filled = !!value;
  return (
    <Animated.View style={{
      opacity: enter,
      transform: [
        { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, filled && !err ? -2 : 0] }) },
        { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
        { translateX: shake.interpolate({ inputRange: [0, 0.4, 0.55, 0.7, 0.85, 1], outputRange: [0, 0, -7, 6, -3, 0] }) },
      ],
    }}>
      <TextInput
        ref={inputRef}
        keyboardType="number-pad"
        maxLength={1}
        value={value}
        onChangeText={onChange}
        onKeyPress={e => { if (e.nativeEvent.key === 'Backspace' && !value) onBackspace(); }}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        selectTextOnFocus
        style={[styles.box,
          err ? styles.boxErr : filled ? styles.boxFilled : styles.boxEmpty,
          focus && !err && styles.boxFocus]}
      />
    </Animated.View>
  );
}

/** S-04 OTP verification */
export function OtpScreen({ onNext }: ScreenProps) {
  const { loginWithSession } = useAuth();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [seconds, setSeconds] = useState(() => secondsUntil(session.otpCanResendAt));
  const [otpState, setOtpState] = useState<OtpState>('idle');
  const [errorMsg, setErrorMsg] = useState('Invalid OTP. Please try again.');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const refs = useRef<(TextInput | null)[]>([]);
  const phoneLabel = formatPhone(session.phone, session.countryCode || '+91');

  useEffect(() => {
    if (seconds === 0) return;
    const t = setTimeout(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const set = (i: number, v: string) => {
    const d = [...digits];
    d[i] = v.replace(/\D/g, '').slice(-1);
    setDigits(d);
    setOtpState('idle');
    if (v && i < 5) refs.current[i + 1]?.focus();
  };

  const filled = digits.every(d => d);

  const verify = async () => {
    if (!filled || verifying) return;
    const otp = digits.join('');
    const requestId = session.otpRequestId;
    const purpose = session.otpPurpose || 'login';
    if (!requestId) {
      setErrorMsg('OTP session expired. Please go back and request a new code.');
      setOtpState('error');
      return;
    }

    setVerifying(true);
    setOtpState('idle');
    try {
      const result = await authService.verifyOtp({
        countryCode: session.countryCode || '+91',
        phone: session.phone,
        otp,
        requestId,
        purpose,
      });

      if (!isAuthSession(result)) {
        setErrorMsg('Unexpected verification response.');
        setOtpState('error');
        return;
      }

      await loginWithSession(
        { accessToken: result.accessToken, refreshToken: result.refreshToken },
        result.user,
      );

      if (!result.user?.name?.trim()) {
        session.authMode = 'signup';
      }

      setOtpState('success');
      setTimeout(onNext, 1200);
    } catch (error) {
      setErrorMsg(apiErrorMessage(error));
      setOtpState('error');
      setTimeout(() => {
        setDigits(Array(6).fill(''));
        setOtpState('idle');
        refs.current[0]?.focus();
      }, 2000);
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    if (seconds > 0 || resending) return;
    setResending(true);
    try {
      const deviceId = await getDeviceId();
      const result = await authService.sendOtp({
        countryCode: session.countryCode || '+91',
        phone: session.phone,
        deviceId,
        purpose: session.otpPurpose || 'login',
      });
      setPendingOtp({
        phone: session.phone,
        countryCode: session.countryCode || '+91',
        requestId: result.requestId,
        purpose: session.otpPurpose || 'login',
        canResendAt: result.canResendAt,
        authMode: session.authMode,
        authName: session.authName,
      });
      setSeconds(secondsUntil(result.canResendAt));
      setDigits(Array(6).fill(''));
      setOtpState('idle');
      refs.current[0]?.focus();
    } catch (error) {
      setErrorMsg(apiErrorMessage(error));
      setOtpState('error');
    } finally {
      setResending(false);
    }
  };

  if (otpState === 'success') {
    return (
      <FadeIn style={styles.success}>
        <AmbientBackground />
        <View style={styles.okOuter}>
          <View style={styles.okInner}><Icon name="check" size={28} color="white" strokeWidth={3} /></View>
        </View>
        <T display s={22} w={700}>Verified!</T>
        <T s={14} c={colors.ink500}>Setting up your profile…</T>
      </FadeIn>
    );
  }

  return (
    <Screen>
      {/* The design passes no back handler to this screen, so its bar has no back button. */}
      <TopBar title="Verify OTP" />
      <View style={styles.px6}>
        <T s={14} c={colors.ink500} align="center" style={styles.mb32}>
          Enter the 6-digit code sent to{' '}
          <T w={600} c={colors.ink900}>{phoneLabel || '+91'}</T>
        </T>
        <View style={styles.boxes}>
          {digits.map((d, i) => (
            <OtpBox
              key={i}
              i={i}
              value={d}
              state={otpState}
              inputRef={r => { refs.current[i] = r; }}
              onChange={v => set(i, v)}
              onBackspace={() => { if (i > 0) refs.current[i - 1]?.focus(); }}
            />
          ))}
        </View>
        {otpState === 'error' && (
          <FadeIn><T s={13} c={colors.rose500} align="center" style={styles.mb16}>{errorMsg}</T></FadeIn>
        )}
        <View style={styles.resendRow}>
          <T s={13} c={colors.ink500}>{seconds > 0 ? `Resend in 0:${pad2(seconds)}` : 'Code expired'}</T>
          <Pressable disabled={seconds > 0 || resending} onPress={() => { void resend(); }}>
            <T s={13} w={600} c={seconds > 0 || resending ? colors.ink300 : colors.brand600}>
              {resending ? 'Sending…' : 'Resend OTP'}
            </T>
          </Pressable>
        </View>
        <SolidBtn onPress={() => { void verify(); }} disabled={!filled || verifying}>
          {verifying ? 'Verifying…' : 'Verify OTP'}
        </SolidBtn>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  px6: { paddingHorizontal: 24 },
  mb16: { marginBottom: 16 },
  mb32: { marginBottom: 32 },
  boxes: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 20 },
  box: {
    width: 48, height: 56, borderRadius: 16, borderWidth: 2, textAlign: 'center', padding: 0,
    fontFamily: 'BricolageGrotesque-ExtraBold', fontSize: 24, fontVariant: ['tabular-nums'], color: colors.ink900,
  },
  boxEmpty: { borderColor: colors.ink200, backgroundColor: colors.white },
  boxFilled: { borderColor: colors.brand600, backgroundColor: 'rgba(238,244,255,0.6)', boxShadow: '0 6px 16px -6px rgba(26,111,255,0.5)' },
  boxErr: { borderColor: colors.rose500, backgroundColor: colors.rose50, color: colors.rose600 },
  boxFocus: { borderColor: colors.brand600, boxShadow: `0 0 0 4px ${colors.brand100}` },
  resendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  success: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', gap: 16 },
  okOuter: { width: 80, height: 80, borderRadius: 9999, backgroundColor: colors.emerald50, alignItems: 'center', justifyContent: 'center' },
  okInner: { width: 48, height: 48, borderRadius: 9999, backgroundColor: colors.emerald500, alignItems: 'center', justifyContent: 'center' },
});
