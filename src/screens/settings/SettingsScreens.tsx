import React, { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusMark } from '../../components/hero/StatusMark';
import { Icon } from '../../components/icons/Icon';
import { AppScreen } from '../../components/layout/AppScreen';
import { InsetGroup, Row } from '../../components/layout/Groups';
import { Grid } from '../../components/layout/Grid';
import { Screen, TopBar } from '../../components/layout/Screen';
import { Btn } from '../../components/ui/Btn';
import { Toast } from '../../components/ui/Toast';
import { FAQ_TOPICS } from '../../config/sampleData';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../utils/useToast';
import { Field, Input } from '../../components/ui/Field';
import { FadeIn } from '../../components/ui/Motion';
import { T } from '../../components/ui/T';
import { Toggle } from '../../components/ui/Toggle';
import type { ScreenProps } from '../../navigation/types';
import * as callbacks from '../../services/callbacks.service';
import * as content from '../../services/content.service';
import * as meService from '../../services/me.service';
import * as support from '../../services/support.service';
import { colors, elev } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { isSupportOpenNow } from '../../utils/sellApi';

/** A-01 Settings */
export function SettingsMainScreen({ go, back }: ScreenProps) {
  return (
    <AppScreen title="Settings" sub="Account, alerts and app preferences" onBack={back}>
      <View style={styles.groups}>
        <InsetGroup label="Account">
          <Row icon="shield" iconTone="green" label="Account Settings" sub="Password and account" onPress={() => go('accountSettings')} />
        </InsetGroup>
        <InsetGroup label="Preferences">
          <Row icon="bell" iconTone="amber" label="Notifications" sub="Choose what alerts you receive" onPress={() => go('notificationSettings')} />
          <Row icon="smartphone" iconTone="ink" label="App Settings" sub="Language, theme, location" onPress={() => go('appSettings')} />
        </InsetGroup>
        <InsetGroup label="Support" footer="Builtglory v2.4.0 · Made in Chennai">
          <Row icon="circle-help" label="Help & FAQs" sub="Answers to common questions" onPress={() => go('helpFaqs')} />
          <Row icon="info" iconTone="ink" label="About Us" sub="Mission, how it works, contact" onPress={() => go('aboutUs')} />
        </InsetGroup>
      </View>
    </AppScreen>
  );
}

const NOTIF_ROWS: [string, string, string][] = [
  ['enquiry', 'Enquiry updates', 'Replies and status changes on your enquiries'],
  ['listing', 'Listing updates', 'Verification, views and enquiries on your listings'],
  ['deal', 'Deal updates', 'Offers, negotiations and deal milestones'],
  ['payment', 'Payment updates', 'Token, balance and payout confirmations'],
  ['seminar', 'Seminar reminders', 'Webinars and investment events'],
];

/** A-02 Notification settings — PATCH /me notificationPreferences */
export function NotificationSettingsScreen({ back }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { user, refreshProfile } = useAuth();
  const prefs = user?.notificationPreferences;
  const [s, setS] = useState<Record<string, boolean>>({
    enquiry: prefs?.push?.transactional !== false,
    listing: prefs?.in_app?.transactional !== false,
    deal: prefs?.push?.transactional !== false,
    payment: prefs?.sms?.transactional !== false,
    seminar: prefs?.push?.marketing === true,
  });
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');

  const set = async (k: string, v: boolean) => {
    const next = { ...s, [k]: v };
    setS(next);
    setErr('');
    try {
      await meService.patchMe({
        notificationPreferences: {
          push: { transactional: next.enquiry || next.deal, marketing: next.seminar },
          whatsapp: { transactional: next.deal, marketing: next.seminar },
          sms: { transactional: next.payment, marketing: false },
          email: { transactional: next.enquiry, marketing: next.seminar },
          in_app: { transactional: next.listing || next.enquiry, marketing: next.seminar },
        },
      });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    } catch (e) {
      setErr(errorMessage(e));
    }
  };
  return (
    <Screen
      footer={saved ? (
        <View style={[styles.savedWrap, { bottom: 24 + insets.bottom }]} pointerEvents="none">
          <FadeIn style={styles.saved}>
            <Icon name="check" size={13} color="white" />
            <T s={12} w={500} c="#FFFFFF">Saved</T>
          </FadeIn>
        </View>
      ) : null}>
      <TopBar onBack={back} title="Notification Settings" />
      <View style={styles.px4}>
        <View style={styles.box}>
          {NOTIF_ROWS.map(([k, label, sub], i) => (
            <View key={k} style={[styles.toggleRow, i > 0 && styles.divider]}>
              <View style={styles.flex1}>
                <T s={14} w={600}>{label}</T>
                <T s={11.5} c={colors.ink500}>{sub}</T>
              </View>
              <Toggle on={s[k]} onChange={v => void set(k, v)} accessibilityLabel={label} />
            </View>
          ))}
        </View>
        {err ? <T s={12} c={colors.rose600} style={styles.mt8}>{err}</T> : null}
        <View style={styles.note}>
          <Icon name="cloud" size={13} color="#94A3B8" />
          <T s={11.5} c={colors.ink500}>Changes are saved to your account automatically.</T>
        </View>
      </View>
    </Screen>
  );
}

