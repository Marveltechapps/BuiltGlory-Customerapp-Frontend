import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Btn } from '../../components/Btn';
import { Field, Input } from '../../components/Form';
import { Icon } from '../../components/Icon';
import { LogoMark } from '../../components/LogoMark';
import { Accordion } from '../../components/Interactive';
import { Grid } from '../../components/Layout';
import { Fade } from '../../components/Motion';
import { Press } from '../../components/Press';
import { Screen } from '../../components/Screen';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { StatusMark } from '../../components/StatusMark';
import { T } from '../../components/T';
import { FAQ_TOPICS } from '../../config/catalog';
import { APP_VERSION, useAppConfig } from '../../context/AppConfigContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNow, useResource } from '../../lib/useResource';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { getContent } from '../../services/content.service';
import type { ContentItem } from '../../types/content';
import { palette, tw } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { callPhone, sendEmail } from '../../utils/links';
import { submitCallback, useFaqs, type CallbackSlot } from '../home/HelpScreen';

/** FAQ items whose category (or tag) matches a topic id or label. */
function inTopic(f: ContentItem, topic: { id: string; label: string }) {
  const keys = [f.category, ...(f.tags ?? [])]
    .filter(Boolean)
    .map(k => String(k).toLowerCase());
  return keys.includes(topic.id) || keys.includes(topic.label.toLowerCase());
}

/** A-05 Help & FAQs (published content, section "faq"). */
export function HelpFaqsScreen() {
  const nav = useNav();
  const faqs = useFaqs();
  const [q, setQ] = useState('');
  const all = faqs.data ?? [];
  const results = q.trim()
    ? all.filter(f =>
        `${f.title} ${f.body} ${f.excerpt ?? ''}`
          .toLowerCase()
          .includes(q.trim().toLowerCase()),
      )
    : [];

  return (
    <Screen topBar={{ title: 'Help & FAQs', back: true }}>
      <View style={styles.px4}>
        <Input
          icon="search"
          placeholder="Search help articles"
          value={q}
          onChangeText={setQ}
          containerStyle={styles.mb4}
          returnKeyType="search"
        />
        {faqs.loading ? (
          <LoadingState />
        ) : faqs.error ? (
          <ErrorState message={faqs.error} onRetry={faqs.reload} />
        ) : q.trim() ? (
          <Fade>
            <View style={styles.stack}>
              <T style={styles.count}>
                {results.length} {results.length === 1 ? 'result' : 'results'}
              </T>
              {results.length === 0 ? (
                <View style={styles.none}>
                  <Icon name="search-x" size={36} color="#CBD5E1" />
                  <T style={styles.noneText}>No articles found</T>
                </View>
              ) : (
                results.map(f => (
                  <View key={f._id} style={styles.result}>
                    <T style={styles.resultQ}>{f.title}</T>
                    <T style={styles.resultA}>{f.body || f.excerpt}</T>
                  </View>
                ))
              )}
            </View>
          </Fade>
        ) : (
          <>
            <Grid cols={2} gap={10}>
              {FAQ_TOPICS.map(t => {
                const n = all.filter(f => inTopic(f, t)).length;
                return (
                  <Press
                    key={t.id}
                    onPress={() => nav.go('faqTopic', { topicId: t.id })}
                    style={styles.topic}
                  >
                    <View style={styles.topicIcon}>
                      <Icon name={t.icon} size={18} color="#1A6FFF" />
                    </View>
                    <View style={styles.flex}>
                      <T style={styles.topicLabel} numberOfLines={1}>
                        {t.label}
                      </T>
                      <T style={styles.topicCount}>
                        {n} {n === 1 ? 'article' : 'articles'}
                      </T>
                    </View>
                  </Press>
                );
              })}
            </Grid>
            <Press
              onPress={() => nav.go('customerSupport')}
              pressScale={0.99}
              style={styles.still}
            >
              <View style={styles.stillIcon}>
                <Icon name="headphones" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.flex}>
                <T style={styles.stillTitle}>Still need help?</T>
                <T style={styles.stillSub}>Contact customer support</T>
              </View>
              <Icon name="chevron-right" size={16} color="#1A6FFF" />
            </Press>
          </>
        )}
      </View>
    </Screen>
  );
}

