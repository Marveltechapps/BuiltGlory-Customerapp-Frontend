import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Icon } from '../../components/icons/Icon';
import { AppScreen } from '../../components/layout/AppScreen';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { Badge } from '../../components/ui/Badge';
import { Btn } from '../../components/ui/Btn';
import { Chip } from '../../components/ui/Chip';
import { EmptyState } from '../../components/ui/EmptyState';
import { SwipeAction } from '../../components/ui/Gestures';
import { Stagger } from '../../components/ui/Motion';
import { buzz, Press } from '../../components/ui/Press';
import { T } from '../../components/ui/T';
import { SELL_STEPS, type MyListing } from '../../config/myListings';
import { deleteDraft, getDrafts, setDrafts, type Draft } from '../../context/draftStore';
import { jUpsertListing } from '../../context/journeyStore';
import { sdSet } from '../../context/sellStore';
import type { ScreenName, ScreenProps } from '../../navigation/types';
import * as sellRequests from '../../services/sellRequests.service';
import { colors, elev, ring } from '../../theme';
import { MONTHS } from '../../utils/dates';
import { errorMessage } from '../../utils/errorMessage';
import { formatINR } from '../../utils/format';
import { listingRecordFromSellRequest, mapSellRequestToMyListing } from '../../utils/sellApi';

type Go = (s: ScreenName, ctx?: Record<string, unknown>) => void;

/** "Dec 15, 2026" → days from today (0 if past). */
function daysUntil(s?: string): number {
  const m = String(s || '').match(/^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})$/);
  if (!m) return 0;
  const target = new Date(Number(m[3]), MONTHS.indexOf(m[1]), Number(m[2]));
  return Math.max(0, Math.ceil((target.getTime() - Date.now()) / 86400000));
}

function DraftCard({ d, go, onDelete }: { d: Draft; go: Go; onDelete: () => void }) {
  const total = SELL_STEPS.length;
  const stepIdx = Math.min(Math.max(d.step - 1, 0), total - 1);
  const pct = Math.round((Math.min(d.step, total) / total) * 100);
  const next = SELL_STEPS[stepIdx];
  return (
    <SwipeAction label="Delete" icon="trash-2" action={onDelete}>
      <View style={styles.draft}>
        <View style={styles.row12}>
          <PhotoPlaceholder tag={d.photo || d.id} src={d.photo || undefined} noPhoto={!d.photo} style={styles.thumb72}>
            <View style={[StyleSheet.absoluteFill, styles.wash]} />
            <View style={styles.tl4}><Badge color="ink">Draft</Badge></View>
          </PhotoPlaceholder>
          <View style={styles.flex1}>
            <T s={13.5} w={700} truncate>{d.title}</T>
            <T s={11} c={colors.ink500} style={[styles.mt2, styles.capitalize]}>{d.type}{d.area ? ` · ${d.area} sqft` : ''}{d.price ? ` · ${formatINR(d.price)}` : ''}</T>
            <View style={styles.progressRow}>
              <View style={styles.track}><View style={[styles.fill, { width: `${pct}%` }]} /></View>
              <T num s={10.5} w={700} c={colors.ink500}>{pct}%</T>
            </View>
            <T s={10.5} c={colors.ink400} style={styles.mt4}>Saved {d.updated} · Next: {next[1]}</T>
          </View>
        </View>
        <View style={styles.draftActions}>
          <Press onPress={onDelete} style={styles.deleteBtn}>
            <Icon name="trash-2" size={13} color={colors.ink600} />
            <T s={12} w={700} c={colors.ink600}>Delete</T>
          </Press>
          <Press onPress={() => {
            sdSet({ sellRequestId: d.id, draftId: d.id, type: d.type });
            go(next[0] as ScreenName, { draft: d, type: d.type, sellRequestId: d.id, lid: d.id });
          }} style={styles.continueBtn}>
            <T s={12} w={700} c="#FFFFFF">Continue listing</T>
            <Icon name="arrow-right" size={13} color="white" />
          </Press>
        </View>
      </View>
    </SwipeAction>
  );
}

