import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Field, Input } from '../../components/Form';
import { Icon } from '../../components/Icon';
import { Fade, Spin } from '../../components/Motion';
import { Press } from '../../components/Press';
import { Screen, SolidButton } from '../../components/Screen';
import { StatusMark } from '../../components/StatusMark';
import { T } from '../../components/T';
import { useAuth } from '../../context/AuthContext';
import { useNav } from '../../navigation/NavContext';
import { uploadDocument } from '../../services/document.service';
import { palette, tw } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { formatPhone } from '../../utils/format';
import { pickImages } from '../../utils/media';

type AvatarState = 'empty' | 'uploading' | 'done' | 'error';

/** Upload a profile photo (POST /documents) and store its URL on the customer (PATCH /me). */
export function useAvatarUpload() {
  const { user, saveProfile } = useAuth();
  const [state, setState] = useState<AvatarState>(
    user?.profilePhoto ? 'done' : 'empty',
  );
  const [error, setError] = useState<string | null>(null);
  const upload = async () => {
    if (state === 'uploading' || !user) return;
    try {
      const [file] = await pickImages(1);
      if (!file) return;
      setState('uploading');
      setError(null);
      const doc = await uploadDocument(file, {
        ownerType: 'user',
        ownerId: user._id,
        purpose: 'property_media',
        documentType: 'profile_photo',
      });
      if (!doc.url) throw new Error('Upload did not return a file URL.');
      await saveProfile({ profilePhoto: doc.url });
      setState('done');
    } catch (e) {
      setError(errorMessage(e));
      setState('error');
    }
  };
  return { state, error, upload, photo: user?.profilePhoto };
}

const AVATAR_BG: Record<AvatarState, string> = {
  empty: palette.ink[100],
  uploading: palette.ink[100],
  done: palette.brand[100],
  error: palette.rose[50],
};
const AVATAR_FG: Record<AvatarState, string> = {
  empty: '#94A3B8',
  uploading: '#94A3B8',
  done: '#1A6FFF',
  error: '#E11D48',
};

/** S-05 Create Profile. */
export function ProfileSetupScreen() {
  const nav = useNav();
  const { user, saveProfile } = useAuth();
  const avatar = useAvatarUpload();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailOk =
    !email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  const valid = name.trim().length >= 2 && emailOk;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveProfile({ name: name.trim(), email: email.trim() || null });
      nav.go('locationType');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen topBar={{ title: 'Create Profile', back: true }}>
      <View style={styles.body}>
        <T style={styles.lead}>Set up your basic information</T>
        <View style={styles.avatarCol}>
          <View>
            <View
              style={[
                styles.avatar,
                { backgroundColor: AVATAR_BG[avatar.state] },
              ]}
            >
              {avatar.state === 'done' && avatar.photo ? (
                <Image
                  source={{ uri: avatar.photo }}
                  style={StyleSheet.absoluteFill}
                />
              ) : (
                <Icon name="user" size={44} color={AVATAR_FG[avatar.state]} />
              )}
            </View>
            {avatar.state === 'uploading' && (
              <Fade style={styles.avatarOverlay}>
                <Spin>
                  <Icon name="loader-2" size={32} color="#FFFFFF" />
                </Spin>
              </Fade>
            )}
            <Press
              onPress={avatar.upload}
              accessibilityLabel="Add profile photo"
              style={[
                styles.camera,
                {
                  backgroundColor:
                    avatar.state === 'error'
                      ? palette.rose[500]
                      : palette.brand[600],
                },
              ]}
            >
              <Icon
                name={avatar.state === 'error' ? 'rotate-cw' : 'camera'}
                size={14}
                color="#FFFFFF"
              />
            </Press>
          </View>
          {avatar.state === 'error' && (
            <Fade>
              <T style={styles.avatarError}>
                {avatar.error
                  ? `${avatar.error} Tap to retry.`
                  : 'Upload failed. Tap to retry.'}
              </T>
            </Fade>
          )}
        </View>
        <View style={styles.fields}>
          <Field label="Name" required>
            <Input
              icon="user"
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </Field>
          <Field label="Phone Number">
            <View style={styles.locked}>
              <Icon name="phone" size={16} color="#94A3B8" />
              <T style={styles.lockedText}>
                {formatPhone(user?.mobileNumber ?? user?.phone)}
              </T>
              <Icon name="lock" size={14} color="#94A3B8" />
            </View>
            <View style={styles.verified}>
              <StatusMark kind="success" size={13} />
              <T style={styles.verifiedText}>Verified</T>
            </View>
          </Field>
          <Field
            label="Email (Optional)"
            error={!emailOk ? 'Enter a valid email address.' : null}
          >
            <Input
              icon="mail"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </Field>
        </View>
        {error && <T style={styles.error}>{error}</T>}
        <SolidButton
          label="Continue"
          onPress={save}
          disabled={!valid}
          loading={saving}
          style={styles.cta}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: tw('px-6'),
  lead: tw('text-[13px] text-ink-500 mb-6 text-center'),
  avatarCol: tw('items-center mb-6'),
  avatar: tw(
    'w-24 h-24 rounded-full overflow-hidden items-center justify-center',
  ),
  avatarOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: 48,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  camera: {
    ...tw(
      'absolute bottom-0 right-0 w-8 h-8 rounded-full items-center justify-center',
    ),
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
  },
  avatarError: tw('mt-2 text-[11.5px] text-rose-500 text-center'),
  fields: { gap: 16 },
  locked: tw(
    'flex items-center gap-2 h-12 px-3 bg-ink-100 border border-ink-200 rounded-card',
  ),
  lockedText: tw('flex-1 text-[14px] text-ink-700'),
  verified: tw('mt-1.5 flex items-center gap-1'),
  verifiedText: tw('text-[11px] text-emerald-600'),
  error: tw('mt-4 text-[12px] text-rose-600 text-center'),
  cta: tw('mt-6'),
});
