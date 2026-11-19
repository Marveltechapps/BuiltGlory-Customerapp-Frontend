import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Icon } from '../../components/icons/Icon';
import { Grid } from '../../components/layout/Grid';
import { Screen, TopBar } from '../../components/layout/Screen';
import { Btn } from '../../components/ui/Btn';
import { Chip } from '../../components/ui/Chip';
import { Field, Input } from '../../components/ui/Field';
import { FadeIn } from '../../components/ui/Motion';
import { Sheet } from '../../components/ui/Sheet';
import { T } from '../../components/ui/T';
import { Toast } from '../../components/ui/Toast';
import { FAQS } from '../../config/sampleData';
import { useAuth } from '../../context/AuthContext';
import type { ScreenProps } from '../../navigation/types';
import * as callbacks from '../../services/callbacks.service';
import * as content from '../../services/content.service';
import * as feedbackService from '../../services/feedback.service';
import * as support from '../../services/support.service';
import { colors, type } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { useToast } from '../../utils/useToast';

type FaqItem = { q: string; a: string };

/** H-05 Help & Support */
export function HelpScreen({ back }: ScreenProps) {
  const { user, appConfig } = useAuth();
  const [open, setOpen] = useState<number | null>(null);
  const [callback, setCallback] = useState(false);
  const [cbName, setCbName] = useState(user?.name || '');
  const [cbPhone, setCbPhone] = useState(user?.mobileNumber || '');
  const [cbTime, setCbTime] = useState('');
  const [feedback, setFeedback] = useState('');
  const [focus, setFocus] = useState(false);
  const [toast, showToast] = useToast(3500);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);
  const [busy, setBusy] = useState(false);
  const supportEmail = appConfig?.support?.supportEmail || 'support@builtglory.com';

  useEffect(() => {
    const ac = new AbortController();
    setLoadingFaqs(true);
    content
      .listContent({ section: 'faq', limit: 50 }, ac.signal)
      .then(res => {
        if (ac.signal.aborted) return;
        const fromApi = (res.items || [])
          .map(item => ({ q: item.title || '', a: item.body || item.excerpt || '' }))
          .filter(f => f.q);
        setFaqs(fromApi.length ? fromApi : FAQS.map(f => ({ q: f.q, a: f.a })));
      })
      .catch(err => {
        if (ac.signal.aborted) return;
        setFaqs(FAQS.map(f => ({ q: f.q, a: f.a })));
        showToast(errorMessage(err));
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoadingFaqs(false);
      });
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const channels = [
    {
      icon: 'message-circle',
      title: 'Live chat',
      sub: 'Avg 2 min',
      onPress: async () => {
        try {
          await support.startLiveChat({ message: 'I need help', category: 'general' });
          showToast('Live chat started.');
        } catch (e) {
          showToast(errorMessage(e));
        }
      },
    },
    { icon: 'phone-call', title: 'Callback', sub: 'Free', onPress: () => setCallback(true) },
    {
      icon: 'mail',
      title: 'Email',
      sub: '24 hrs',
      onPress: () => Linking.openURL(`mailto:${supportEmail}?subject=Support%20Request`),
    },
  ];

  return (
    <Screen
      footer={
        <>
          {callback && (
            <Sheet onClose={() => setCallback(false)} title="Request a Callback">
              <View style={styles.gap12}>
                <Field label="Your Name"><Input placeholder="Full name" value={cbName} onChangeText={setCbName} /></Field>
                <Field label="Phone Number"><Input placeholder="+91 98765 43210" value={cbPhone} onChangeText={setCbPhone} keyboardType="phone-pad" /></Field>
                <Field label="Preferred Time">
                  <View style={styles.wrap}>
                    {['Morning 9–12', 'Afternoon 12–4', 'Evening 4–7'].map(t => (
                      <Chip key={t} active={cbTime === t} onPress={() => setCbTime(t)}>{t}</Chip>
                    ))}
                  </View>
                </Field>
                <Btn full disabled={busy || !cbTime} onPress={async () => {
                  if (busy) return;
                  setBusy(true);
                  try {
                    const pref = cbTime.includes('Morning') ? 'morning' : cbTime.includes('Evening') ? 'evening' : 'afternoon';
                    await callbacks.requestCallback({
                      source: 'help_support',
                      sourceScreen: 'help',
                      category: 'general',
                      bestTimePreference: pref,
                      reason: cbName ? `Callback for ${cbName}` : undefined,
                    });
                    setCallback(false);
                    showToast("Callback requested. We'll call you within 4 hours.");
                  } catch (e) {
                    showToast(errorMessage(e));
                  } finally {
                    setBusy(false);
                  }
                }}>Confirm Callback</Btn>
              </View>
            </Sheet>
          )}
          <Toast message={toast} />
        </>
      }>
      <TopBar onBack={back} title="Need help?" sub="We're here, 24×7" />
      <View style={styles.px4}>
        <Grid cols={3} gap={8} style={styles.mb24}>
          {channels.map(c => (
            <Pressable key={c.title} onPress={() => void c.onPress()} style={styles.channel} accessibilityRole="button">
              <View style={styles.channelIcon}><Icon name={c.icon} size={18} color="#1A6FFF" /></View>
              <T s={12.5} w={600} align="center">{c.title}</T>
              <T s={10} c={colors.ink500} align="center">{c.sub}</T>
            </Pressable>
          ))}
        </Grid>
        <T display s={14} w={600} style={styles.mb8}>Frequently asked</T>
        {loadingFaqs ? (
          <View style={styles.faqLoading}><ActivityIndicator color={colors.brand600} /></View>
        ) : (
          <View style={[styles.faq, styles.mb24]}>
            {faqs.length === 0 ? (
              <View style={styles.faqQ}><T s={13} c={colors.ink500}>No FAQs available yet.</T></View>
            ) : faqs.map((f, i) => (
              <View key={i} style={i ? styles.faqDivider : null}>
                <Pressable onPress={() => setOpen(open === i ? null : i)} style={styles.faqQ} accessibilityRole="button" accessibilityState={{ expanded: open === i }}>
                  <T s={13} w={500} style={styles.flex1}>{f.q}</T>
                  <Icon name={open === i ? 'chevron-up' : 'chevron-down'} size={16} color="#64748B" />
                </Pressable>
                {open === i && <FadeIn style={styles.faqA}><T s={12.5} c={colors.ink500} lh={1.625}>{f.a}</T></FadeIn>}
              </View>
            ))}
          </View>
        )}
        <T display s={14} w={600} style={styles.mb8}>Send us feedback</T>
        <TextInput
          value={feedback}
          onChangeText={setFeedback}
          placeholder="Tell us what's on your mind…"
          placeholderTextColor={colors.ink400}
          multiline
          textAlignVertical="top"
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={[styles.textarea, focus && styles.textareaFocus]}
        />
        <Btn full style={styles.mt12} disabled={busy} onPress={async () => {
          if (!feedback.trim() || busy) return;
          setBusy(true);
          try {
            await feedbackService.submitFeedback({
              message: feedback.trim(),
              source: 'help_feedback',
              sourceScreen: 'help',
            });
            showToast('Feedback submitted. Thank you.');
            setFeedback('');
          } catch (e) {
            showToast(errorMessage(e));
          } finally {
            setBusy(false);
          }
        }}>Submit feedback</Btn>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  px4: { paddingHorizontal: 16 },
  mb8: { marginBottom: 8 },
  mb24: { marginBottom: 24 },
  mt12: { marginTop: 12 },
  gap12: { gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  channel: { padding: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.ink200, alignItems: 'center' },
  channelIcon: { width: 40, height: 40, borderRadius: 9999, backgroundColor: colors.brand50, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  faq: { borderWidth: 1, borderColor: colors.ink200, borderRadius: 14, overflow: 'hidden' },
  faqLoading: { paddingVertical: 24, alignItems: 'center', marginBottom: 24 },
  faqDivider: { borderTopWidth: 1, borderTopColor: colors.ink200 },
  faqQ: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: 14 },
  faqA: { paddingHorizontal: 14, paddingBottom: 14 },
  textarea: { width: '100%', padding: 12, borderWidth: 1, borderColor: colors.ink200, borderRadius: 14, minHeight: 90, ...type(14), lineHeight: 20, color: colors.ink900 },
  textareaFocus: { borderColor: colors.brand600 },
});