function DraftList({ go }: { go: Go }) {
  const [list, setList] = useState<Draft[]>(getDrafts());
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const { items } = await sellRequests.listMySellRequests({ status: 'draft', limit: 100, sort: 'newest' });
      const mapped: Draft[] = items.map(sr => {
        const card = mapSellRequestToMyListing(sr);
        const step = Number((sr as { draftStep?: number }).draftStep) || 1;
        return {
          id: sr._id,
          title: card.title,
          type: card.type,
          step,
          photo: card.images[0] || '',
          price: card.price || null,
          area: card.area || null,
          updated: card.date,
        };
      });
      setDrafts(mapped);
      setList(mapped);
    } catch (e) {
      setErr(errorMessage(e));
      setList(getDrafts());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const remove = async (id: string) => {
    try {
      await sellRequests.withdrawSellRequest(id);
    } catch {
      // Still drop from local cache if withdraw fails for a pure draft.
    }
    deleteDraft(id);
    setList(getDrafts());
    buzz();
  };

  if (loading) {
    return <View style={styles.selfCenter}><ActivityIndicator color={colors.brand600} /></View>;
  }
  if (err && list.length === 0) {
    return <EmptyState icon="file-pen" title="Couldn’t load drafts" body={err} action={<Btn style={styles.selfCenter} onPress={() => void load()}>Retry</Btn>} />;
  }
  if (list.length === 0) {
    return (
      <EmptyState icon="file-pen" title="No drafts" body="Listings you save before submitting will appear here."
        action={<Btn icon="plus" style={styles.selfCenter} onPress={() => go('sellType')}>List a property</Btn>} />
    );
  }
  return (
    <Stagger style={styles.gap12} step={50}>
      {list.map(d => <DraftCard key={d.id} d={d} go={go} onDelete={() => void remove(d.id)} />)}
      <T s={11} c={colors.ink400} align="center" style={styles.pt4}>Swipe a draft left to delete it.</T>
    </Stagger>
  );
}

/** P-04c My Drafts */
export function MyDraftsScreen({ go, back, onNav }: ScreenProps) {
  return (
    <AppScreen title="My Drafts" sub="Finish and submit when you're ready" onBack={back} nav="profile" onNav={onNav}>
      <View style={styles.pad}><DraftList go={go} /></View>
    </AppScreen>
  );
}

function ListingSpecs({ p }: { p: MyListing }) {
  const tags = [p.bhk > 0 ? `${p.bhk} BHK` : (p.type || 'Plot'), p.area ? `${p.area} sqft` : null, p.sqftPrice ? `${formatINR(p.sqftPrice)}/sqft` : null].filter(Boolean) as string[];
  return (
    <View style={styles.specs}>
      {tags.map(t => <View key={t} style={styles.spec}><T s={10} w={600} c={colors.ink600} style={styles.capitalize}>{t}</T></View>)}
    </View>
  );
}

function UpcomingListingCard({ p, go }: { p: MyListing; go: Go }) {
  return (
    <Press onPress={() => go('listingDetail', { p, lid: p.id, sellRequestId: p.id, upcoming: true })} style={[styles.card, { boxShadow: ring(colors.amber200) }]}>
      <PhotoPlaceholder tag={p.id} src={p.images?.[0]} noPhoto={!p.images?.[0]} height={130}>
        <View style={styles.tl8}><Badge color="amber" icon="clock">Upcoming</Badge></View>
        <View style={styles.daysBox}>
          <T display num s={17} w={800} lh={1} align="center">{daysUntil(p.launch)}</T>
          <T s={9} w={700} upper ls={0.05} c={colors.ink500} align="center" style={styles.mt2}>days to launch</T>
        </View>
      </PhotoPlaceholder>
      <View style={styles.p12}>
        <T s={14} w={700} truncate>{p.title}</T>
        <View style={[styles.inline4, styles.mt2]}>
          <Icon name="map-pin" size={11} color={colors.ink500} />
          <T s={11.5} c={colors.ink500} truncate style={styles.flex1}>{p.location}, {p.city}</T>
        </View>
        <T num s={16} w={800} c={colors.brand700} style={styles.mt4}>{formatINR(p.price)}</T>
        <ListingSpecs p={p} />
        <View style={styles.facts}>
          {([['Launch', p.launch], ['Notify list', p.notify + ' buyers'], ['Status', p.stage]] as [string, string | undefined][]).map(([k, v]) => (
            <View key={k} style={styles.fact}>
              <T s={9.5} c={colors.ink500}>{k}</T>
              <T s={11} w={700} c={colors.ink800} truncate>{v}</T>
            </View>
          ))}
        </View>
      </View>
    </Press>
  );
}

