import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Btn } from '../../components/Btn';
import { Chip, Field, Input, TextArea } from '../../components/Form';
import { Icon, type IconName } from '../../components/Icon';
import { Accordion } from '../../components/Interactive';
import { Grid } from '../../components/Layout';
import { Press } from '../../components/Press';
import { Screen } from '../../components/Screen';
import { Sheet } from '../../components/Sheet';
import { ErrorState, LoadingState } from '../../components/States';
import { T } from '../../components/T';
import { useAppConfig } from '../../context/AppConfigContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useResource } from '../../lib/useResource';
import { useNav } from '../../navigation/NavContext';
import { listContent } from '../../services/content.service';
import {
  requestCallback,
  submitFeedback,
} from '../../services/support.service';
import { tw } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { formatTime } from '../../utils/format';
import { sendEmail } from '../../utils/links';

export type CallbackSlot = 'morning' | 'afternoon' | 'evening';

/** Shared FAQ loader (published content, section "faq"). */
export function useFaqs() {
  return useResource(
    signal => listContent({ section: 'faq', limit: 100 }, signal),
    [],
  );
}

/** POST /callbacks with the contact details captured by the form. */
export async function submitCallback(opts: {
  name: string;
  phone: string;
  slot: CallbackSlot;
  source: 'help_support' | 'profile_support';
  sourceScreen: string;
}) {
  const reason = `Callback requested from ${opts.sourceScreen}. Name: ${
    opts.name.trim() || '—'
  }. Phone: +91 ${opts.phone.replace(/\D/g, '').slice(-10)}.`;
  return requestCallback({
    source: opts.source,
    sourceScreen: opts.sourceScreen,
    category: 'general',
    bestTimePreference: opts.slot,
    reason,
  });
}

const SLOTS: Array<[CallbackSlot, string]> = [
  ['morning', 'Morning 9–12'],
  ['afternoon', 'Afternoon 12–4'],
  ['evening', 'Evening 4–7'],
];

