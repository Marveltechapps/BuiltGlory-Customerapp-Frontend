import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Checkbox } from '../../components/Form';
import { Press } from '../../components/Press';
import { Screen, SolidButton } from '../../components/Screen';
import { ErrorState, LoadingState } from '../../components/States';
import { T } from '../../components/T';
import { useAuth } from '../../context/AuthContext';
import { useResource } from '../../lib/useResource';
import { useNav, useScreen } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { getContent } from '../../services/content.service';
import { tw } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { STORAGE_KEYS, writeJson } from '../../utils/storage';

/**
 * S-07 Terms & Privacy (onboarding) and P-12 Terms of Use. Legal text is published content
 * (GET /content/terms-of-service, /content/privacy-policy).
 */
export function TermsScreen({
  params,
}: ScreenProps<'terms'> | ScreenProps<'termsOfUse'>) {
  const nav = useNav();
  const { name } = useScreen();
  const { isSignedIn, saveProfile } = useAuth();
  const onboarding = name === 'terms';
  const slug =
    (params as { slug?: string } | undefined)?.slug ?? 'terms-of-service';
  const doc = useResource(signal => getContent(slug, signal), [slug]);
  const [t1, setT1] = useState(false);
  const [t2, setT2] = useState(false);
  const [t3, setT3] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = async () => {
    if (!onboarding) {
      nav.back();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await writeJson(STORAGE_KEYS.termsAccepted, {
        at: new Date().toISOString(),
        terms: true,
        privacy: true,
        updates: t3,
      });
      // "Updates by SMS / Email" is the marketing preference on those channels.
      if (isSignedIn)
        await saveProfile({
          notificationPreferences: {
            sms: { marketing: t3 },
            email: { marketing: t3 },
          },
        });
      nav.go('permissions');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const rows: Array<[boolean, (v: boolean) => void, string]> = [
    [t1, setT1, 'I have read and accept the Terms of Service'],
    [t2, setT2, 'I accept the Privacy Policy and data use'],
    [t3, setT3, 'I consent to receive updates by SMS / Email'],
  ];
  const paragraphs = (doc.data?.body ?? '').split(/\n{2,}/).filter(Boolean);

  return (
    <Screen topBar={{ title: 'Terms & Privacy', back: true }}>
      <View style={styles.body}>
        <View style={styles.box}>
          {doc.loading ? (
            <LoadingState style={styles.boxState} />
          ) : doc.error ? (
            <ErrorState compact message={doc.error} onRetry={doc.reload} />
          ) : (
            <ScrollView
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              <T style={styles.docTitle}>{doc.data?.title}</T>
              {paragraphs.map((p, i) => (
                <T key={i} style={[styles.docText, i > 0 && styles.docGap]}>
                  {p}
                </T>
              ))}
            </ScrollView>
          )}
        </View>
        <View style={styles.checks}>
          {rows.map(([val, setVal, txt]) => (
            <Press
              key={txt}
              pressScale={1}
              onPress={() => setVal(!val)}
              style={styles.checkRow}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: val }}
            >
              <View style={styles.checkBoxWrap}>
                <Checkbox checked={val} />
              </View>
              <T style={styles.checkText}>{txt}</T>
            </Press>
          ))}
        </View>
        {error && <T style={styles.error}>{error}</T>}
        <SolidButton
          label="Accept & Continue"
          onPress={accept}
          disabled={!(t1 && t2)}
          loading={saving}
          style={styles.cta}
        />
        <T style={styles.note}>
          You must accept Terms and Privacy Policy to proceed.
        </T>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: tw('px-6'),
  box: tw('bg-ink-50 border border-ink-200 rounded-card p-4 h-52'),
  boxState: tw('py-6'),
  docTitle: tw('text-[12.5px] font-semibold text-ink-900 mb-2 leading-relaxed'),
  docText: tw('text-[12.5px] text-ink-700 leading-relaxed'),
  docGap: tw('mt-2'),
  checks: { ...tw('mt-5'), gap: 12 },
  checkRow: tw('flex items-start gap-3'),
  checkBoxWrap: tw('mt-0.5'),
  checkText: tw('flex-1 text-[13px] text-ink-700'),
  error: tw('mt-3 text-[12px] text-rose-600 text-center'),
  cta: tw('mt-6'),
  note: tw('text-center text-[11px] text-ink-500 mt-3'),
});