function SoldListingCard({ p, go }: { p: MyListing; go: Go }) {
  return (
    <Press onPress={() => go('dealComplete', { p, lid: p.id, sellRequestId: p.id })} style={[styles.card, { boxShadow: ring('rgba(226,232,240,0.7)') }]}>
      <View style={styles.soldTop}>
        <PhotoPlaceholder tag={p.id} src={p.images?.[0]} noPhoto={!p.images?.[0]} style={styles.thumb84}>
          <View style={[StyleSheet.absoluteFill, styles.soldOverlay]}>
            <View style={styles.soldStamp}><T s={10} w={900} c="#FFFFFF" ls={0.16}>SOLD OUT</T></View>
          </View>
        </PhotoPlaceholder>
        <View style={styles.flex1}>
          <T s={13.5} w={700} truncate>{p.title}</T>
          <T s={11} c={colors.ink500} truncate>{p.location}, {p.city}</T>
          <T s={11} c={colors.ink500} style={styles.mt4}>
            Sold <T num s={15} w={800} c={colors.emerald700}>{formatINR(p.soldPrice || 0)}</T> · Listed {formatINR(p.price)}
          </T>
          <T s={10.5} c={colors.ink500} style={styles.mt2}>Sold to Builtglory on {p.soldOn}</T>
        </View>
      </View>
      <View style={styles.soldTags}>
        {([['Payment', 'Received'], ['Registration', 'Completed']] as [string, string][]).map(([k, v]) => (
          <View key={k} style={styles.soldTag}>
            <Icon name="check-circle" size={12} color="#059669" />
            <T s={11} w={600} c={colors.emerald700}>{`${k}: ${v}`}</T>
          </View>
        ))}
      </View>
    </Press>
  );
}

function ActiveListingCard({ p, go }: { p: MyListing; go: Go }) {
  return (
    <Press onPress={() => go(p.rejected ? 'rejectedListing' : 'listingDetail', { p, lid: p.id, sellRequestId: p.id })} style={[styles.card, styles.activeCard]}>
      <PhotoPlaceholder tag={p.id} src={p.images?.[0]} noPhoto={!p.images?.[0]} style={styles.thumb84}>
        <View style={styles.tl4}><Badge color={p.status === 'active' ? 'green' : 'rose'}>{p.status === 'active' ? 'Active' : 'Withdrawn'}</Badge></View>
      </PhotoPlaceholder>
      <View style={styles.flex1}>
        <T s={13.5} w={700} truncate>{p.title}</T>
        <T s={11} c={colors.ink500} truncate>{p.location}{p.city ? `, ${p.city}` : ''}</T>
        <T num s={15} w={800} c={colors.brand700} style={styles.mt2}>{formatINR(p.price)}</T>
        <View style={styles.activeMeta}>
          <View style={styles.inline4}><Icon name="eye" size={11} color={colors.ink500} /><T s={10.5} c={colors.ink500}>{p.views}</T></View>
          <View style={styles.inline4}><Icon name="message-circle" size={11} color={colors.ink500} /><T s={10.5} c={colors.ink500}>{p.enquiries}</T></View>
          <T s={10.5} c={colors.ink500} truncate style={styles.flex1}>{p.rejected ? (p.stage || 'Rejected') : p.stage}</T>
        </View>
      </View>
    </Press>
  );
}

