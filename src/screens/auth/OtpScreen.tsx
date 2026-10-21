import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StatusBar,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Icon } from '../../components/Icon';
import { Fade, Pop } from '../../components/Motion';
import { Press } from '../../components/Press';
import { Screen, SolidButton } from '../../components/Screen';
import { T } from '../../components/T';
import { useAuth } from '../../context/AuthContext';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { sendOtp, verifyLoginOtp } from '../../services/auth.service';
import { palette, tw, twh } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { formatPhone } from '../../utils/format';

function secondsUntil(iso?: string, fallback = 60) {
  if (!iso) return fallback;
  const s = Math.ceil((new Date(iso).getTime() - Date.now()) / 1000);
  return Number.isFinite(s) ? Math.max(0, s) : fallback;
}

function OtpBox({
  digit,
  index,
  state,
  focused,
}: {
  digit: string;
  index: number;
  state: 'idle' | 'error';
  focused: boolean;
}) {
  const enter = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 450,
      delay: index * 50,
      easing: Easing.bezier(0.34, 1.32, 0.44, 1),
      useNativeDriver: true,
    }).start();
  }, [enter, index]);
  useEffect(() => {
    if (state !== 'error') return;
    shake.setValue(0);
    Animated.timing(shake, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [shake, state]);
  const error = state === 'error';
  return (
    <Animated.View
      style={[
        styles.box,
        error ? styles.boxError : digit ? styles.boxFilled : styles.boxEmpty,
        focused && !error && !digit && styles.boxFocus,
        {
          opacity: enter,
          transform: [
            {
              translateY: enter.interpolate({
                inputRange: [0, 1],
                outputRange: [12, digit && !error ? -2 : 0],
              }),
            },
            {
              scale: enter.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1],
              }),
            },
            {
              translateX: shake.interpolate({
                inputRange: [0, 0.4, 0.55, 0.7, 0.85, 1],
                outputRange: [0, 0, -7, 6, -3, 0],
              }),
            },
          ],
        },
      ]}
    >
      <T style={[styles.boxText, error && { color: palette.rose[600] }]}>
        {digit}
      </T>
    </Animated.View>
  );
}

/** S-04 OTP verification. */
export function OtpScreen({ params }: ScreenProps<'otp'>) {
  const nav = useNav();
  const { completeLogin } = useAuth();
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [requestId, setRequestId] = useState(params.requestId);
  const [seconds, setSeconds] = useState(() =>
    secondsUntil(params.canResendAt),
  );
  const [state, setState] = useState<'idle' | 'error' | 'success'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 400);
    return () => clearTimeout(t);
  }, []);

  const verify = async () => {
    if (code.length !== 6) return;
    setVerifying(true);
    setMessage(null);
    try {
      const result = await verifyLoginOtp(params.phone, code, requestId);
      const user = await completeLogin(result);
      setState('success');
      setTimeout(() => {
        if (params.fromGuest || params.resume)
          nav.finishSignIn(params.resume ?? null);
        else if (!user.name) nav.reset('profileSetup');
        else nav.reset('home');
      }, 1200);
    } catch (e) {
      setState('error');
      setMessage(errorMessage(e));
      setTimeout(() => {
        setCode('');
        setState('idle');
        inputRef.current?.focus();
      }, 2000);
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setMessage(null);
    try {
      const res = await sendOtp(params.phone);
      setRequestId(res.requestId);
      setSeconds(secondsUntil(res.canResendAt));
      setCode('');
      setState('idle');
    } catch (e) {
      setMessage(errorMessage(e));
      setState('error');
      setTimeout(() => setState('idle'), 2000);
    } finally {
      setResending(false);
    }
  };

  if (state === 'success') {
    return (
      <View style={styles.success}>
        <StatusBar barStyle="dark-content" />
        <Pop>
          <View style={styles.successOuter}>
            <View style={styles.successInner}>
              <Icon name="check" size={28} color="#FFFFFF" strokeWidth={3} />
            </View>
          </View>
        </Pop>
        <T style={styles.successTitle}>Verified!</T>
        <T style={styles.successSub}>Setting up your profile…</T>
      </View>
    );
  }

  const digits = Array.from({ length: 6 }, (_, i) => code[i] ?? '');
  return (
    <Screen topBar={{ title: 'Verify OTP', back: true }}>
      <View style={styles.body}>
        <T style={styles.lead}>
          Enter the 6-digit code sent to{' '}
          <T style={styles.phone}>{formatPhone(params.phone)}</T>
        </T>
        <Press
          pressScale={1}
          onPress={() => inputRef.current?.focus()}
          style={styles.boxes}
          accessibilityLabel="Enter OTP"
        >
          {digits.map((d, i) => (
            <OtpBox
              key={i}
              digit={d}
              index={i}
              state={state === 'error' ? 'error' : 'idle'}
              focused={focused && i === code.length}
            />
          ))}
        </Press>
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={v => {
            setCode(v.replace(/\D/g, '').slice(0, 6));
            if (state === 'error') setState('idle');
          }}
          keyboardType="number-pad"
          maxLength={6}
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.hiddenInput}
          accessibilityLabel="One-time password"
        />
        {state === 'error' && message ? (
          <Fade>
            <T style={styles.error}>{message}</T>
          </Fade>
        ) : null}
        <View style={styles.resendRow}>
          <T style={styles.timer}>
            {seconds > 0
              ? `Resend in 0:${String(seconds).padStart(2, '0')}`
              : 'Code expired'}
          </T>
          <Press
            onPress={resend}
            disabled={seconds > 0 || resending}
            pressScale={1}
          >
            <T
              style={[
                styles.resend,
                {
                  color:
                    seconds > 0 || resending
                      ? palette.ink[300]
                      : palette.brand[600],
                },
              ]}
            >
              {resending ? 'Sending…' : 'Resend OTP'}
            </T>
          </Press>
        </View>
        <SolidButton
          label="Verify OTP"
          onPress={verify}
          disabled={code.length !== 6}
          loading={verifying}
          loadingLabel="Verifying…"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: tw('px-6'),
  lead: tw('text-ink-500 text-[14px] text-center mb-8'),
  phone: tw('text-[14px] font-semibold text-ink-900'),
  boxes: tw('flex justify-between gap-2 mb-5'),
  box: tw('w-12 h-14 rounded-2xl border-2 items-center justify-center'),
  boxEmpty: tw('border-ink-200 bg-white'),
  boxFocus: { borderColor: palette.brand[600], boxShadow: '0 0 0 4px #D1E3FF' },
  boxFilled: {
    borderColor: palette.brand[600],
    backgroundColor: 'rgba(238,244,255,0.6)',
    boxShadow: '0 6px 16px -6px rgba(26,111,255,.5)',
  },
  boxError: tw('border-rose-500 bg-rose-50'),
  boxText: twh('num text-2xl font-extrabold text-ink-900 text-center'),
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  error: tw('text-rose-500 text-[13px] text-center mb-4'),
  resendRow: tw('flex items-center justify-between mb-6'),
  timer: tw('text-[13px] text-ink-500'),
  resend: tw('text-[13px] font-semibold'),
  success: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  successOuter: tw(
    'w-20 h-20 rounded-full bg-emerald-50 items-center justify-center',
  ),
  successInner: tw(
    'w-12 h-12 rounded-full bg-emerald-500 items-center justify-center',
  ),
  successTitle: twh('text-[22px] font-bold text-ink-900'),
  successSub: tw('text-ink-500 text-[14px]'),
});
