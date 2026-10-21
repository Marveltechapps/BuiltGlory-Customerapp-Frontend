import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Field } from '../../components/Form';
import { Icon } from '../../components/Icon';
import { Fade } from '../../components/Motion';
import { Press } from '../../components/Press';
import { Screen, SolidButton } from '../../components/Screen';
import { StatusMark } from '../../components/StatusMark';
import { T } from '../../components/T';
import { useAuth } from '../../context/AuthContext';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { sendOtp } from '../../services/auth.service';
import { palette, tw, twh } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { buzz } from '../../utils/haptics';

/** S-03 Login with phone number. */
export function LoginScreen({ params }: ScreenProps<'login'>) {
  const nav = useNav();
  const { enterGuest } = useAuth();
  const [phone, setPhone] = useState('');
  const [focused, setFocused] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const fromGuest = params?.fromGuest;
  const valid = /^\d{10}$/.test(phone) && !/^0{10}$/.test(phone);

  const handleSend = async () => {
    setSending(true);
    setSendError(null);
    try {
      const res = await sendOtp(phone);
      nav.go('otp', {
        phone,
        requestId: res.requestId,
        expiresInSeconds: res.expiresInSeconds,
        canResendAt: res.canResendAt,
        fromGuest,
        resume: params?.resume ?? null,
      });
    } catch (e) {
      setSendError(errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen fill>
      <View style={styles.page}>
        <View style={styles.main}>
          <T style={styles.title}>Welcome to{'\n'}Builtglory</T>
          <T style={styles.lead}>Enter your phone number to continue</T>
          <Field
            label="Phone Number"
            required
            hint="We'll send you a 6-digit OTP"
          >
            {/* Focus ring on the wrapper: restyling an Android EditText on focus resets its padding. */}
            <View style={[styles.inputBox, focused && styles.inputFocus]}>
              <T style={styles.cc}>+91</T>
              <TextInput
                value={phone}
                onChangeText={v => {
                  setPhone(v.replace(/\D/g, '').slice(0, 10));
                  setSendError(null);
                }}
                keyboardType="number-pad"
                maxLength={10}
                placeholder="98765 43210"
                placeholderTextColor={palette.ink[400]}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={styles.input}
                accessibilityLabel="Phone number"
              />
            </View>
          </Field>
          {sendError && (
            <Fade>
              <View style={styles.error}>
                <StatusMark kind="error" size={16} />
                <T style={styles.errorText}>{sendError}</T>
              </View>
            </Fade>
          )}
          <SolidButton
            label="Send OTP"
            loading={sending}
            loadingLabel="Sending OTP…"
            disabled={!valid || sending}
            onPress={handleSend}
            style={styles.send}
          />
          {!fromGuest ? (
            <Press
              onPress={() => {
                buzz();
                enterGuest();
                nav.reset('home');
              }}
              style={styles.guest}
            >
              <T style={styles.guestText}>Explore as guest</T>
              <Icon name="arrow-right" size={15} color="#1A6FFF" />
            </Press>
          ) : (
            <Press onPress={nav.back} style={styles.guest}>
              <T style={styles.notNow}>Not now, keep browsing</T>
            </Press>
          )}
        </View>
        <View style={styles.legalWrap}>
          <T style={styles.legal}>
            By continuing, you agree to our{' '}
            <T
              style={styles.link}
              onPress={() => nav.go('termsOfUse', { slug: 'terms-of-service' })}
            >
              Terms of Use
            </T>{' '}
            and{' '}
            <T
              style={styles.link}
              onPress={() => nav.go('termsOfUse', { slug: 'privacy-policy' })}
            >
              Privacy Policy
            </T>
          </T>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: tw('flex-1 px-6 pt-6'),
  main: tw('flex-1'),
  title: { ...twh('text-[28px] font-bold text-ink-900 mb-2 leading-tight') },
  lead: tw('text-[14px] text-ink-500 mb-10'),
  // Positioned inside the 1px-bordered box, so offsets are 1px smaller than the reference's left-3 / top.
  cc: {
    ...tw('absolute text-[15px] font-medium text-ink-700'),
    left: 11,
    top: 11,
    zIndex: 1,
  },
  inputBox: tw('w-full h-12 border border-ink-200 rounded-card bg-white'),
  input: {
    ...tw('flex-1 text-[15px] text-ink-900'),
    paddingLeft: 47,
    paddingRight: 15,
    paddingVertical: 0,
    fontFamily: 'Inter-Regular',
  },
  inputFocus: {
    borderColor: palette.brand[600],
    boxShadow: '0 0 0 2px #D1E3FF',
  },
  error: tw(
    'mt-3 p-3 bg-rose-50 border border-rose-200 rounded-card flex items-center gap-2',
  ),
  errorText: tw('flex-1 text-[12px] text-rose-700'),
  send: tw('mt-6'),
  guest: tw(
    'mt-3 w-full h-11 rounded-xl flex items-center justify-center gap-1.5',
  ),
  guestText: tw('text-[13.5px] font-bold text-brand-700'),
  notNow: tw('text-[13.5px] font-bold text-ink-500'),
  legalWrap: tw('pb-6 pt-4'),
  legal: tw('text-[12px] text-ink-500 leading-relaxed text-center'),
  link: tw('text-[12px] text-brand-600 underline'),
});