/** P-04 My Listings (Active / Upcoming / Drafts / Sold out / Withdrawn) */
export function MyListingsScreen({ go, back, onNav, ctx }: ScreenProps) {
  const [tab, setTab] = useState<string>(ctx?.tab || 'all');
  const [listings, setListings] = useState<MyListing[]>([]);
  const [draftCount, setDraftCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const [allRes, draftRes] = await Promise.all([
        sellRequests.listMySellRequests({ limit: 100, sort: 'newest' }),
        sellRequests.listMySellRequests({ status: 'draft', limit: 100, sort: 'newest' }),
      ]);
      const nonDraft = allRes.items.filter(sr => sr.status !== 'draft');
      const mapped = nonDraft.map(sr => {
        const card = mapSellRequestToMyListing(sr);
        jUpsertListing(listingRecordFromSellRequest(sr));
        return card;
      });
      setListings(mapped);
      setDraftCount(draftRes.items.length);
      setDrafts(draftRes.items.map(sr => {
        const card = mapSellRequestToMyListing(sr);
        return {
          id: sr._id,
          title: card.title,
          type: card.type,
          step: Number((sr as { draftStep?: number }).draftStep) || 1,
          photo: card.images[0] || '',
          price: card.price || null,
          area: card.area || null,
          updated: card.date,
        };
      }));
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const by = (s: string) => listings.filter(l => l.status === s);
  const tabs: [string, string, number][] = [
    ['all', 'All', listings.length], ['active', 'Active', by('active').length], ['upcoming', 'Upcoming', by('upcoming').length],
    ['drafts', 'Drafts', draftCount], ['sold', 'Sold Out', by('sold').length], ['withdrawn', 'Withdrawn', by('withdrawn').length],
  ];
  const list = tab === 'all' ? listings : by(tab);
  const card = (p: MyListing) => (p.status === 'upcoming' ? <UpcomingListingCard key={p.id} p={p} go={go} />
    : p.status === 'sold' ? <SoldListingCard key={p.id} p={p} go={go} />
    : <ActiveListingCard key={p.id} p={p} go={go} />);
  return (
    <AppScreen
      title="My Listings"
      sub={loading ? 'Loading…' : `${listings.length} listings · ${draftCount} drafts`}
      onBack={back}
      nav="profile"
      onNav={onNav}
      sticky={
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsBleed} contentContainerStyle={styles.tabs}>
          {tabs.map(([id, l, n]) => (
            <Chip key={id} active={tab === id} onPress={() => { setTab(id); buzz(); }}>{l} <T num style={styles.dimText}>{n}</T></Chip>
          ))}
        </ScrollView>
      }
      dock={[<Btn key="n" full icon="plus" onPress={() => go('sellType')}>List a property</Btn>]}>
      <View style={styles.pad}>
        {tab === 'drafts' ? <DraftList go={go} />
          : loading ? <ActivityIndicator color={colors.brand600} style={styles.selfCenter} />
          : err && listings.length === 0 ? <EmptyState icon="tag" title="Couldn’t load listings" body={err} action={<Btn style={styles.selfCenter} onPress={() => void load()}>Retry</Btn>} />
          : list.length === 0 ? <EmptyState icon="tag" title="Nothing here yet" body="Listings in this state will appear here." />
          : (
            <Stagger style={styles.gap12} step={50}>
              {tab === 'all' && draftCount > 0 && (
                <Press onPress={() => setTab('drafts')} style={styles.resume}>
                  <View style={styles.resumeIcon}><Icon name="file-pen" size={16} color="#1A6FFF" /></View>
                  <T s={13} w={600} c={colors.ink800} style={styles.flex1}>{draftCount} unfinished {draftCount === 1 ? 'draft' : 'drafts'}</T>
                  <T s={12} w={700} c={colors.brand600}>Resume</T>
                </Press>
              )}
              {list.map(card)}
            </Stagger>
          )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  selfCenter: { alignSelf: 'center' },
  capitalize: { textTransform: 'capitalize' },
  gap12: { gap: 12 },
  row12: { flexDirection: 'row', gap: 12 },
  inline4: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mt2: { marginTop: 2 },
  mt4: { marginTop: 4 },
  pt4: { paddingTop: 4 },
  p12: { padding: 12 },
  pad: { paddingHorizontal: 16, paddingTop: 12 },
  dimText: { opacity: 0.7 },
  draft: { borderRadius: 16, boxShadow: ring('rgba(226,232,240,0.7)'), backgroundColor: colors.white, padding: 12 },
  thumb72: { width: 72, height: 72, borderRadius: 12 },
  thumb84: { width: 84, height: 84, borderRadius: 12 },
  wash: { backgroundColor: 'rgba(255,255,255,0.35)' },
  tl4: { position: 'absolute', top: 4, left: 4 },
  tl8: { position: 'absolute', top: 8, left: 8 },
  progressRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: { flex: 1, height: 6, borderRadius: 9999, backgroundColor: colors.ink100, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 9999, backgroundColor: colors.brand600 },
  draftActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  deleteBtn: { height: 36, paddingHorizontal: 12, borderRadius: 9999, borderWidth: 1, borderColor: colors.ink200, flexDirection: 'row', alignItems: 'center', gap: 6 },
  continueBtn: { flex: 1, height: 36, borderRadius: 9999, backgroundColor: colors.brand600, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  specs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  spec: { backgroundColor: colors.ink100, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  card: { width: '100%', borderRadius: 16, backgroundColor: colors.white, overflow: 'hidden' },
  daysBox: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, boxShadow: elev.e2 },
  facts: { marginTop: 12, flexDirection: 'row', gap: 1, backgroundColor: colors.ink100, borderRadius: 12, overflow: 'hidden', boxShadow: ring(colors.ink100) },
  fact: { flex: 1, minWidth: 0, backgroundColor: colors.ink50, paddingHorizontal: 8, paddingVertical: 6 },
  soldTop: { flexDirection: 'row', gap: 12, padding: 12 },
  soldOverlay: { backgroundColor: 'rgba(15,23,42,0.45)', alignItems: 'center', justifyContent: 'center' },
  soldStamp: { borderWidth: 2, borderColor: colors.white, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, transform: [{ rotate: '-12deg' }] },
  soldTags: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingBottom: 12 },
  soldTag: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.emerald50, boxShadow: ring(colors.emerald100), borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
  activeCard: { flexDirection: 'row', gap: 12, padding: 12, boxShadow: ring('rgba(226,232,240,0.7)') },
  activeMeta: { flexDirection: 'row', gap: 12, marginTop: 4, alignItems: 'center' },
  tabsBleed: { marginHorizontal: -16 },
  tabs: { gap: 8, paddingHorizontal: 16 },
  resume: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, backgroundColor: colors.ink50, boxShadow: ring('rgba(226,232,240,0.7)') },
  resumeIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.white, boxShadow: ring(colors.ink200), alignItems: 'center', justifyContent: 'center' },
});

