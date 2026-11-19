import React, { useState } from 'react';
import { ScrollView, Share, StyleSheet, View } from 'react-native';
import { Accordion } from '../../components/Interactive';
import { Btn } from '../../components/Btn';
import { Badge, TextArea, type BadgeColor } from '../../components/Form';
import { Icon, type IconName } from '../../components/Icon';
import { LogoMark } from '../../components/LogoMark';
import { ICON_NODES } from '../../components/iconNodes';
import { Grid } from '../../components/Layout';
import { Fade } from '../../components/Motion';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { Press } from '../../components/Press';
import { Screen } from '../../components/Screen';
import { Sheet } from '../../components/Sheet';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { StatusMark } from '../../components/StatusMark';
import { T } from '../../components/T';
import { APP_VERSION } from '../../context/AppConfigContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useResource } from '../../lib/useResource';
import { useNav } from '../../navigation/NavContext';
import type { ScreenName } from '../../navigation/types';
import { listContent } from '../../services/content.service';
import {
  requestCallback,
  submitFeedback,
} from '../../services/support.service';
import type { ContentItem } from '../../types/content';
import { palette, tw, twh } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { timeAgo } from '../../utils/format';
import { buzz } from '../../utils/haptics';
import { openUrl } from '../../utils/links';
import { useFaqs } from '../home/HelpScreen';

const OFFER_COLORS = ['#1A6FFF', '#10B981', '#F59E0B', '#8B5CF6'];
const isIcon = (v: unknown): v is IconName =>
  typeof v === 'string' && v in ICON_NODES;

/** Extras: Offers & deals (published content, section "banner"). Claiming records a callback request. */
export function OffersScreen() {
  const toast = useToast();
  const { isSignedIn } = useAuth();
  const nav = useNav();
  const res = useResource(
    signal => listContent({ section: 'banner', limit: 50 }, signal),
    [],
  );
  const [claimed, setClaimed] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const claim = async (o: ContentItem) => {
    const target = o.cta?.target;
    if (target && /^https?:\/\//.test(target)) {
      openUrl(target);
      return;
    }
    if (!isSignedIn) {
      nav.signIn(null);
      return;
    }
    setBusy(o._id);
    try {
      await requestCallback({
        source: 'profile_support',
        sourceScreen: 'offers',
        category: 'general',
        reason: `Interested in offer: ${o.title}`,
      });
      buzz();
      setClaimed(c => [...c, o._id]);
      toast.show('We will call you about this offer');
    } catch (e) {
      toast.show(errorMessage(e), 'error');
    } finally {
      setBusy(null);
    }
  };

  const offers = res.data ?? [];
  return (
    <Screen
      topBar={{
        title: 'Offers & Deals',
        sub: 'Exclusive to Builtglory members',
        back: true,
      }}
      refreshing={res.refreshing}
      onRefresh={res.refresh}
    >
      <View style={styles.stack}>
        {res.loading ? (
          <LoadingState />
        ) : res.error ? (
          <ErrorState message={res.error} onRetry={res.reload} />
        ) : (
          offers.map((o, i) => {
            const color =
              (o.metadata?.color as string) ||
              OFFER_COLORS[i % OFFER_COLORS.length];
            const icon = isIcon(o.metadata?.icon) ? o.metadata?.icon : 'gift';
            return (
              <View key={o._id} style={styles.offer}>
                <View
                  style={[styles.offerIcon, { backgroundColor: `${color}18` }]}
                >
                  <Icon name={icon} size={22} color={color} />
                </View>
                <View style={styles.flex}>
                  <View style={styles.offerHead}>
                    <T style={styles.offerTitle}>{o.title}</T>
                    {o.category ? (
                      <View
                        style={[styles.tag, { backgroundColor: `${color}18` }]}
                      >
                        <T style={[styles.tagText, { color }]}>{o.category}</T>
                      </View>
                    ) : null}
                  </View>
                  {o.excerpt ? (
                    <T style={styles.offerSub}>{o.excerpt}</T>
                  ) : null}
                  <Press
                    disabled={claimed.includes(o._id) || busy === o._id}
                    onPress={() => claim(o)}
                    style={styles.claim}
                  >
                    <T style={styles.claimText}>
                      {claimed.includes(o._id)
                        ? 'Claimed'
                        : busy === o._id
                        ? 'Claiming…'
                        : o.cta?.label || 'Claim offer'}
                    </T>
                    <Icon
                      name={claimed.includes(o._id) ? 'check' : 'arrow-right'}
                      size={12}
                      color="#1A6FFF"
                    />
                  </Press>
                </View>
              </View>
            );
          })
        )}
        <View style={styles.soon}>
          <Icon name="gift" size={28} color="#94A3B8" />
          <T style={styles.soonTitle}>
            {offers.length ? 'More offers coming soon' : 'No offers right now'}
          </T>
          <T style={styles.soonSub}>
            Enable notifications to be the first to know
          </T>
        </View>
      </View>
    </Screen>
  );
}