/** A-03 App settings (language, dark mode, location) */
export function AppSettingsScreen({ back }: ScreenProps) {
  const [lang, setLang] = useState('English');
  const [dark, setDark] = useState(false);
  const [loc, setLoc] = useState('gps');
  const label = dark ? 'rgba(255,255,255,0.5)' : colors.ink500;
  return (
    <Screen dark={dark}>
      <TopBar onBack={back} title="App Settings" dark={dark} />
      <View style={styles.sections}>
        <View>
          <T s={12} w={600} upper ls={0.05} c={label} style={styles.mb8}>Language</T>
          <Grid cols={2} gap={8}>
            {['English', 'Tamil'].map(l => (
              <Pressable key={l} onPress={() => setLang(l)} style={[styles.lang, lang === l ? styles.on : dark ? styles.darkOff : styles.off]}>
                <T s={14} w={500} c={lang === l ? colors.brand700 : dark ? 'rgba(255,255,255,0.7)' : colors.ink700}>{l}</T>
              </Pressable>
            ))}
          </Grid>
        </View>
        <View>
          <T s={12} w={600} upper ls={0.05} c={label} style={styles.mb8}>Appearance</T>
          <View style={[styles.appearance, dark ? styles.darkBox : styles.off]}>
            <Icon name={dark ? 'moon' : 'sun'} size={18} color={dark ? '#fff' : '#64748B'} />
            <View style={styles.flex1}>
              <T s={14} w={600} c={dark ? colors.white : colors.ink900}>Dark Mode</T>
              <T s={11.5} c={label}>Applies immediately</T>
            </View>
            <Toggle on={dark} onChange={setDark} accessibilityLabel="Dark mode" />
          </View>
        </View>
        <View>
          <T s={12} w={600} upper ls={0.05} c={label} style={styles.mb8}>Location</T>
          <View style={styles.gap8}>
            {([['gps', 'Use GPS', 'Auto-detect my location'], ['manual', 'Manual entry', 'Pick city and area myself']] as [string, string, string][]).map(([id, l, sub]) => {
              const on = loc === id;
              return (
                <Pressable key={id} onPress={() => setLoc(id)} style={[styles.locRow, on ? styles.on : dark ? styles.darkBox : styles.off]} accessibilityRole="radio" accessibilityState={{ checked: on }}>
                  <Icon name={id === 'gps' ? 'locate-fixed' : 'map-pin'} size={17} color={on ? '#1A6FFF' : dark ? '#fff' : '#64748B'} />
                  <View style={styles.flex1}>
                    <T s={13.5} w={600} c={dark ? colors.white : colors.ink900}>{l}</T>
                    <T s={11} c={label}>{sub}</T>
                  </View>
                  <View style={[styles.radio, on ? styles.radioOn : styles.radioOff]}>{on && <View style={styles.radioDot} />}</View>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={styles.note}>
          <Icon name="cloud" size={13} color={dark ? '#fff' : '#94A3B8'} />
          <T s={11.5} c={label}>All preferences are saved to your account.</T>
        </View>
      </View>
    </Screen>
  );
}

/** A-04 Account settings (change password, delete account) */
export function AccountSettingsScreen({ go, back }: ScreenProps) {
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const valid = pw.next.length >= 8 && pw.next === pw.confirm;
  const set = (k: keyof typeof pw, v: string) => setPw(p => ({ ...p, [k]: v }));
  const updatePassword = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setErr('');
    try {
      await meService.setPassword(pw.next);
      setSaved(true);
      setPw({ current: '', next: '', confirm: '' });
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
      setTimeout(() => setSaved(false), 1400);
    }
  };
  return (
    <Screen>
      <TopBar onBack={back} title="Account Settings" />
      <View style={styles.px4}>
        <T display s={14} w={600} style={styles.mb12}>Change Password</T>
        <View style={styles.gap12}>
          <Field label="Current Password" required><Input icon="lock" secureTextEntry value={pw.current} onChangeText={v => set('current', v)} placeholder="Enter current password" /></Field>
          <Field label="New Password" required hint="At least 8 characters"><Input icon="lock" secureTextEntry value={pw.next} onChangeText={v => set('next', v)} placeholder="Enter new password" /></Field>
          <Field label="Confirm New Password" required>
            <Input icon="lock" secureTextEntry value={pw.confirm} onChangeText={v => set('confirm', v)} placeholder="Re-enter new password" />
            {pw.confirm && pw.next !== pw.confirm ? <T s={11} c={colors.rose500} style={styles.mt6}>Passwords don't match</T> : null}
          </Field>
        </View>
        {err ? <T s={12} c={colors.rose600} style={styles.mt8}>{err}</T> : null}
        <Pressable onPress={() => void updatePassword()} disabled={!valid || busy}
          style={({ pressed }) => [styles.solid, styles.mt20, { backgroundColor: saved ? colors.emerald500 : valid ? (pressed ? colors.brand700 : colors.brand600) : colors.ink100 }]}>
          {saved && <Icon name="check" size={18} color="white" />}
          <T s={15} w={600} c={saved || valid ? colors.white : colors.ink400}>{busy ? 'Updating…' : saved ? 'Password Updated' : 'Update Password'}</T>
        </Pressable>
        <View style={styles.danger}>
          <Pressable onPress={() => go('accountDeletion')} style={({ pressed }) => [styles.deleteRow, pressed && { backgroundColor: colors.rose50 }]}>
            <Icon name="trash-2" size={15} color="#E11D48" />
            <T s={13} w={500} c={colors.rose600}>Delete Account</T>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const DELETED = ['Profile and contact details', 'Saved searches and favourites', 'Enquiry and listing history', 'Uploaded documents'];

/** A-04a Delete account confirmation */
export function AccountDeletionScreen({ go, back }: ScreenProps) {
  const { logout } = useAuth();
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const enabled = typed === 'DELETE';
  const onDelete = async () => {
    if (!enabled || busy) return;
    setBusy(true);
    setErr('');
    try {
      await meService.requestAccountDeletion({ confirmation: 'DELETE' });
      await logout();
      go('splash');
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen>
      <TopBar onBack={back} title="Delete Account" />
      <View style={styles.px4}>
        <View style={styles.warnBox}>
          <View style={[styles.inline8, styles.mb8]}>
            <StatusMark kind="error" size={20} />
            <T s={14} w={700} c={colors.rose800}>This cannot be undone</T>
          </View>
          <T s={12} c={colors.rose700} style={styles.mb8}>The following data will be permanently deleted:</T>
          <View style={styles.gap4}>
            {DELETED.map(t => (
              <View key={t} style={styles.inline8}>
                <Icon name="x" size={12} color="#E11D48" />
                <T s={12.5} c={colors.rose800}>{t}</T>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.legal}>
          <Icon name="scale" size={14} color="#64748B" style={styles.mt2} />
          <T s={11.5} c={colors.ink600} style={styles.flex1}>Some records (transaction & tax documents) are retained as required by law. Deletion follows a <T w={700}>30-day grace period</T> and complies with the <T w={700}>DPDP Act 2023</T>.</T>
        </View>
        <Field label={<>Type <T w={700}>DELETE</T> to confirm</>}>
          <Input value={typed} onChangeText={setTyped} placeholder="DELETE" autoCapitalize="characters" />
        </Field>
        {err ? <T s={12} c={colors.rose600}>{err}</T> : null}
        <Pressable onPress={() => void onDelete()} disabled={!enabled || busy} style={({ pressed }) => [styles.solid, styles.mt20, { backgroundColor: enabled ? (pressed ? colors.rose700 : colors.rose600) : colors.rose200 }]}>
          <T s={15} w={600} c="#FFFFFF">{busy ? 'Submitting…' : 'Delete My Account'}</T>
        </Pressable>
        <Pressable onPress={back} style={[styles.solid, styles.mt8, { backgroundColor: colors.ink100 }]}>
          <T s={15} w={600} c={colors.ink700}>Keep My Account</T>
        </Pressable>
      </View>
    </Screen>
  );
}

/** A-05 Help & FAQs */
export function HelpFaqsScreen({ go, back }: ScreenProps) {
  const [q, setQ] = useState('');
  const [faqs, setFaqs] = useState<{ q: string; a: string; category?: string }[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { items } = await content.listContent({ section: 'faq', limit: 100 });
        if (!cancelled) {
          setFaqs(items.map(i => ({
            q: i.title,
            a: i.body || i.excerpt || '',
            category: i.category || String(i.metadata?.topicLabel || ''),
          })));
        }
      } catch (e) {
        if (!cancelled) setErr(errorMessage(e));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const results = q ? faqs.filter(f => (f.q + ' ' + f.a).toLowerCase().includes(q.toLowerCase())) : [];
  return (
    <Screen>
      <TopBar onBack={back} title="Help & FAQs" />
      <View style={styles.px4}>
        <Input icon="search" placeholder="Search help articles" value={q} onChangeText={setQ} containerStyle={styles.mb16} />
        {err ? <T s={12} c={colors.rose600} style={styles.mb8}>{err}</T> : null}
        {q ? (
          <FadeIn style={styles.gap8}>
            <T s={11} c={colors.ink500}>{results.length} results</T>
            {results.length === 0 ? (
              <View style={styles.noResults}>
                <Icon name="search-x" size={36} color="#CBD5E1" />
                <T s={13} c={colors.ink400} style={styles.mt8}>No articles found</T>
              </View>
            ) : results.map((f, i) => (
              <View key={i} style={styles.faqCard}>
                <T s={13} w={600}>{f.q}</T>
                <T s={12} lh={1.625} c={colors.ink500} style={styles.mt4}>{f.a}</T>
              </View>
            ))}
          </FadeIn>
        ) : (
          <>
            <Grid cols={2} gap={10}>
              {FAQ_TOPICS.map(t => (
                <Pressable key={t.id} onPress={() => go('faqTopic', { topic: t, faqs: faqs.filter(f => !f.category || f.category.toLowerCase().includes(t.id) || f.category.toLowerCase().includes(t.label.toLowerCase())) })} style={({ pressed }) => [styles.topic, pressed && { borderColor: colors.brand300 }]}>
                  <View style={styles.topicIcon}><Icon name={t.icon} size={18} color="#1A6FFF" /></View>
                  <View style={styles.flex1}>
                    <T s={13} w={600} truncate>{t.label}</T>
                    <T s={10.5} c={colors.ink500}>{faqs.filter(f => !f.category || f.category.toLowerCase().includes(t.id) || f.category.toLowerCase().includes(t.label.toLowerCase())).length || t.count} articles</T>
                  </View>
                </Pressable>
              ))}
            </Grid>
            <Pressable onPress={() => go('customerSupport')} style={styles.stillHelp}>
              <View style={styles.headset}><Icon name="headphones" size={18} color="white" /></View>
              <View style={styles.flex1}>
                <T s={14} w={600} c={colors.brand700}>Still need help?</T>
                <T s={11.5} c={colors.brand600}>Contact customer support</T>
              </View>
              <Icon name="chevron-right" size={16} color="#1A6FFF" />
            </Pressable>
          </>
        )}
      </View>
    </Screen>
  );
}

/** A-06 FAQ topic detail (accordion) */
export function FaqTopicScreen({ back, ctx }: ScreenProps) {
  const topic = ctx?.topic || { label: 'Buying' };
  const [faqs, setFaqs] = useState<{ q: string; a: string }[]>(Array.isArray(ctx?.faqs) ? ctx.faqs : []);
  const [open, setOpen] = useState<Set<number>>(() => new Set([0]));
  const toggle = (i: number) => setOpen(s => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; });

  useEffect(() => {
    if (faqs.length) return;
    let cancelled = false;
    (async () => {
      try {
        const { items } = await content.listContent({
          section: 'faq',
          category: topic.id,
          limit: 100,
        });
        if (!cancelled) {
          setFaqs(items.map(i => ({ q: i.title, a: i.body || i.excerpt || '' })));
        }
      } catch {
        // leave empty
      }
    })();
    return () => { cancelled = true; };
  }, [faqs.length, topic.id]);

  return (
    <Screen>
      <TopBar onBack={back} title={topic.label} sub="Frequently asked questions" />
      <View style={styles.px4}>
        <View style={styles.accordion}>
          {faqs.map((f, i) => (
            <View key={i} style={i ? styles.accDivider : null}>
              <Pressable onPress={() => toggle(i)} style={styles.accHead} accessibilityRole="button" accessibilityState={{ expanded: open.has(i) }}>
                <T s={13} w={500} style={styles.flex1}>{f.q}</T>
                <Icon name={open.has(i) ? 'chevron-up' : 'chevron-down'} size={16} color="#64748B" />
              </Pressable>
              {open.has(i) && <FadeIn style={styles.accBody}><T s={12.5} lh={1.625} c={colors.ink500}>{f.a}</T></FadeIn>}
            </View>
          ))}
          {!faqs.length ? <View style={styles.p16}><T s={13} c={colors.ink500}>No articles in this topic yet.</T></View> : null}
        </View>
      </View>
    </Screen>
  );
}

/** A-07 Customer support */
export function CustomerSupportScreen({ go, back }: ScreenProps) {
  const { user, appConfig } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.mobileNumber || '',
    slot: '',
    message: '',
  });
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, showToast] = useToast(2500);
  const supportEmail = appConfig?.support?.supportEmail || 'support@builtglory.com';

  const requestCb = async () => {
    if (!form.slot || busy) return;
    setBusy(true);
    try {
      const pref = form.slot.toLowerCase() as 'morning' | 'afternoon' | 'evening';
      await callbacks.requestCallback({
        source: 'help_support',
        sourceScreen: 'customer_support',
        category: 'general',
        bestTimePreference: pref,
        reason: form.message || undefined,
      });
      setSent(true);
    } catch (e) {
      showToast(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const startChat = async () => {
    try {
      await support.startLiveChat({
        category: 'general',
        subject: 'Live chat',
        message: 'I need help',
      });
      showToast('Live chat started. An agent will reply shortly.');
    } catch (e) {
      showToast(errorMessage(e));
    }
  };

  return (
    <Screen footer={<Toast message={toast} />}>
      <TopBar onBack={back} title="Customer Support" />
      <View style={styles.px4}>
        <Pressable onPress={() => void startChat()} style={({ pressed }) => [styles.option, styles.mb12, pressed && { borderColor: colors.brand300 }]}>
          <View style={styles.flex1}>
            <T s={14} w={600}>Live Chat</T>
            <T s={11.5} c={colors.ink500}>Typically replies in {'<'} 2 hours</T>
          </View>
          <Icon name="chevron-right" size={16} color="#94A3B8" />
        </Pressable>

        <View style={[styles.callback, styles.mb12]}>
          <T s={14} w={600} style={styles.mb12}>Request a Callback</T>
          {sent ? (
            <FadeIn style={styles.sent}>
              <StatusMark kind="success" size={18} />
              <T s={13} c={colors.emerald700} style={styles.flex1}>We'll call you in your chosen slot.</T>
            </FadeIn>
          ) : (
            <View style={styles.gap12}>
              <Field label="Name"><Input icon="user" value={form.name} onChangeText={v => setForm({ ...form, name: v })} /></Field>
              <Field label="Phone"><Input icon="phone" prefix="+91" keyboardType="phone-pad" value={form.phone} onChangeText={v => setForm({ ...form, phone: v })} /></Field>
              <Field label="Preferred time slot">
                <Grid cols={3} gap={8}>
                  {['Morning', 'Afternoon', 'Evening'].map(s => {
                    const on = form.slot === s;
                    return (
                      <Pressable key={s} onPress={() => setForm({ ...form, slot: s })} style={[styles.slot, { backgroundColor: on ? colors.brand600 : colors.ink100 }]}>
                        <T s={12} w={500} c={on ? colors.white : colors.ink700}>{s}</T>
                      </Pressable>
                    );
                  })}
                </Grid>
              </Field>
              <Btn full disabled={!form.slot || busy} onPress={() => void requestCb()}>{busy ? 'Requesting…' : 'Request Callback'}</Btn>
            </View>
          )}
        </View>

        <Pressable onPress={() => Linking.openURL(`mailto:${supportEmail}?subject=Support%20Request`).catch(() => showToast('Unable to open your email app'))}
          style={({ pressed }) => [styles.option, styles.mb12, pressed && { borderColor: colors.brand300 }]}>
          <View style={[styles.optIcon, { backgroundColor: colors.brand50 }]}><Icon name="mail" size={20} color="#1A6FFF" /></View>
          <View style={styles.flex1}>
            <T s={14} w={600}>Email Support</T>
            <T s={11.5} c={colors.ink500}>Reply within {'<'} 24 hours</T>
          </View>
          <Icon name="chevron-right" size={16} color="#94A3B8" />
        </Pressable>
        <Pressable onPress={() => go('callUs')} style={({ pressed }) => [styles.option, pressed && { borderColor: colors.brand300 }]}>
          <View style={[styles.optIcon, { backgroundColor: colors.ink100 }]}><Icon name="phone-call" size={20} color="#334155" /></View>
          <View style={styles.flex1}>
            <T s={14} w={600}>Call Us</T>
            <T s={11.5} c={colors.ink500}>Speak to an advisor</T>
          </View>
          <Icon name="chevron-right" size={16} color="#94A3B8" />
        </Pressable>
      </View>
    </Screen>
  );
}

/** A-07a Call us */
export function CallUsScreen({ go, back }: ScreenProps) {
  const { appConfig } = useAuth();
  const phone = appConfig?.support?.phone || '+91 44 4000 8000';
  const tel = phone.replace(/[^\d+]/g, '');
  const open = isSupportOpenNow();
  const callCare = () => { Linking.openURL(`tel:${tel}`).catch(() => {}); };
  return (
    <Screen>
      <TopBar onBack={back} title="Call Us" />
      <View style={styles.px4}>
        <View style={styles.callCard}>
          <View style={styles.callIcon}><Icon name="phone-call" size={28} color="#1A6FFF" /></View>
          <Pressable onPress={callCare} accessibilityRole="link"><T s={22} w={700} c={colors.brand600} align="center">{phone}</T></Pressable>
          <T s={12} c={colors.ink500} align="center" style={styles.mt4}>Builtglory Customer Care</T>
          <Pressable onPress={callCare} style={({ pressed }) => [styles.tapCall, pressed && { backgroundColor: colors.brand700 }]} accessibilityRole="button">
            <Icon name="phone" size={16} color="white" />
            <T s={14} w={600} c="#FFFFFF">Tap to Call</T>
          </Pressable>
        </View>
        <View style={styles.hours}>
          <T s={12} c={colors.ink500} align="center">Office hours</T>
          <T s={13} w={600} align="center" style={styles.mt2}>Mon–Sat · 9:00 AM – 7:00 PM IST</T>
        </View>
        {!open && (
          <View style={styles.closed}>
            <Icon name="moon" size={22} color="#D97706" style={styles.mb8} />
            <T s={13} w={600} c={colors.amber800} align="center">We are currently closed.</T>
            <T s={11.5} c={colors.amber700} align="center" style={[styles.mt2, styles.mb12]}>Leave your number and we'll call you back.</T>
            <Btn variant="outline" size="sm" onPress={() => go('customerSupport')} style={styles.selfCenter}>Request Callback</Btn>
          </View>
        )}
      </View>
    </Screen>
  );
}

const HOW = [
  { num: '1', title: 'Seller Lists', desc: 'Property owners submit listings with verified documents and photos.' },
  { num: '2', title: 'Valuation & Buyer Match', desc: 'AI evaluates properties and connects verified buyers through our platform.' },
  { num: '3', title: 'Safe Transaction', desc: 'Escrow payments, legal verification, and registration assistance ensure a smooth sale.' },
];

/** A-08 About us */
export function AboutUsScreen({ go, back }: ScreenProps) {
  const { appConfig } = useAuth();
  const [mission, setMission] = useState('');
  useEffect(() => {
    let cancelled = false;
    content.listContent({ section: 'about', limit: 10 })
      .then(res => {
        if (cancelled) return;
        const body = res.items.map(i => i.body || i.excerpt || '').filter(Boolean).join('\n\n');
        if (body) setMission(body);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  const version = appConfig?.versions?.current || '1.0.0';
  const phone = appConfig?.support?.phone || '+91 44 4000 8000';
  const email = appConfig?.support?.supportEmail || 'support@builtglory.com';
  const contactRows: [string, string, string, boolean][] = [
    ['map-pin', 'Registered Office', '123 Tech Park, OMR, Adyar, Chennai 600020, India', false],
    ['mail', 'Email', email, true],
    ['phone', 'Phone', phone, true],
  ];
  const link = (label: string) => (
    <Pressable key={label} onPress={() => go('termsOfUse')} style={({ pressed }) => [styles.linkRow, pressed && { backgroundColor: colors.ink50 }]}>
      <T s={13} w={600}>{label}</T>
      <Icon name="chevron-right" size={16} color="#94A3B8" />
    </Pressable>
  );
  return (
    <Screen>
      <TopBar onBack={back} title="About Us" sub="Learn about Builtglory" />
      <View style={styles.aboutBody}>
        <View style={styles.appInfo}>
          <View style={styles.logo}><T s={30} w={900} lh={1.2} c="#FFFFFF">B</T></View>
          <View>
            <T s={16} w={700}>BUILTGLORY</T>
            <T s={12} c={colors.ink600}>Version {version}</T>
            <T s={11} c={colors.ink500}>© 2026 Builtglory · All rights reserved</T>
          </View>
        </View>

        <View style={styles.mb24}>
          <T display s={16} w={700} style={styles.mb8}>Our Mission</T>
          <T s={13} lh={1.625} c={colors.ink600}>
            {mission || "Builtglory is India's verified real estate marketplace dedicated to simplifying property transactions for buyers, sellers, and investors."}
          </T>
        </View>

        <View style={styles.mb24}>
          <T display s={16} w={700} style={styles.mb12}>How Builtglory Works</T>
          <View style={styles.gap12}>
            {HOW.map(h => (
              <View key={h.num} style={styles.howRow}>
                <View style={styles.howNum}><T s={13} w={700} c="#FFFFFF">{h.num}</T></View>
                <View style={styles.flex1}>
                  <T s={13} w={600}>{h.title}</T>
                  <T s={12} c={colors.ink600} style={styles.mt2}>{h.desc}</T>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.contactBox}>
          <View style={styles.p16}>
            <T display s={13} w={700} style={styles.mb8}>Contact Information</T>
            <View style={styles.gap8}>
              {contactRows.map(([icon, label, value, accent]) => (
                <View key={label} style={styles.contactRow}>
                  <Icon name={icon} size={14} color="#1A6FFF" style={styles.mt4} />
                  <View style={styles.flex1}>
                    <T s={12} w={500} c={colors.ink700}>{label}</T>
                    <T s={12} w={accent ? 500 : 400} c={accent ? colors.brand600 : colors.ink600}>{value}</T>
                  </View>
                </View>
              ))}
            </View>
          </View>
          <Pressable onPress={() => go('help')} style={({ pressed }) => [styles.contactSupport, pressed && { backgroundColor: colors.ink50 }]}>
            <T s={13} w={600}>Contact Support</T>
            <Icon name="chevron-right" size={16} color="#94A3B8" />
          </Pressable>
        </View>

        <View style={[styles.mt24, styles.gap8]}>
          {['Terms of Use', 'Privacy Policy', 'Community Guidelines'].map(link)}
        </View>

        <View style={styles.footerNote}>
          <T s={10} c={colors.ink500} align="center" style={styles.mb8}>Made with ❤️ in India</T>
          <T s={11} w={500} c={colors.ink700} align="center">Simplifying real estate, one transaction at a time</T>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  px4: { paddingHorizontal: 16 },
  gap4: { gap: 4 },
  gap8: { gap: 8 },
  gap12: { gap: 12 },
  inline8: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mt2: { marginTop: 2 },
  mt6: { marginTop: 6 },
  mt8: { marginTop: 8 },
  mt20: { marginTop: 20 },
  mb8: { marginBottom: 8 },
  mb12: { marginBottom: 12 },
  divider: { borderTopWidth: 1, borderTopColor: colors.ink100 },
  groups: { paddingHorizontal: 16, paddingTop: 8, gap: 20 },
  box: { borderRadius: 14, borderWidth: 1, borderColor: colors.ink200 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  note: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  savedWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  saved: { backgroundColor: colors.ink900, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999, flexDirection: 'row', alignItems: 'center', gap: 6, boxShadow: elev.lg },
  sections: { paddingHorizontal: 16, gap: 20 },
  lang: { height: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  on: { borderColor: colors.brand600, backgroundColor: colors.brand50 },
  off: { borderColor: colors.ink200 },
  darkOff: { borderColor: 'rgba(255,255,255,0.2)' },
  darkBox: { borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.05)' },
  appearance: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14, borderWidth: 1 },
  locRow: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1 },
  radio: { width: 20, height: 20, borderRadius: 9999, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.brand600, backgroundColor: colors.brand600 },
  radioOff: { borderColor: colors.ink300 },
  radioDot: { width: 6, height: 6, borderRadius: 9999, backgroundColor: colors.white },
  solid: { width: '100%', height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  danger: { marginTop: 40, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.ink100 },
  deleteRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8, borderRadius: 14 },
  warnBox: { borderRadius: 14, borderWidth: 1, borderColor: colors.rose200, backgroundColor: 'rgba(255,241,242,0.5)', padding: 16, marginBottom: 16 },
  legal: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 14, backgroundColor: colors.ink50, marginBottom: 8 },
  mt4: { marginTop: 4 },
  mt24: { marginTop: 24 },
  mb16: { marginBottom: 16 },
  mb24: { marginBottom: 24 },
  p16: { padding: 16 },
  noResults: { paddingVertical: 48, alignItems: 'center' },
  faqCard: { padding: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.ink200 },
  topic: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.ink200, flexDirection: 'row', alignItems: 'center', gap: 12 },
  topicIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.brand50, alignItems: 'center', justifyContent: 'center' },
  stillHelp: { width: '100%', marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.brand200, backgroundColor: colors.brand50 },
  headset: { width: 40, height: 40, borderRadius: 9999, backgroundColor: colors.brand600, alignItems: 'center', justifyContent: 'center' },
  accordion: { borderWidth: 1, borderColor: colors.ink200, borderRadius: 14, overflow: 'hidden' },
  accDivider: { borderTopWidth: 1, borderTopColor: colors.ink200 },
  accHead: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: 14 },
  accBody: { paddingHorizontal: 14, paddingBottom: 14 },
  option: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.ink200 },
  optIcon: { width: 44, height: 44, borderRadius: 9999, alignItems: 'center', justifyContent: 'center' },
  callback: { borderRadius: 14, borderWidth: 1, borderColor: colors.ink200, padding: 16 },
  sent: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14, backgroundColor: colors.emerald50 },
  slot: { height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  callCard: { borderRadius: 14, borderWidth: 1, borderColor: colors.ink200, padding: 20, alignItems: 'center', marginBottom: 16 },
  callIcon: { width: 64, height: 64, borderRadius: 9999, backgroundColor: colors.brand50, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  tapCall: { height: 44, paddingHorizontal: 24, marginTop: 16, borderRadius: 12, backgroundColor: colors.brand600, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  hours: { borderRadius: 14, backgroundColor: colors.ink50, padding: 14 },
  closed: { marginTop: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.amber200, backgroundColor: colors.amber50, padding: 16, alignItems: 'center' },
  selfCenter: { alignSelf: 'center' },
  aboutBody: { paddingHorizontal: 16, paddingBottom: 24 },
  appInfo: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderRadius: 14, backgroundColor: colors.brand50, borderWidth: 1, borderColor: colors.brand200, marginBottom: 24 },
  logo: { width: 64, height: 64, borderRadius: 16, backgroundColor: colors.brand600, alignItems: 'center', justifyContent: 'center' },
  howRow: { flexDirection: 'row', gap: 12 },
  howNum: { width: 32, height: 32, borderRadius: 9999, backgroundColor: colors.brand600, alignItems: 'center', justifyContent: 'center' },
  contactBox: { borderRadius: 14, borderWidth: 1, borderColor: colors.ink200, overflow: 'hidden' },
  contactRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  contactSupport: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderTopWidth: 1, borderTopColor: colors.ink100 },
  linkRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.ink200 },
  footerNote: { marginTop: 24, padding: 16, borderRadius: 14, backgroundColor: colors.ink50 },
});
