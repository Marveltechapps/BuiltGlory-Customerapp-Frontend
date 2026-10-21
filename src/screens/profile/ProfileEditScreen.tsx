import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Field, Input } from '../../components/Form';
import { Icon } from '../../components/Icon';
import { Spin } from '../../components/Motion';
import { Press } from '../../components/Press';
import { Screen, SolidButton } from '../../components/Screen';
import { T } from '../../components/T';
import { useAuth } from '../../context/AuthContext';
import { useNav } from '../../navigation/NavContext';
import { palette, tw } from '../../theme';
import { errorMessage, fieldErrors } from '../../utils/errorMessage';
import { formatPhone } from '../../utils/format';
import { useAvatarUpload } from '../auth/ProfileSetupScreen';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** P-02 Edit profile (PATCH /me; photo via POST /documents then PATCH /me profilePhoto). */
export function ProfileEditScreen() {
  const nav = useNav();
  const { user, saveProfile } = useAuth();
  const avatar = useAvatarUpload();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const emailInvalid = email.trim() !== '' && !EMAIL.test(email.trim());
  const save = async () => {
    if (name.trim().length < 2 || emailInvalid) {
      setErrors({
        name: name.trim().length < 2 ? 'Enter your full name.' : '',
        email: emailInvalid ? 'Enter a valid email address.' : '',
      });
      return;
    }
    setSaving(true);
    setErrors({});
    setError(null);
    try {
      await saveProfile({ name: name.trim(), email: email.trim() || null });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        nav.back();
      }, 1000);
    } catch (e) {
      setErrors(fieldErrors(e));
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen topBar={{ title: 'Edit Profile', back: true }}>
      <View style={styles.body}>
        <View style={styles.photoWrap}>
          <View>
            <View
              style={[
                styles.photo,
                {
                  backgroundColor:
                    avatar.state === 'done'
                      ? palette.brand[200]
                      : palette.brand[100],
                },
              ]}
            >
              {avatar.photo ? (
                <Image source={{ uri: avatar.photo }} style={styles.photoImg} />
              ) : (
                <Icon name="user" size={44} color="#1A6FFF" />
              )}
              {avatar.state === 'uploading' && (
                <View style={styles.photoBusy}>
                  <Spin>
                    <Icon name="loader-2" size={22} color="#FFFFFF" />
                  </Spin>
                </View>
              )}
            </View>
            <Press
              onPress={avatar.upload}
              style={styles.camera}
              accessibilityLabel="Change profile photo"
            >
              <Icon
                name={avatar.state === 'done' ? 'check' : 'camera'}
                size={14}
                color="#FFFFFF"
              />
            </Press>
          </View>
          {avatar.error ? <T style={styles.error}>{avatar.error}</T> : null}
        </View>
        <View style={styles.fields}>
          <Field label="Full Name" required error={errors.name || null}>
            <Input
              icon="user"
              value={name}
              onChangeText={setName}
              maxLength={120}
              invalid={!!errors.name}
            />
          </Field>
          <Field
            label="Phone Number"
            hint="Verified — use Change Number to update"
          >
            <View style={styles.phone}>
              <Icon name="phone" size={16} color="#94A3B8" />
              <T style={styles.phoneText}>
                {formatPhone(user?.mobileNumber ?? user?.phone)}
              </T>
              <Press onPress={() => nav.go('changePhone')} pressScale={1}>
                <T style={styles.change}>Change Number</T>
              </Press>
            </View>
          </Field>
          <Field label="Email Address" error={errors.email || null}>
            <Input
              icon="mail"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              invalid={!!errors.email}
            />
          </Field>
        </View>
        {error && !Object.values(errors).some(Boolean) ? (
          <T style={styles.error}>{error}</T>
        ) : null}
        <SolidButton
          label={saved ? 'Saved!' : 'Save Changes'}
          icon={
            saved ? <Icon name="check" size={18} color="#FFFFFF" /> : undefined
          }
          tone={saved ? 'emerald' : 'brand'}
          loading={saving}
          loadingLabel="Saving…"
          onPress={save}
          style={styles.cta}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: tw('px-6'),
  photoWrap: tw('items-center mb-6'),
  photo: tw(
    'w-24 h-24 rounded-full items-center justify-center overflow-hidden',
  ),
  photoImg: { width: 96, height: 96 },
  photoBusy: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  camera: {
    ...tw(
      'absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand-600 items-center justify-center',
    ),
    boxShadow: '0 1px 3px rgba(0,0,0,.1), 0 1px 2px -1px rgba(0,0,0,.1)',
  },
  fields: { gap: 16 },
  phone: tw(
    'flex items-center gap-2 h-12 px-3 bg-ink-100 border border-ink-200 rounded-card',
  ),
  phoneText: tw('flex-1 text-[14px] text-ink-700'),
  change: tw('text-[12px] font-semibold text-brand-600'),
  error: tw('text-[12px] text-rose-600 mt-2'),
  cta: tw('mt-6'),
});