const CAT_COLOR: Record<string, BadgeColor> = {
  'Market Update': 'brand',
  Investment: 'green',
  Policy: 'amber',
  Trends: 'rose',
};

/** Extras: News & insights (published content, section "news"). */
export function NewsInsightsScreen() {
  const [article, setArticle] = useState<ContentItem | null>(null);
  const res = useResource(
    signal => listContent({ section: 'news', limit: 50 }, signal),
    [],
  );
  const items = res.data ?? [];
  return (
    <Screen
      topBar={{
        title: 'News & Insights',
        sub: 'Real estate market updates',
        back: true,
      }}
      refreshing={res.refreshing}
      onRefresh={res.refresh}
    >
      <View style={styles.stack}>
        {res.loading ? (
          <LoadingState />
        ) : res.error ? (
          <ErrorState message={res.error} onRetry={res.reload} />
        ) : items.length === 0 ? (
          <EmptyState
            icon="book-open"
            title="No articles yet"
            body="Market updates from the Builtglory team will appear here."
          />
        ) : (
          items.map(a => {
            const minutes = Math.max(
              1,
              Math.round(
                (a.body ?? '').split(/\s+/).filter(Boolean).length / 200,
              ),
            );
            return (
              <Press
                key={a._id}
                pressScale={0.99}
                onPress={() => setArticle(a)}
                style={styles.article}
              >
                <PhotoPlaceholder tag={a._id} src={a.imageUrl} height={120}>
                  {a.category ? (
                    <View style={styles.cat}>
                      <Badge color={CAT_COLOR[a.category] ?? 'brand'}>
                        {a.category}
                      </Badge>
                    </View>
                  ) : null}
                </PhotoPlaceholder>
                <View style={styles.articleBody}>
                  <T style={styles.articleTitle}>{a.title}</T>
                  <View style={styles.articleMeta}>
                    <View style={styles.metaItem}>
                      <Icon name="clock" size={11} color="#64748B" />
                      <T style={styles.metaText}>{timeAgo(a.publishedAt)}</T>
                    </View>
                    <View style={styles.metaItem}>
                      <Icon name="book-open" size={11} color="#64748B" />
                      <T style={styles.metaText}>{minutes} min read</T>
                    </View>
                    <T style={styles.read}>Read →</T>
                  </View>
                </View>
              </Press>
            );
          })
        )}
      </View>
      <Sheet
        visible={!!article}
        onClose={() => setArticle(null)}
        title={article?.title}
      >
        <ScrollView
          style={styles.articleScroll}
          showsVerticalScrollIndicator={false}
        >
          {(article?.body ?? article?.excerpt ?? '')
            .split(/\n{2,}/)
            .filter(Boolean)
            .map((p, i) => (
              <T key={i} style={[styles.articleText, i > 0 && styles.mt3]}>
                {p}
              </T>
            ))}
        </ScrollView>
      </Sheet>
    </Screen>
  );
}

