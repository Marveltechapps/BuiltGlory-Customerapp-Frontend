import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ApiError } from '../../api';
import { StatusMark } from '../../components/hero/StatusMark';
import { Icon } from '../../components/icons/Icon';
import { Screen, TopBar } from '../../components/layout/Screen';
import { Field, Input } from '../../components/ui/Field';
import { FadeIn } from '../../components/ui/Motion';
import { SolidBtn } from '../../components/ui/SolidBtn';
import { T } from '../../components/ui/T';
import { session, updateUser } from '../../lib/session';
import type { ScreenProps } from '../../navigation/types';
import * as meService from '../../services/me.service';
import { colors, elev } from '../../theme';

type Avatar = 'empty' | 'done';
const avatarBg: Record<Avatar, string> = { empty: colors.ink100, done: colors.brand100 };
const avatarIcon: Record<Avatar, string> = { empty: '#94A3B8', done: '#1A6FFF' };

function formatPhone(phone: string, countryCode: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${countryCode} ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return `${countryCode} ${phone}`.trim() || '+91';
}

function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.details?.[0]?.message || error.message || 'Could not save profile.';
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Could not save profile.';
}

/** S-05 Create Profile */
export function ProfileSetupScreen({ onNext }: ScreenProps) {
  const [name, setName] = useState(session.authName || '');
  const [email, setEmail] = useState('');
  const [avatar] = useState<Avatar>(session.user?.profilePhoto ? 'done' : 'empty');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = name.trim().length >= 2;
  const phoneLabel = formatPhone(session.phone || session.user?.mobileNumber || '', session.countryCode || '+91');

  const handleContinue = async () => {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      const body: { name: string; email?: string } = { name: name.trim() };
      if (email.trim()) body.email = email.trim();
      const me = await meService.patchMe(body);
      await updateUser(me);
      session.authName = me.name || name.trim();
      onNext();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <TopBar title="Create Profile" />
      <View style={styles.px6}>
        <T s={13} c={colors.ink500} align="center" style={styles.mb24}>Set up your basic information</T>
        <View style={styles.avatarCol}>
          <View>
            <View style={[styles.avatar, { backgroundColor: avatarBg[avatar] }]}>
              <Icon name="user" size={44} color={avatarIcon[avatar]} />
            </View>
            {/* No image picker wired yet — avoid fake upload success/fail. */}
            <Pressable accessibilityLabel="Upload photo" style={[styles.cam, { backgroundColor: colors.brand600 }]}>
              <Icon name="camera" size={14} color="white" />
            </Pressable>
          </View>
        </View>
        <View style={styles.fields}>
          <Field label="Name" required>
            <Input icon="user" placeholder="Enter your full name" value={name} onChangeText={setName} />
          </Field>
          <Field label="Phone Number">
            <View style={styles.locked}>
              <Icon name="phone" size={16} color="#94A3B8" />
              <T s={14} c={colors.ink700} style={styles.flex1}>{phoneLabel}</T>
              <Icon name="lock" size={14} color="#94A3B8" />
            </View>
            <View style={styles.verified}>
              <StatusMark kind="success" size={13} />
              <T s={11} c={colors.emerald600}>Verified</T>
            </View>
          </Field>
          <Field label="Email (Optional)">
            <Input icon="mail" placeholder="Enter your email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </Field>
        </View>
        {error && (
          <FadeIn style={styles.error}>
            <StatusMark kind="error" size={16} />
            <T s={12} c={colors.rose700} style={styles.flex1}>{error}</T>
          </FadeIn>
        )}
        <SolidBtn onPress={() => { void handleContinue(); }} disabled={!valid || saving} style={styles.mt24}>
          {saving ? 'Saving…' : 'Continue'}
        </SolidBtn>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  px6: { paddingHorizontal: 24 },
  flex1: { flex: 1 },
  mb24: { marginBottom: 24 },
  mt24: { marginTop: 24 },
  avatarCol: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 96, height: 96, borderRadius: 9999, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  cam: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 9999, alignItems: 'center', justifyContent: 'center', boxShadow: elev.sm },
  fields: { gap: 16 },
  locked: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingHorizontal: 12, backgroundColor: colors.ink100, borderWidth: 1, borderColor: colors.ink200, borderRadius: 14 },
  verified: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  error: { marginTop: 16, padding: 12, backgroundColor: colors.rose50, borderWidth: 1, borderColor: colors.rose200, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
});