/** H-05 Help & Support. */
export function HelpScreen() {
  const nav = useNav();
  const toast = useToast();
  const { user, isSignedIn } = useAuth();
  const { supportEmail } = useAppConfig();
  const faqs = useFaqs();
  const [open, setOpen] = useState<number | null>(null);
  const [callbackModal, setCallbackModal] = useState(false);
  const [cbName, setCbName] = useState(user?.name ?? '');
  const [cbPhone, setCbPhone] = useState(user?.mobileNumber ?? '');
  const [cbTime, setCbTime] = useState<CallbackSlot | ''>('');
  const [cbSending, setCbSending] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [fbSending, setFbSending] = useState(false);

  const requireSignIn = () => {
    if (isSignedIn) return true;
    nav.signIn({ name: 'help' });
    return false;
  };

  const confirmCallback = async () => {
    if (!cbTime) return;
    setCbSending(true);
    try {
      const cb = await submitCallback({
        name: cbName,
        phone: cbPhone,
        slot: cbTime,
        source: 'help_support',
        sourceScreen: 'help',
      });
      setCallbackModal(false);
      toast.show(
        cb.slaDeadline
          ? `Callback requested. We'll call you by ${formatTime(
              cb.slaDeadline,
            )}.`
          : "Callback requested. We'll call you soon.",
        'success',
        3500,
      );
    } catch (e) {
      toast.show(errorMessage(e), 'error');
    } finally {
      setCbSending(false);
    }
  };

  const sendFeedback = async () => {
    if (!feedback.trim() || !requireSignIn()) return;
    setFbSending(true);
    try {
      await submitFeedback({ message: feedback.trim(), sourceScreen: 'help' });
      toast.show('Feedback submitted. Thank you.', 'success', 3500);
      setFeedback('');
    } catch (e) {
      toast.show(errorMessage(e), 'error');
    } finally {
      setFbSending(false);
    }
  };

  const items = (faqs.data ?? []).map(f => ({ q: f.title, a: f.body }));
  const tiles: Array<{
    icon: IconName;
    title: string;
    sub: string;
    onPress: () => void;
  }> = [
    {
      icon: 'message-circle',
      title: 'Live chat',
      sub: 'Avg 2 min',
      onPress: () =>
        toast.show(
          'Live chat coming soon. Try email or callback.',
          'warn',
          3500,
        ),
    },
    {
      icon: 'phone-call',
      title: 'Callback',
      sub: 'Free',
      onPress: () => {
        if (requireSignIn()) setCallbackModal(true);
      },
    },
    {
      icon: 'mail',
      title: 'Email',
      sub: '24 hrs',
      onPress: () => supportEmail && sendEmail(supportEmail),
    },
  ];

  return (
    <Screen
      topBar={{ title: 'Need help?', sub: "We're here, 24×7", back: true }}
    >
      <View style={styles.body}>
        <Grid cols={3} gap={8} style={styles.mb6}>
          {tiles.map(t => (
            <Press key={t.title} onPress={t.onPress} style={styles.tile}>
              <View style={styles.tileIcon}>
                <Icon name={t.icon} size={18} color="#1A6FFF" />
              </View>
              <T style={styles.tileTitle}>{t.title}</T>
              <T style={styles.tileSub}>{t.sub}</T>
            </Press>
          ))}
        </Grid>
        <T style={styles.h3}>Frequently asked</T>
        <View style={styles.mb6}>
          {faqs.loading ? (
            <LoadingState />
          ) : faqs.error ? (
            <ErrorState compact message={faqs.error} onRetry={faqs.reload} />
          ) : (
            <Accordion
              items={items}
              openSet={new Set(open === null ? [] : [open])}
              onToggle={i => setOpen(open === i ? null : i)}
            />
          )}
        </View>
        <T style={styles.h3}>Send us feedback</T>
        <TextArea
          value={feedback}
          onChangeText={setFeedback}
          placeholder="Tell us what's on your mind…"
          height={90}
          maxLength={5000}
        />
        <Btn style={styles.submit} onPress={sendFeedback} loading={fbSending}>
          Submit feedback
        </Btn>
      </View>
      <Sheet
        visible={callbackModal}
        onClose={() => setCallbackModal(false)}
        title="Request a Callback"
      >
        <View style={styles.sheet}>
          <Field label="Your Name">
            <Input
              placeholder="Full name"
              value={cbName}
              onChangeText={setCbName}
            />
          </Field>
          <Field label="Phone Number">
            <Input
              placeholder="+91 98765 43210"
              value={cbPhone}
              onChangeText={setCbPhone}
              keyboardType="phone-pad"
            />
          </Field>
          <Field label="Preferred Time">
            <View style={styles.chips}>
              {SLOTS.map(([id, label]) => (
                <Chip
                  key={id}
                  active={cbTime === id}
                  onPress={() => setCbTime(id)}
                >
                  {label}
                </Chip>
              ))}
            </View>
          </Field>
          <Btn
            style={styles.full}
            onPress={confirmCallback}
            disabled={!cbTime || cbPhone.replace(/\D/g, '').length < 10}
            loading={cbSending}
          >
            Confirm Callback
          </Btn>
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: tw('px-4'),
  mb6: tw('mb-6'),
  tile: tw('p-3 rounded-card border border-ink-200 items-center'),
  tileIcon: tw(
    'w-10 h-10 rounded-full bg-brand-50 items-center justify-center mb-2',
  ),
  tileTitle: tw('text-[12.5px] font-semibold text-center'),
  tileSub: tw('text-[10px] text-ink-500 text-center'),
  h3: tw('text-[14px] font-semibold mb-2'),
  submit: tw('w-full mt-3 self-stretch'),
  sheet: { gap: 12 },
  chips: tw('flex flex-row flex-wrap gap-2'),
  full: { alignSelf: 'stretch' },
});