/** A-06 FAQ topic. */
export function FaqTopicScreen({ params }: ScreenProps<'faqTopic'>) {
  const topic = FAQ_TOPICS.find(t => t.id === params.topicId) ?? FAQ_TOPICS[0];
  const faqs = useFaqs();
  const items = useMemo(
    () => (faqs.data ?? []).filter(f => inTopic(f, topic)),
    [faqs.data, topic],
  );
  const [open, setOpen] = useState<Set<number>>(new Set([0]));
  const toggle = (i: number) =>
    setOpen(s => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  return (
    <Screen
      topBar={{
        title: topic.label,
        sub: 'Frequently asked questions',
        back: true,
      }}
      refreshing={faqs.refreshing}
      onRefresh={faqs.refresh}
    >
      <View style={styles.px4}>
        {faqs.loading ? (
          <LoadingState />
        ) : faqs.error ? (
          <ErrorState message={faqs.error} onRetry={faqs.reload} />
        ) : items.length === 0 ? (
          <EmptyState
            icon="circle-help"
            title="No articles yet"
            body="We're adding answers for this topic. Contact support if you need help now."
          />
        ) : (
          <Accordion
            items={items.map(f => ({
              q: f.title,
              a: f.body || f.excerpt || '',
            }))}
            openSet={open}
            onToggle={toggle}
          />
        )}
      </View>
    </Screen>
  );
}

const SLOTS: Array<[CallbackSlot, string]> = [
  ['morning', 'Morning'],
  ['afternoon', 'Afternoon'],
  ['evening', 'Evening'],
];

/** A-07 Customer support: callback (POST /callbacks), email, call. */
export function CustomerSupportScreen() {
  const nav = useNav();
  const toast = useToast();
  const { user, isSignedIn } = useAuth();
  const { supportEmail } = useAppConfig();
  const [form, setForm] = useState({
    name: user?.name ?? '',
    phone: (user?.mobileNumber ?? '').slice(-10),
    slot: '' as CallbackSlot | '',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = async () => {
    if (!form.slot) return;
    if (!isSignedIn) {
      nav.signIn(null);
      return;
    }
    setSending(true);
    setError(null);
    try {
      await submitCallback({
        name: form.name,
        phone: form.phone,
        slot: form.slot,
        source: 'profile_support',
        sourceScreen: 'customer_support',
      });
      setSent(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen topBar={{ title: 'Customer Support', back: true }}>
      <View style={styles.px4}>
        <Press
          onPress={() =>
            toast.show(
              'Live chat coming soon. Try callback or email for now.',
              'warn',
            )
          }
          pressScale={0.99}
          style={[styles.option, styles.mb3]}
        >
          <View style={styles.flex}>
            <T style={styles.optTitle}>Live Chat</T>
            <T style={styles.optSub}>Typically replies in &lt; 2 hours</T>
          </View>
          <Icon name="chevron-right" size={16} color="#94A3B8" />
        </Press>
        <View style={[styles.callback, styles.mb3]}>
          <T style={[styles.optTitle, styles.mb3]}>Request a Callback</T>
          {sent ? (
            <Fade>
              <View style={styles.sent}>
                <StatusMark kind="success" size={18} />
                <T style={styles.sentText}>
                  We'll call you in your chosen slot.
                </T>
              </View>
            </Fade>
          ) : (
            <View style={styles.stack}>
              <Field label="Name">
                <Input
                  icon="user"
                  value={form.name}
                  onChangeText={v => setForm(f => ({ ...f, name: v }))}
                  maxLength={120}
                />
              </Field>
              <Field label="Phone">
                <Input
                  icon="phone"
                  prefix="+91"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={form.phone}
                  onChangeText={v =>
                    setForm(f => ({ ...f, phone: v.replace(/\D/g, '') }))
                  }
                />
              </Field>
              <Field label="Preferred time slot">
                <Grid cols={3} gap={8}>
                  {SLOTS.map(([id, label]) => (
                    <Press
                      key={id}
                      onPress={() => setForm(f => ({ ...f, slot: id }))}
                      style={[
                        styles.slot,
                        form.slot === id ? styles.slotOn : styles.slotOff,
                      ]}
                    >
                      <T
                        style={[
                          styles.slotText,
                          {
                            color:
                              form.slot === id ? '#FFFFFF' : palette.ink[700],
                          },
                        ]}
                      >
                        {label}
                      </T>
                    </Press>
                  ))}
                </Grid>
              </Field>
              {error && <T style={styles.error}>{error}</T>}
              <Btn
                style={styles.full}
                disabled={!form.slot || form.phone.length !== 10}
                loading={sending}
                onPress={request}
              >
                Request Callback
              </Btn>
            </View>
          )}
        </View>
        <Press
          disabled={!supportEmail}
          onPress={() => supportEmail && sendEmail(supportEmail)}
          pressScale={0.99}
          style={[styles.option, styles.mb3]}
        >
          <View style={styles.optIcon}>
            <Icon name="mail" size={20} color="#1A6FFF" />
          </View>
          <View style={styles.flex}>
            <T style={styles.optTitle}>Email Support</T>
            <T style={styles.optSub}>Reply within &lt; 24 hours</T>
          </View>
          <Icon name="chevron-right" size={16} color="#94A3B8" />
        </Press>
        <Press
          onPress={() => nav.go('callUs')}
          pressScale={0.99}
          style={styles.option}
        >
          <View style={[styles.optIcon, styles.optIconInk]}>
            <Icon name="phone-call" size={20} color="#334155" />
          </View>
          <View style={styles.flex}>
            <T style={styles.optTitle}>Call Us</T>
            <T style={styles.optSub}>Speak to an advisor</T>
          </View>
          <Icon name="chevron-right" size={16} color="#94A3B8" />
        </Press>
      </View>
    </Screen>
  );
}

/** Mon–Sat 9:00–19:00 in India (IST, UTC+5:30). */
function officeOpen(now: number) {
  const ist = new Date(
    now + (5.5 * 60 + new Date(now).getTimezoneOffset()) * 60000,
  );
  const minutes = ist.getHours() * 60 + ist.getMinutes();
  return ist.getDay() !== 0 && minutes >= 9 * 60 && minutes < 19 * 60;
}

/** A-07a Call us (support phone from GET /app/config). */
export function CallUsScreen() {
  const nav = useNav();
  const { supportPhone } = useAppConfig();
  const now = useNow(60000);
  const open = officeOpen(now);
  return (
    <Screen topBar={{ title: 'Call Us', back: true }}>
      <View style={styles.px4}>
        <View style={styles.callCard}>
          <View style={styles.callIcon}>
            <Icon name="phone-call" size={28} color="#1A6FFF" />
          </View>
          <Press
            disabled={!supportPhone}
            onPress={() => supportPhone && callPhone(supportPhone)}
            pressScale={1}
          >
            <T style={styles.number}>{supportPhone ?? 'Unavailable'}</T>
          </Press>
          <T style={styles.care}>Builtglory Customer Care</T>
          <Press
            disabled={!supportPhone}
            onPress={() => supportPhone && callPhone(supportPhone)}
            style={[styles.callBtn, !supportPhone && styles.dim]}
          >
            <Icon name="phone" size={16} color="#FFFFFF" />
            <T style={styles.callBtnText}>Tap to Call</T>
          </Press>
        </View>
        <View style={styles.hours}>
          <T style={styles.hoursLabel}>Office hours</T>
          <T style={styles.hoursValue}>Mon–Sat · 9:00 AM – 7:00 PM IST</T>
        </View>
        {!open && (
          <View style={styles.closed}>
            <Icon name="moon" size={22} color="#D97706" />
            <T style={styles.closedTitle}>We are currently closed.</T>
            <T style={styles.closedSub}>
              Leave your number and we'll call you back.
            </T>
            <Btn
              variant="outline"
              size="sm"
              style={styles.selfCenter}
              onPress={() => nav.go('customerSupport')}
            >
              Request Callback
            </Btn>
          </View>
        )}
      </View>
    </Screen>
  );
}

const HOW = [
  {
    num: '1',
    title: 'Seller Lists',
    desc: 'Property owners submit listings with verified documents and photos.',
  },
  {
    num: '2',
    title: 'Valuation & Buyer Match',
    desc: 'AI evaluates properties and connects verified buyers through our platform.',
  },
  {
    num: '3',
    title: 'Safe Transaction',
    desc: 'Escrow payments, legal verification, and registration assistance ensure a smooth sale.',
  },
];

/** A-08 About us (mission text from GET /content/about-builtglory; contact details from app config). */
export function AboutUsScreen() {
  const nav = useNav();
  const { supportEmail, supportPhone } = useAppConfig();
  const about = useResource(
    signal => getContent('about-builtglory', signal),
    [],
  );
  const office = about.data?.metadata?.registeredOffice as string | undefined;
  const paragraphs = (about.data?.body ?? '').split(/\n{2,}/).filter(Boolean);
  const link = (label: string, slug?: string) => (
    <Press
      key={label}
      onPress={() => nav.go('termsOfUse', slug ? { slug } : undefined)}
      pressScale={0.99}
      pressedStyle={styles.pressed}
      style={styles.linkRow}
    >
      <T style={styles.linkText}>{label}</T>
      <Icon name="chevron-right" size={16} color="#94A3B8" />
    </Press>
  );

  return (
    <Screen
      topBar={{ title: 'About Us', sub: 'Learn about Builtglory', back: true }}
    >
      <View style={[styles.px4, styles.pb6]}>
        <View style={styles.app}>
          <LogoMark size={64} style={styles.appLogo} />
          <View>
            <T style={styles.appName}>BUILTGLORY</T>
            <T style={styles.appVersion}>Version {APP_VERSION}</T>
            <T style={styles.appCopy}>
              © {new Date().getFullYear()} Builtglory · All rights reserved
            </T>
          </View>
        </View>
        <View style={styles.mb6}>
          <T style={styles.h2}>Our Mission</T>
          {about.loading ? (
            <LoadingState />
          ) : about.error ? (
            <ErrorState compact message={about.error} onRetry={about.reload} />
          ) : (
            paragraphs.map((p, i) => (
              <T key={i} style={[styles.para, i > 0 && styles.mt2]}>
                {p}
              </T>
            ))
          )}
        </View>
        <View style={styles.mb6}>
          <T style={[styles.h2, styles.mb3]}>How Builtglory Works</T>
          <View style={styles.stack}>
            {HOW.map(s => (
              <View key={s.num} style={styles.how}>
                <View style={styles.howNum}>
                  <T style={styles.howNumText}>{s.num}</T>
                </View>
                <View style={styles.flex}>
                  <T style={styles.howTitle}>{s.title}</T>
                  <T style={styles.howDesc}>{s.desc}</T>
                </View>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.contactBox}>
          <View style={styles.contactInner}>
            <T style={styles.contactTitle}>Contact Information</T>
            {office ? (
              <View style={styles.contactRow}>
                <Icon
                  name="map-pin"
                  size={14}
                  color="#1A6FFF"
                  style={styles.mt1}
                />
                <View>
                  <T style={styles.contactKey}>Registered Office</T>
                  <T style={styles.contactVal}>{office}</T>
                </View>
              </View>
            ) : null}
            {supportEmail ? (
              <Press
                onPress={() => sendEmail(supportEmail)}
                pressScale={1}
                style={styles.contactRow}
              >
                <Icon
                  name="mail"
                  size={14}
                  color="#1A6FFF"
                  style={styles.mt1}
                />
                <View>
                  <T style={styles.contactKey}>Email</T>
                  <T style={styles.contactLink}>{supportEmail}</T>
                </View>
              </Press>
            ) : null}
            {supportPhone ? (
              <Press
                onPress={() => callPhone(supportPhone)}
                pressScale={1}
                style={styles.contactRow}
              >
                <Icon
                  name="phone"
                  size={14}
                  color="#1A6FFF"
                  style={styles.mt1}
                />
                <View>
                  <T style={styles.contactKey}>Phone</T>
                  <T style={styles.contactLink}>{supportPhone}</T>
                </View>
              </Press>
            ) : null}
          </View>
          <Press
            onPress={() => nav.go('help')}
            pressScale={1}
            pressedStyle={styles.pressed}
            style={styles.supportRow}
          >
            <T style={styles.linkText}>Contact Support</T>
            <Icon name="chevron-right" size={16} color="#94A3B8" />
          </Press>
        </View>
        <View style={[styles.mt6, styles.stack8]}>
          {link('Terms of Use')}
          {link('Privacy Policy', 'privacy-policy')}
          {link('Community Guidelines', 'community-guidelines')}
        </View>
        <View style={styles.footer}>
          <T style={styles.footerSmall}>Made with ❤️ in India</T>
          <T style={styles.footerText}>
            Simplifying real estate, one transaction at a time
          </T>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  selfCenter: tw('self-center'),
  flex: tw('flex-1 min-w-0'),
  full: tw('w-full'),
  px4: tw('px-4'),
  pb6: tw('pb-6'),
  mb3: tw('mb-3'),
  mb4: tw('mb-4'),
  mb6: tw('mb-6'),
  mt1: { marginTop: 4 },
  mt2: tw('mt-2'),
  mt6: tw('mt-6'),
  stack: { gap: 12 },
  stack8: { gap: 8 },
  count: tw('text-[11px] text-ink-500'),
  none: tw('py-12 items-center'),
  noneText: tw('mt-2 text-[13px] text-ink-400'),
  result: tw('p-3 rounded-card border border-ink-200'),
  resultQ: tw('text-[13px] font-semibold'),
  resultA: tw('text-[12px] text-ink-500 mt-1 leading-relaxed'),
  topic: tw('p-3.5 rounded-card border border-ink-200 flex items-center gap-3'),
  topicIcon: tw(
    'w-10 h-10 rounded-xl bg-brand-50 items-center justify-center shrink-0',
  ),
  topicLabel: tw('text-[13px] font-semibold'),
  topicCount: tw('text-[10.5px] text-ink-500'),
  still: tw(
    'w-full mt-4 flex items-center gap-3 p-4 rounded-card border border-brand-200 bg-brand-50',
  ),
  stillIcon: tw(
    'w-10 h-10 rounded-full bg-brand-600 items-center justify-center shrink-0',
  ),
  stillTitle: tw('text-[14px] font-semibold text-brand-700'),
  stillSub: tw('text-[11.5px] text-brand-600'),
  option: tw(
    'w-full flex items-center gap-3 p-4 rounded-card border border-ink-200',
  ),
  optTitle: tw('text-[14px] font-semibold'),
  optSub: tw('text-[11.5px] text-ink-500'),
  optIcon: tw('w-11 h-11 rounded-full bg-brand-50 items-center justify-center'),
  optIconInk: tw('bg-ink-100'),
  callback: tw('rounded-card border border-ink-200 p-4'),
  sent: tw('flex items-center gap-2 p-3 rounded-card bg-emerald-50'),
  sentText: tw('flex-1 text-[13px] text-emerald-700'),
  slot: tw('h-10 rounded-card items-center justify-center'),
  slotOn: tw('bg-brand-600'),
  slotOff: tw('bg-ink-100'),
  slotText: tw('text-[12px] font-medium'),
  error: tw('text-[12px] text-rose-600'),
  callCard: tw('rounded-card border border-ink-200 p-5 items-center mb-4'),
  callIcon: tw(
    'w-16 h-16 rounded-full bg-brand-50 items-center justify-center mb-3',
  ),
  number: tw('text-[22px] font-bold text-brand-600'),
  care: tw('text-[12px] text-ink-500 mt-1'),
  callBtn: tw(
    'flex items-center justify-center gap-2 h-11 px-6 mt-4 rounded-xl bg-brand-600',
  ),
  callBtnText: tw('text-white font-semibold text-[14px]'),
  dim: { opacity: 0.5 },
  hours: tw('rounded-card bg-ink-50 p-3.5 items-center'),
  hoursLabel: tw('text-[12px] text-ink-500'),
  hoursValue: tw('text-[13px] font-semibold text-ink-900 mt-0.5'),
  closed: {
    ...tw(
      'mt-4 rounded-card border border-amber-200 bg-amber-50 p-4 items-center',
    ),
    gap: 4,
  },
  closedTitle: tw('text-[13px] font-semibold text-amber-800 mt-1'),
  closedSub: tw('text-[11.5px] text-amber-700 mb-2 text-center'),
  app: tw(
    'flex items-center gap-4 p-4 rounded-card bg-brand-50 border border-brand-200 mb-6',
  ),
  appLogo: { borderRadius: 16 },
  appName: tw('text-[16px] font-bold text-ink-900'),
  appVersion: tw('text-[12px]'),
  appCopy: tw('text-[11px] text-ink-500'),
  h2: tw('text-[16px] font-bold text-ink-900 mb-2'),
  para: tw('text-[13px] leading-relaxed'),
  how: tw('flex gap-3'),
  howNum: tw(
    'w-8 h-8 rounded-full bg-brand-600 items-center justify-center shrink-0',
  ),
  howNumText: tw('text-white font-bold text-[13px]'),
  howTitle: tw('text-[13px] font-semibold text-ink-900'),
  howDesc: tw('text-[12px] mt-0.5'),
  contactBox: tw('rounded-card border border-ink-200'),
  contactInner: { ...tw('p-4'), gap: 8 },
  contactTitle: tw('text-[13px] font-bold text-ink-900'),
  contactRow: tw('flex items-start gap-2'),
  contactKey: tw('text-[12px] font-medium text-ink-700'),
  contactVal: tw('text-[12px]'),
  contactLink: tw('text-[12px] text-brand-600 font-medium'),
  supportRow: tw(
    'w-full flex items-center justify-between p-4 border-t border-ink-100',
  ),
  pressed: tw('bg-ink-50'),
  linkRow: tw(
    'w-full flex items-center justify-between p-3 rounded-card border border-ink-200',
  ),
  linkText: tw('text-[13px] font-semibold text-ink-900'),
  footer: tw('mt-6 p-4 rounded-card bg-ink-50 items-center'),
  footerSmall: tw('text-[10px] text-ink-500 mb-2'),
  footerText: tw('text-[11px] text-ink-700 font-medium'),
});
