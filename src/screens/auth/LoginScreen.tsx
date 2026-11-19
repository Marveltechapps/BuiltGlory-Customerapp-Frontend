import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { ApiError, getDeviceId } from '../../api';
import { StatusMark } from '../../components/hero/StatusMark';
import { Icon } from '../../components/icons/Icon';
import { Screen } from '../../components/layout/Screen';
import { Field, Input } from '../../components/ui/Field';
import { FadeIn } from '../../components/ui/Motion';
import { buzz, Press } from '../../components/ui/Press';
import { RingSpinner } from '../../components/ui/SolidBtn';
import { T } from '../../components/ui/T';
import { setPendingOtp, session } from '../../lib/session';
import type { ScreenProps } from '../../navigation/types';
import * as authService from '../../services/auth.service';
import { colors, elev, type } from '../../theme';

type Mode = 'signin' | 'signup';

function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.details?.[0]?.message || error.message || 'Failed to send OTP. Please try again.';
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Failed to send OTP. Please try again.';
}

/** S-03 Login / Sign up with phone number. */
export function LoginScreen({ onNext, onGuest, ctx, back }: ScreenProps) {
  const [mode, setMode] = useState<Mode>((ctx?.mode as Mode) || session.authMode || 'signin');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [focus, setFocus] = useState(false);
  const COPY = mode === 'signup'
    ? { h: 'Create your account', p: 'Buy verified properties or sell directly to Builtglory. One account for both.' }
    : { h: 'Sign in to Builtglory', p: 'Welcome back. Enter your registered mobile number to continue.' };
  const valid = phone.length === 10 && (mode === 'signin' || name.trim().length >= 2);
  const switchMode = (m: Mode) => { setMode(m); session.authMode = m; setSendError(null); buzz(); };

  const handleSend = async () => {
    if (!valid || sending) return;
    setSending(true);
    setSendError(null);
    try {
      const deviceId = await getDeviceId();
      const result = await authService.sendOtp({
        countryCode: '+91',
        phone,
        deviceId,
        purpose: 'login',
      });
      setPendingOtp({
        phone,
        countryCode: '+91',
        requestId: result.requestId,
        purpose: 'login',
        canResendAt: result.canResendAt,
        authMode: mode,
        authName: name.trim(),
      });
      onNext();
    } catch (error) {
      setSendError(apiErrorMessage(error));
    } finally {
      setSending(false);
    }
  };

  const tab = useRef(new Animated.Value(mode === 'signup' ? 1 : 0)).current;
  const [tabW, setTabW] = useState(0);
  useEffect(() => {
    Animated.timing(tab, { toValue: mode === 'signup' ? 1 : 0, duration: 300, useNativeDriver: true }).start();
  }, [mode, tab]);

  const enabled = valid && !sending;
  return (
    <Screen>
      <View style={styles.page}>
        <View>
          <T s={12} w={700} upper ls={0.12} c={colors.ink400} style={styles.mb8}>Welcome to Builtglory</T>
          <FadeIn key={'h' + mode}>
            <T display s={26} w={800} lh={1.25} ls={-0.03} style={styles.mb6}>{COPY.h}</T>
          </FadeIn>
          <FadeIn key={'p' + mode}>
            <T s={13.5} c={colors.ink500} style={styles.mb20}>{COPY.p}</T>
          </FadeIn>
          <View style={styles.tabs} accessibilityRole="tablist" onLayout={e => setTabW((e.nativeEvent.layout.width - 8) / 2)}>
            {tabW > 0 && <Animated.View style={[styles.tabPill, { width: tabW, transform: [{ translateX: tab.interpolate({ inputRange: [0, 1], outputRange: [0, tabW] }) }] }]} />}
            {([['signin', 'Sign in'], ['signup', 'Sign up']] as [Mode, string][]).map(([m, l]) => (
              <Pressable key={m} accessibilityRole="tab" accessibilityState={{ selected: mode === m }} onPress={() => switchMode(m)} style={styles.tab}>
                <T s={14} w={700} c={mode === m ? colors.ink900 : colors.ink500}>{l}</T>
              </Pressable>
            ))}
          </View>
          {mode === 'signup' && (
            <FadeIn style={styles.mb16}>
              <Field label="Full Name" required>
                <Input icon="user" placeholder="e.g. Priya Raman" value={name} onChangeText={setName} />
              </Field>
            </FadeIn>
          )}
          <Field label="Phone Number" required>
            {/* Border and focus ring live on this wrapper: restyling the TextInput itself swaps its
                Android background drawable, which resets its padding and slides the digits under +91. */}
            <View style={[styles.phoneBox, focus && styles.phoneFocus]}>
              <T s={15} w={500} c={colors.ink700} style={styles.prefix}>+91</T>
              <TextInput
                keyboardType="number-pad"
                maxLength={10}
                value={phone}
                onChangeText={v => { setPhone(v.replace(/\D/g, '')); setSendError(null); }}
                placeholder="98765 43210"
                placeholderTextColor={colors.ink400}
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
                style={styles.phone}
              />
            </View>
            <T s={11} c={colors.ink500} style={styles.mt6}>We'll send you a 6-digit OTP</T>
          </Field>
          {sendError && (
            <FadeIn style={styles.error}>
              <StatusMark kind="error" size={16} />
              <T s={12} c={colors.rose700} style={styles.flex1}>{sendError}</T>
            </FadeIn>
          )}
          <Pressable
            onPress={() => { void handleSend(); }}
            disabled={!enabled}
            accessibilityRole="button"
            style={({ pressed }) => [styles.cta, enabled ? (pressed ? styles.ctaPressed : styles.ctaOn) : styles.ctaOff]}>
            {sending ? (
              <>
                <RingSpinner size={16} color={colors.ink400} />
                <T s={15} w={600} c={colors.ink400}>Sending OTP…</T>
              </>
            ) : (
              <T s={15} w={600} c={enabled ? colors.white : colors.ink400}>{mode === 'signup' ? 'Create account' : 'Send OTP'}</T>
            )}
          </Pressable>
          <T s={13} c={colors.ink500} align="center" style={styles.mt12}>
            {mode === 'signin' ? 'New to Builtglory? ' : 'Already have an account? '}
            <T w={700} c={colors.brand600} onPress={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}>{mode === 'signin' ? 'Sign up' : 'Sign in'}</T>
          </T>
          {!ctx?.fromGuest ? (
            <Press onPress={onGuest} style={styles.ghost}>
              <T s={13.5} w={700} c={colors.brand700}>Explore as guest</T>
              <Icon name="arrow-right" size={15} color="#1A6FFF" />
            </Press>
          ) : (
            <Press onPress={back} style={styles.ghost}>
              <T s={13.5} w={700} c={colors.ink500}>Not now, keep browsing</T>
            </Press>
          )}
          <View style={styles.or}>
            <View style={styles.rule} />
            <T s={11} c={colors.ink400}>OR</T>
            <View style={styles.rule} />
          </View>
          <View style={styles.social}>
            {([['apple', 'Apple'], ['globe', 'Google']] as const).map(([ic, l]) => (
              <Press key={l} disabled style={[styles.socialBtn, styles.socialDisabled]}>
                <Icon name={ic} size={16} color={colors.ink400} />
                <T s={13} w={600} c={colors.ink400}>{l}</T>
              </Press>
            ))}
          </View>
          <T s={11} c={colors.ink400} align="center" style={styles.mt8}>Apple and Google sign-in are unavailable</T>
        </View>
        <View style={styles.legal}>
          <T s={12} c={colors.ink500} lh={1.625} align="center">
            By continuing, you agree to our{' '}
            <T c={colors.brand600} style={styles.underline}>Terms of Use</T> and{' '}
            <T c={colors.brand600} style={styles.underline}>Privacy Policy</T>
          </T>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 24, paddingTop: 24 },
  flex1: { flex: 1 },
  mb6: { marginBottom: 6 },
  mb8: { marginBottom: 8 },
  mb16: { marginBottom: 16 },
  mb20: { marginBottom: 20 },
  mt6: { marginTop: 6 },
  mt8: { marginTop: 8 },
  mt12: { marginTop: 12 },
  tabs: { flexDirection: 'row', padding: 4, marginBottom: 20, borderRadius: 12, backgroundColor: colors.ink100 },
  tabPill: { position: 'absolute', top: 4, bottom: 4, left: 4, borderRadius: 8, backgroundColor: colors.white, boxShadow: elev.e1 },
  tab: { flex: 1, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  prefix: { position: 'absolute', left: 11, top: 0, bottom: 0, textAlignVertical: 'center', lineHeight: 46, zIndex: 1 },
  phoneBox: { width: '100%', height: 48, borderWidth: 1, borderColor: colors.ink200, borderRadius: 14 },
  phone: {
    width: '100%', height: 46, paddingLeft: 47, paddingRight: 15, paddingVertical: 0,
    backgroundColor: 'transparent', ...type(15), lineHeight: undefined, color: colors.ink900,
  },
  phoneFocus: { borderColor: colors.brand600, boxShadow: `0 0 0 2px ${colors.brand100}` },
  error: { marginTop: 12, padding: 12, backgroundColor: colors.rose50, borderWidth: 1, borderColor: colors.rose200, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  cta: { width: '100%', height: 48, marginTop: 24, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaOn: { backgroundColor: colors.brand600 },
  ctaPressed: { backgroundColor: colors.brand700 },
  ctaOff: { backgroundColor: colors.ink100 },
  ghost: { marginTop: 12, width: '100%', height: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  or: { marginVertical: 24, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rule: { flex: 1, height: 1, backgroundColor: colors.ink200 },
  social: { flexDirection: 'row', gap: 12 },
  socialBtn: { flex: 1, height: 44, borderRadius: 14, borderWidth: 1, borderColor: colors.ink200, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  socialDisabled: { opacity: 0.55 },
  legal: { paddingBottom: 24, alignItems: 'center' },
  underline: { textDecorationLine: 'underline' },
});