/** Extras: General info. */
export function GeneralInfoScreen() {
  const nav = useNav();
  const toast = useToast();
  const sections: Array<{
    icon: IconName;
    title: string;
    sub: string;
    onPress: () => void;
  }> = [
    {
      icon: 'building-2',
      title: 'About Builtglory',
      sub: "India's verified real estate marketplace",
      onPress: () => nav.go('aboutUs'),
    },
    {
      icon: 'shield',
      title: 'Privacy Policy',
      sub: 'How we use and protect your data',
      onPress: () => nav.go('termsOfUse', { slug: 'privacy-policy' }),
    },
    {
      icon: 'file-text',
      title: 'Terms of Service',
      sub: 'User agreement and marketplace rules',
      onPress: () => nav.go('termsOfUse'),
    },
    {
      icon: 'help-circle',
      title: 'App Permissions',
      sub: 'Camera, location, notifications',
      onPress: () => nav.go('appSettings'),
    },
    {
      icon: 'star',
      title: 'Rate the App',
      sub: 'Share your experience on the App Store',
      onPress: () => nav.go('helpFeedback'),
    },
    {
      icon: 'share-2',
      title: 'Share Builtglory',
      sub: 'Invite friends and earn referral credits',
      onPress: () =>
        Share.share({
          message:
            'Find verified properties on Builtglory: https://builtglory.app',
        }).catch(() => toast.show('Could not open the share sheet', 'error')),
    },
  ];
  return (
    <Screen
      topBar={{ title: 'General Info', sub: 'About Builtglory', back: true }}
    >
      <View style={styles.px4}>
        <View style={styles.version}>
          <View style={styles.logo}>
            <T style={styles.logoText}>B</T>
          </View>
          <View>
            <T style={styles.brand}>BUILTGLORY</T>
            <T style={styles.versionText}>Version {APP_VERSION} · India</T>
          </View>
        </View>
        <View style={styles.menu}>
          {sections.map((s, i) => (
            <Press
              key={s.title}
              onPress={s.onPress}
              pressScale={1}
              pressedStyle={styles.pressed}
              style={[styles.menuRow, i > 0 && styles.divider]}
            >
              <View style={styles.menuIcon}>
                <Icon name={s.icon} size={18} color="#64748B" />
              </View>
              <View style={styles.flex}>
                <T style={styles.menuTitle}>{s.title}</T>
                <T style={styles.menuSub}>{s.sub}</T>
              </View>
              <Icon name="chevron-right" size={16} color="#94A3B8" />
            </Press>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const CONTACT: Array<[IconName, string, string, ScreenName]> = [
  ['message-circle', 'Live Chat', 'Avg 2 min', 'customerSupport'],
  ['phone-call', 'Callback', 'Free', 'customerSupport'],
  ['mail', 'Email', '24 hrs', 'customerSupport'],
];

/** Extras: Help & feedback (FAQs from content; feedback via POST /feedback). */
export function HelpFeedbackScreen() {
  const nav = useNav();
  const { isSignedIn } = useAuth();
  const faqs = useFaqs();
  const [open, setOpen] = useState<Set<number>>(new Set());
  const [feedback, setFeedback] = useState('');
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!isSignedIn) {
      nav.signIn(null);
      return;
    }
    setSending(true);
    setError(null);
    try {
      await submitFeedback({
        message: feedback.trim(),
        sourceScreen: 'help_feedback',
      });
      setSubmitted(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen
      topBar={{ title: 'Help & Feedback', sub: "We're here 24×7", back: true }}
    >
      <View style={styles.sections}>
        <Grid cols={3} gap={8}>
          {CONTACT.map(([icon, label, sub, target]) => (
            <Press
              key={label}
              onPress={() => {
                buzz();
                nav.go(target);
              }}
              style={styles.contact}
            >
              <View style={styles.contactIcon}>
                <Icon name={icon} size={18} color="#1A6FFF" />
              </View>
              <T style={styles.contactLabel}>{label}</T>
              <T style={styles.contactSub}>{sub}</T>
            </Press>
          ))}
        </Grid>
        <View>
          <T style={styles.h3}>Frequently Asked</T>
          {faqs.loading ? (
            <LoadingState />
          ) : faqs.error ? (
            <ErrorState compact message={faqs.error} onRetry={faqs.reload} />
          ) : (
            <Accordion
              items={(faqs.data ?? [])
                .slice(0, 4)
                .map(f => ({ q: f.title, a: f.body || f.excerpt || '' }))}
              openSet={open}
              onToggle={i =>
                setOpen(s => {
                  const next = new Set(s.has(i) ? [] : [i]);
                  return next;
                })
              }
            />
          )}
        </View>
        <View>
          <T style={styles.h3}>Send Feedback</T>
          {submitted ? (
            <Fade>
              <View style={styles.thanks}>
                <StatusMark kind="success" size={32} />
                <T style={styles.thanksText}>Thanks for your feedback!</T>
              </View>
            </Fade>
          ) : (
            <>
              <TextArea
                value={feedback}
                onChangeText={setFeedback}
                placeholder="Tell us what's on your mind…"
                height={90}
                maxLength={5000}
                style={styles.mb3}
              />
              {error && <T style={styles.error}>{error}</T>}
              <Btn
                style={styles.full}
                disabled={!feedback.trim()}
                loading={sending}
                onPress={send}
              >
                Submit Feedback
              </Btn>
            </>
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: tw('flex-1 min-w-0'),
  full: tw('w-full'),
  px4: tw('px-4'),
  stack: { ...tw('px-4'), gap: 12 },
  offer: tw('rounded-card border border-ink-200 p-4 flex gap-4 items-start'),
  offerIcon: tw('w-12 h-12 rounded-xl items-center justify-center shrink-0'),
  offerHead: tw('flex items-center gap-2 mb-0.5 flex-wrap'),
  offerTitle: tw('text-[14px] font-semibold text-ink-900 shrink'),
  tag: tw('px-1.5 py-0.5 rounded-full'),
  tagText: tw('text-[10px] font-bold'),
  offerSub: tw('text-[12px] text-ink-500'),
  claim: tw('mt-2 flex items-center gap-1 self-start'),
  claimText: tw('text-[12px] font-bold text-brand-600'),
  soon: tw('p-4 rounded-card bg-ink-50 border border-ink-200 items-center'),
  soonTitle: tw('text-[13px] font-medium text-ink-700 mt-2'),
  soonSub: tw('text-[11px] text-ink-500 mt-1'),
  article: tw('rounded-card border border-ink-200 overflow-hidden bg-white'),
  cat: tw('absolute top-2 left-2'),
  articleBody: tw('p-3'),
  articleTitle: tw('text-[14px] font-semibold text-ink-900 leading-snug mb-2'),
  articleMeta: tw('flex items-center gap-3'),
  metaItem: tw('flex items-center gap-1'),
  metaText: tw('text-[11px] text-ink-500'),
  read: tw('ml-auto text-[11px] text-brand-600 font-bold'),
  articleScroll: { maxHeight: 460 },
  articleText: tw('text-[13px] text-ink-700 leading-relaxed'),
  logo: { borderRadius: 12 },
  logo: tw('w-12 h-12 rounded-xl bg-brand-600 items-center justify-center'),
  logoText: tw('text-white font-black text-xl'),
  brand: tw('text-[15px] font-bold text-ink-900'),
  versionText: tw('text-[11px] text-ink-500'),
  menu: tw('rounded-card border border-ink-200 overflow-hidden'),
  menuRow: tw('w-full flex items-center gap-3 p-4'),
  divider: tw('border-t border-ink-100'),
  pressed: tw('bg-ink-50'),
  menuIcon: tw(
    'w-10 h-10 rounded-full bg-ink-100 items-center justify-center shrink-0',
  ),
  menuTitle: tw('text-[14px] font-semibold text-ink-900'),
  menuSub: tw('text-[11.5px] text-ink-500'),
  sections: { ...tw('px-4'), gap: 20 },
  contact: {
    ...tw('p-3 rounded-2xl bg-white elev-1 items-center'),
    boxShadow: `0 0 0 1px rgba(226,232,240,0.7), 0 1px 2px rgba(15,23,42,.05), 0 1px 3px rgba(15,23,42,.04)`,
  },
  contactIcon: tw(
    'w-10 h-10 rounded-full bg-brand-50 items-center justify-center mb-2',
  ),
  contactLabel: tw('text-[12px] font-bold'),
  contactSub: tw('text-[10px] text-ink-500'),
  h3: tw('text-[14px] font-semibold mb-2'),
  thanks: tw('p-4 bg-emerald-50 rounded-card items-center gap-2'),
  thanksText: {
    ...twh('text-[13px] font-semibold'),
    color: palette.emerald[700],
  },
  mb3: tw('mb-3'),
  error: tw('text-[12px] text-rose-600 mb-2'),
});
