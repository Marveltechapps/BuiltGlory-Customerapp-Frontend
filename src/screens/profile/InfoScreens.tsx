import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { StatusMark } from '../../components/hero/StatusMark';
import { Icon } from '../../components/icons/Icon';
import { Grid } from '../../components/layout/Grid';
import { Screen, TopBar } from '../../components/layout/Screen';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { Badge, type BadgeColor } from '../../components/ui/Badge';
import { Btn } from '../../components/ui/Btn';
import { FadeIn } from '../../components/ui/Motion';
import { buzz, Press } from '../../components/ui/Press';
import { T } from '../../components/ui/T';
import { FAQS } from '../../config/sampleData';
import type { ScreenName, ScreenProps } from '../../navigation/types';
import * as content from '../../services/content.service';
import * as feedbackService from '../../services/feedback.service';
import { colors, elev, type } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';

type OfferCard = { id: string; icon: string; title: string; sub: string; color: string; tag: string; body?: string };

/** Offers & deals — GET /content?section=general&category=offers */
export function OffersScreen({ back }: ScreenProps) {
  const [offers, setOffers] = useState<OfferCard[]>([]);
  const [claimed, setClaimed] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    content.listContent({ section: 'general', category: 'offers', limit: 50 })
      .then(res => {
        if (cancelled) return;
        const items = (res.items || []).map(item => {
          const meta = (item.metadata || {}) as { icon?: string; tag?: string; color?: string };
          return {
            id: item._id || item.slug,
            icon: meta.icon || 'gift',
            title: item.title,
            sub: item.excerpt || '',
            color: meta.color || '#1A6FFF',
            tag: meta.tag || item.category || 'Offer',
            body: item.body,
          };
        });
        setOffers(items);
      })
      .catch(e => {
        if (!cancelled) {
          setOffers([]);
          setErr(errorMessage(e));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <Screen>
      <TopBar onBack={back} title="Offers & Deals" sub="Exclusive to Builtglory members" />
      <View style={styles.list}>
        {loading ? (
          <T s={13} c={colors.ink500} align="center">Loading offers…</T>
        ) : offers.length ? (
          offers.map(o => (
            <View key={o.id} style={styles.offer}>
              <View style={[styles.offerIcon, { backgroundColor: o.color + '18' }]}><Icon name={o.icon} size={22} color={o.color} /></View>
              <View style={styles.flex1}>
                <View style={styles.offerTitle}>
                  <T s={14} w={600}>{o.title}</T>
                  <View style={[styles.tag, { backgroundColor: o.color + '18' }]}><T s={10} w={700} c={o.color}>{o.tag}</T></View>
                </View>
                <T s={12} c={colors.ink500}>{o.sub || o.body || ''}</T>
                <Press onPress={() => { buzz(); setClaimed(c => c.includes(o.id) ? c : [...c, o.id]); }} style={styles.claim}>
                  <T s={12} w={700} c={colors.brand600}>{claimed.includes(o.id) ? 'Saved' : 'View offer'}</T>
                  <Icon name={claimed.includes(o.id) ? 'check' : 'arrow-right'} size={12} color={colors.brand600} />
                </Press>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.soon}>
            <Icon name="gift" size={28} color="#94A3B8" style={styles.mb8} />
            <T s={13} w={500} c={colors.ink700} align="center">No offers available right now</T>
            <T s={11} c={colors.ink500} align="center" style={styles.mt4}>Check back later or enable notifications for new deals</T>
          </View>
        )}
        {err ? <T s={12} c={colors.rose600} align="center" style={styles.mt4}>{err}</T> : null}
      </View>
    </Screen>
  );
}

const CAT_COLOR: Record<string, BadgeColor> = { 'Market Update': 'brand', Investment: 'green', Policy: 'amber', Trends: 'rose', News: 'brand' };

/** News & insights — GET /content?section=news */
export function NewsInsightsScreen({ back, go }: ScreenProps) {
  const [articles, setArticles] = useState<Array<{ id: string; cat: string; title: string; time: string; read: string; body?: string; slug?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    content.listContent({ section: 'news', limit: 30 })
      .then(res => {
        if (cancelled) return;
        setArticles((res.items || []).map(item => {
          const meta = (item.metadata || {}) as { publishedAt?: string; readMinutes?: number };
          return {
            id: item._id || item.slug,
            cat: item.category || 'News',
            title: item.title,
            time: typeof meta.publishedAt === 'string' ? new Date(meta.publishedAt).toLocaleDateString() : '',
            read: typeof meta.readMinutes === 'number' ? `${meta.readMinutes} min` : '',
            body: item.body || item.excerpt || '',
            slug: item.slug,
          };
        }));
      })
      .catch(e => { if (!cancelled) setErr(errorMessage(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <Screen>
      <TopBar onBack={back} title="News & Insights" sub="Real estate market updates" />
      <View style={styles.list}>
        {loading ? <T s={13} c={colors.ink500}>Loading news…</T> : null}
        {err ? <T s={12} c={colors.rose600}>{err}</T> : null}
        {!loading && !articles.length && !err ? <T s={13} c={colors.ink500}>No news articles yet.</T> : null}
        {articles.map(a => (
          <View key={a.id} style={styles.article}>
            <PhotoPlaceholder tag={'news-' + a.id} height={120}>
              <View style={styles.tl8}><Badge color={CAT_COLOR[a.cat] || 'brand'}>{a.cat}</Badge></View>
            </PhotoPlaceholder>
            <View style={styles.p12}>
              <T display s={14} w={600} lh={1.375} style={styles.mb8}>{a.title}</T>
              <View style={styles.meta}>
                {a.time ? <View style={styles.inline4}><Icon name="clock" size={11} color={colors.ink500} /><T s={11} c={colors.ink500}>{a.time}</T></View> : null}
                {a.read ? <View style={styles.inline4}><Icon name="book-open" size={11} color={colors.ink500} /><T s={11} c={colors.ink500}>{a.read} read</T></View> : null}
                <Press onPress={() => go('generalInfo', { slug: a.slug, title: a.title, body: a.body })} style={styles.mlAuto}><T s={11} w={700} c={colors.brand600}>Read →</T></Press>
              </View>
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const SECTIONS: { icon: string; title: string; sub: string; target?: ScreenName }[] = [
  { icon: 'building-2', title: 'About Builtglory', sub: "India's verified real estate marketplace" },
  { icon: 'shield', title: 'Privacy Policy', sub: 'How we use and protect your data' },
  { icon: 'file-text', title: 'Terms of Service', sub: 'User agreement and marketplace rules', target: 'termsOfUse' },
  { icon: 'help-circle', title: 'App Permissions', sub: 'Camera, location, notifications' },
  { icon: 'star', title: 'Rate the App', sub: 'Share your experience on the App Store' },
  { icon: 'share-2', title: 'Share Builtglory', sub: 'Invite friends and earn referral credits' },
];

/** General info */
export function GeneralInfoScreen({ back, go }: ScreenProps) {
  return (
    <Screen>
      <TopBar onBack={back} title="General Info" sub="About Builtglory" />
      <View style={styles.px4}>
        <View style={styles.version}>
          <View style={styles.logo}><T s={20} w={900} c="#FFFFFF">B</T></View>
          <View>
            <T s={15} w={700}>BUILTGLORY</T>
            <T s={11} c={colors.ink500}>Version 1.0.0 · India</T>
          </View>
        </View>
        <View style={styles.group}>
          {SECTIONS.map((s, i) => (
            <Pressable key={s.title} onPress={() => s.target && go(s.target)} style={({ pressed }) => [styles.row, i > 0 && styles.divider, pressed && { backgroundColor: colors.ink50 }]}>
              <View style={styles.rowIcon}><Icon name={s.icon} size={18} color="#64748B" /></View>
              <View style={styles.flex1}>
                <T s={14} w={600}>{s.title}</T>
                <T s={11.5} c={colors.ink500}>{s.sub}</T>
              </View>
              <Icon name="chevron-right" size={16} color="#94A3B8" />
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}

/** Help & feedback (profile entry) */
export function HelpFeedbackScreen({ back, go }: ScreenProps) {
  const [open, setOpen] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [focus, setFocus] = useState(false);
  const [faqs, setFaqs] = useState<{ q: string; a: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    content.listContent({ section: 'faq', limit: 20 })
      .then(res => {
        if (!cancelled) {
          const fromApi = res.items.map(i => ({ q: i.title, a: i.body || i.excerpt || '' })).filter(f => f.q);
          setFaqs(fromApi.length ? fromApi : FAQS.map(f => ({ q: f.q, a: f.a })));
        }
      })
      .catch(() => {
        if (!cancelled) setFaqs(FAQS.map(f => ({ q: f.q, a: f.a })));
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <Screen>
      <TopBar onBack={back} title="Help & Feedback" sub="We're here 24×7" />
      <View style={styles.helpBody}>
        <Grid cols={3} gap={8}>
          {([['message-circle', 'Live Chat', 'Avg 2 min'], ['phone-call', 'Callback', 'Free'], ['mail', 'Email', '24 hrs']] as [string, string, string][]).map(([icon, label, sub]) => (
            <Press key={label} onPress={() => { buzz(); go('customerSupport'); }} style={styles.channel}>
              <View style={styles.channelIcon}><Icon name={icon} size={18} color="#1A6FFF" /></View>
              <T s={12} w={700} align="center">{label}</T>
              <T s={10} c={colors.ink500} align="center">{sub}</T>
            </Press>
          ))}
        </Grid>
        <View>
          <T display s={14} w={600} style={styles.mb8}>Frequently Asked</T>
          <View style={styles.faq}>
            {(faqs.length ? faqs : []).slice(0, 4).map((f, i) => (
              <View key={i} style={i ? styles.faqDivider : null}>
                <Pressable onPress={() => setOpen(open === i ? null : i)} style={styles.faqQ}>
                  <T s={13} w={500} style={styles.flex1}>{f.q}</T>
                  <Icon name={open === i ? 'chevron-up' : 'chevron-down'} size={16} color="#64748B" />
                </Pressable>
                {open === i && <FadeIn style={styles.faqA}><T s={12.5} c={colors.ink500} lh={1.625}>{f.a}</T></FadeIn>}
              </View>
            ))}
            {!faqs.length ? <View style={styles.faqQ}><T s={12} c={colors.ink500}>No FAQs loaded yet.</T></View> : null}
          </View>
        </View>
        <View>
          <T display s={14} w={600} style={styles.mb8}>Send Feedback</T>
          {submitted ? (
            <FadeIn style={styles.thanks}>
              <View style={styles.mb8}><StatusMark kind="success" size={32} /></View>
              <T s={13} w={600} c={colors.emerald700} align="center">Thanks for your feedback!</T>
            </FadeIn>
          ) : (
            <>
              <TextInput value={feedback} onChangeText={setFeedback} placeholder="Tell us what's on your mind…" placeholderTextColor={colors.ink400} multiline textAlignVertical="top"
                onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} style={[styles.textarea, focus && { borderColor: colors.brand600 }]} />
              {err ? <T s={12} c={colors.rose600} style={styles.mb8}>{err}</T> : null}
              <Btn full disabled={!feedback.trim() || busy} onPress={async () => {
                if (!feedback.trim() || busy) return;
                setBusy(true);
                setErr('');
                try {
                  await feedbackService.submitFeedback({
                    message: feedback.trim(),
                    source: 'help_feedback',
                    sourceScreen: 'helpFeedback',
                  });
                  setSubmitted(true);
                } catch (e) {
                  setErr(errorMessage(e));
                } finally {
                  setBusy(false);
                }
              }}>{busy ? 'Submitting…' : 'Submit Feedback'}</Btn>
            </>
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  px4: { paddingHorizontal: 16 },
  p12: { padding: 12 },
  mt4: { marginTop: 4 },
  mb8: { marginBottom: 8 },
  mlAuto: { marginLeft: 'auto' },
  inline4: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  list: { paddingHorizontal: 16, gap: 12 },
  offer: { borderRadius: 14, borderWidth: 1, borderColor: colors.ink200, padding: 16, flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  offerIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  offerTitle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 9999 },
  claim: { marginTop: 8, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4 },
  soon: { padding: 16, borderRadius: 14, backgroundColor: colors.ink50, borderWidth: 1, borderColor: colors.ink200, alignItems: 'center' },
  article: { borderRadius: 14, borderWidth: 1, borderColor: colors.ink200, overflow: 'hidden', backgroundColor: colors.white },
  tl8: { position: 'absolute', top: 8, left: 8 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  version: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: colors.ink50, borderRadius: 14, marginBottom: 16 },
  logo: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.brand600, alignItems: 'center', justifyContent: 'center' },
  group: { borderRadius: 14, borderWidth: 1, borderColor: colors.ink200 },
  row: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  divider: { borderTopWidth: 1, borderTopColor: colors.ink100 },
  rowIcon: { width: 40, height: 40, borderRadius: 9999, backgroundColor: colors.ink100, alignItems: 'center', justifyContent: 'center' },
  helpBody: { paddingHorizontal: 16, gap: 20 },
  channel: { padding: 12, borderRadius: 16, backgroundColor: colors.white, boxShadow: elev.e1, alignItems: 'center' },
  channelIcon: { width: 40, height: 40, borderRadius: 9999, backgroundColor: colors.brand50, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  faq: { borderWidth: 1, borderColor: colors.ink200, borderRadius: 14, overflow: 'hidden' },
  faqDivider: { borderTopWidth: 1, borderTopColor: colors.ink200 },
  faqQ: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: 14 },
  faqA: { paddingHorizontal: 14, paddingBottom: 14 },
  thanks: { padding: 16, backgroundColor: colors.emerald50, borderRadius: 14, alignItems: 'center' },
  textarea: { width: '100%', padding: 12, borderWidth: 1, borderColor: colors.ink200, borderRadius: 14, minHeight: 90, marginBottom: 12, ...type(14), lineHeight: 20, color: colors.ink900 },
});
