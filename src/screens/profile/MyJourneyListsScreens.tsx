import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../../components/icons/Icon';
import { buyNext, buyStatus, enquiryActions } from '../../components/journey/buyerActions';
import { BottomNav } from '../../components/layout/BottomNav';
import { Screen, TopBar } from '../../components/layout/Screen';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { Badge } from '../../components/ui/Badge';
import { Btn } from '../../components/ui/Btn';
import { EmptyState } from '../../components/ui/EmptyState';
import { SegmentedSwipe } from '../../components/ui/Gestures';
import { buzz, Press } from '../../components/ui/Press';
import { ProgressBar } from '../../components/ui/Progress';
import { T } from '../../components/ui/T';
import { BUY_STAGES, SELL_STAGES, buyStage, jCompleteVisit, jFind, sellStage, useJ, useTick } from '../../context/journeyStore';
import type { ScreenProps } from '../../navigation/types';
import { colors, elev, ring } from '../../theme';
import { formatDayTime } from '../../utils/dates';
import { formatINR } from '../../utils/format';

const cardShadow = elev.e1;

/** P-07 My Enquiries */
export function MyEnquiriesScreen({ go, back, onNav }: ScreenProps) {
  const s = useJ();
  useTick(s.buys.some(b => buyStage(b) === 1 && !b.cancelled), 1000);
  const [tab, setTab] = useState('all');
  const list = s.buys.filter(b => (tab === 'all' ? true : tab === 'cancelled' ? b.cancelled : tab === 'completed' ? !b.cancelled && buyStage(b) >= 9 : !b.cancelled && buyStage(b) < 9));
  return (
    <Screen padBottom footer={<BottomNav legacy active="profile" onNav={onNav} />}>
      <TopBar onBack={back} title="My Enquiries" sub={`${s.buys.length} total`} />
      <View style={styles.list}>
        <SegmentedSwipe value={tab} onChange={setTab} tabs={[{ id: 'all', label: 'All' }, { id: 'active', label: 'Active' }, { id: 'completed', label: 'Done' }, { id: 'cancelled', label: 'Cancelled' }]} />
        {list.length === 0 ? (
          <EmptyState icon="inbox" title={tab === 'all' ? "You haven't submitted any enquiries yet." : 'Nothing here'}
            body="Enquiries and visits you book appear here with their live status."
            action={<Btn style={styles.selfCenter} onPress={() => go('buyTypes')}>Browse properties</Btn>} />
        ) : list.map(b => {
          const p = jFind(b.pid);
          if (!p) return null;
          const st = buyStage(b);
          buyNext(b);
          const [lab, col] = buyStatus(b);
          const tint = b.cancelled ? { bg: '#FFF6F7', ring: colors.rose100 } : st >= 9 ? { bg: '#F4FEF9', ring: colors.emerald100 } : { bg: '#F7F9FF', ring: colors.brand100 };
          return (
            <View key={b.id} style={styles.card}>
              <Pressable onPress={() => go('enquiryDetail', { p })} style={styles.cardTop}>
                <PhotoPlaceholder tag={p.id} style={styles.thumb64} />
                <View style={styles.flex1}>
                  <View style={styles.titleRow}>
                    <T s={13.5} w={700} truncate style={styles.flex1}>{p.title}</T>
                    <Badge color={col}>{lab}</Badge>
                  </View>
                  <T s={11.5} c={colors.ink500} truncate style={styles.mt2}>{p.location} · {formatDayTime(b.created)}</T>
                  {!b.cancelled && (
                    <View style={styles.segments}>
                      {BUY_STAGES.map((_, i) => <View key={i} style={[styles.segment, { backgroundColor: i < st || st >= 9 ? colors.emerald400 : i === st ? colors.brand500 : colors.ink100 }]} />)}
                    </View>
                  )}
                </View>
              </Pressable>
              <View style={styles.pad}>
                <View style={[styles.status, { backgroundColor: tint.bg, boxShadow: ring(tint.ring) }]}>
                  <View style={styles.statusRow}>
                    <Icon name={b.cancelled ? 'circle-x' : st >= 9 ? 'circle-check' : 'circle-dot'} size={13} color={b.cancelled ? '#E11D48' : st >= 9 ? '#10B981' : '#1A6FFF'} />
                    <T s={11} w={700} c={colors.ink600} lh={16 / 11} truncate style={styles.flex1}>
                      {b.cancelled ? 'Enquiry cancelled' : st >= 9 ? 'Purchase complete' : <>Step <T num>{st + 1}/10</T> · {BUY_STAGES[st][1]}</>}
                    </T>
                  </View>
                  <View style={styles.row8}>
                    {enquiryActions(b, p, go).map(a => <Btn key={a.label} size="sm" flex variant={a.primary ? 'primary' : 'outline'} icon={a.icon} onPress={a.fn}>{a.label}</Btn>)}
                  </View>
                </View>
              </View>
              <View style={styles.footer}>
                <Pressable onPress={() => go('propertyDetail', { p })} style={styles.footBtn}>
                  <Icon name="eye" size={14} color={colors.ink600} />
                  <T s={12} w={600} c={colors.ink600}>View property</T>
                </Pressable>
                <View style={styles.footDivider} />
                <Pressable onPress={() => go('enquiryDetail', { p })} style={styles.footBtn}>
                  <Icon name="list-checks" size={14} color={colors.ink600} />
                  <T s={12} w={600} c={colors.ink600}>Track all steps</T>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

/** P-04a My Visits */
export function MyVisitsScreen({ go, back, onNav }: ScreenProps) {
  const s = useJ();
  const [tab, setTab] = useState('upcoming');
  const all = s.buys.filter(b => b.visit);
  const list = all.filter(b => (tab === 'upcoming' ? b.visit!.status === 'scheduled' && !b.cancelled : tab === 'completed' ? b.visit!.status === 'completed' : b.visit!.status === 'cancelled' || b.cancelled));
  return (
    <Screen padBottom footer={<BottomNav legacy active="profile" onNav={onNav} />}>
      <TopBar onBack={back} title="My Visits" sub={`${all.filter(b => b.visit!.status === 'scheduled' && !b.cancelled).length} upcoming`} />
      <View style={styles.list}>
        <SegmentedSwipe value={tab} onChange={setTab} tabs={[{ id: 'upcoming', label: 'Upcoming' }, { id: 'completed', label: 'Completed' }, { id: 'cancelled', label: 'Cancelled' }]} />
        {list.length === 0 ? (
          <EmptyState icon="calendar" title={tab === 'upcoming' ? 'No visits scheduled' : 'Nothing here'} body="Book a site visit from any property page."
            action={<Btn style={styles.selfCenter} onPress={() => go('buyTypes')}>Browse properties</Btn>} />
        ) : list.map(b => {
          const p = jFind(b.pid);
          const v = b.visit!;
          if (!p) return null;
          const up = v.status === 'scheduled' && !b.cancelled;
          return (
            <View key={b.id} style={[styles.card, styles.p12]}>
              <Pressable onPress={() => go('enquiryDetail', { p })} style={styles.visitRow}>
                <View style={styles.dateTile}>
                  <T s={10} w={700} upper c={colors.brand600} align="center">{String(v.date).split(' ')[0].slice(0, 3)}</T>
                  <T display num s={20} w={800} lh={1} align="center">{(String(v.date).match(/\d+/) || [''])[0]}</T>
                </View>
                <View style={styles.flex1}>
                  <T s={13.5} w={700} truncate>{p.title}</T>
                  <T s={11.5} c={colors.ink500} truncate>{p.location} · {v.slot}</T>
                  <T s={11} c={colors.ink400} style={styles.mt2}>Ref #{v.ref}{v.rescheduled ? ' · Rescheduled' : ''}</T>
                </View>
                <Badge color={up ? 'brand' : v.status === 'completed' ? 'green' : 'rose'}>{up ? 'Upcoming' : v.status === 'completed' ? 'Visited' : 'Cancelled'}</Badge>
              </Pressable>
              {up && (
                <View style={[styles.row8, styles.mt12]}>
                  <Btn size="sm" variant="outline" flex onPress={() => go('rescheduleVisit', { p, date: v.date, slot: v.slot })}>Reschedule</Btn>
                  <Btn size="sm" flex onPress={() => { jCompleteVisit(b.pid); buzz(12); }}>Mark visited</Btn>
                </View>
              )}
              {v.status === 'completed' && buyStage(b) === 3 && (
                <Btn size="sm" full style={styles.mt12} iconRight="arrow-right" onPress={() => go('buyerDeal', { p })}>Continue to deal</Btn>
              )}
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

interface DealItem { id: string; role: 'Buying' | 'Selling'; title: string; price: number; photo: string; done: boolean; stage: string; pct: number; open: () => void }

/** P-04b My Deals (buyer and seller deals) */
export function MyDealsScreen({ go, back, onNav }: ScreenProps) {
  const s = useJ();
  const [tab, setTab] = useState('active');
  const buys: DealItem[] = s.buys.filter(b => !b.cancelled && buyStage(b) >= 3).map(b => {
    const p = jFind(b.pid), st = buyStage(b), done = st >= 9;
    return p ? { id: b.id, role: 'Buying' as const, title: p.title, price: p.price, photo: p.id, done, stage: done ? 'Completed' : BUY_STAGES[st][1], pct: Math.round((Math.min(st, 9) / 9) * 100), open: () => go('enquiryDetail', { p }) } : null;
  }).filter(Boolean) as DealItem[];
  const sells: DealItem[] = s.listings.filter(l => !l.rejected && sellStage(l) >= 8).map(l => {
    const st = sellStage(l), done = st >= 12;
    return { id: l.id, role: 'Selling' as const, title: l.title, price: l.price, photo: l.pid || l.photo, done, stage: done ? 'Sold' : SELL_STAGES[st][1], pct: Math.round((Math.min(st, 12) / 12) * 100), open: () => go('listingDetail', { lid: l.id }) };
  });
  const all = [...buys, ...sells];
  const list = all.filter(d => tab === 'all' || (tab === 'completed' ? d.done : !d.done));
  return (
    <Screen padBottom footer={<BottomNav legacy active="profile" onNav={onNav} />}>
      <TopBar onBack={back} title="My Deals" sub={`${all.length} total`} />
      <View style={styles.list}>
        <SegmentedSwipe value={tab} onChange={setTab} tabs={[{ id: 'active', label: 'Active' }, { id: 'completed', label: 'Completed' }, { id: 'all', label: 'All' }]} />
        {list.length === 0 ? (
          <EmptyState icon="handshake" title={tab === 'completed' ? 'No completed deals' : 'No deals yet'}
            body="A deal appears here once you complete a site visit as a buyer, or accept an offer as a seller."
            action={
              <View style={styles.emptyActions}>
                <Btn variant="outline" onPress={() => go('myEnquiries')}>My enquiries</Btn>
                <Btn onPress={() => go('myListings')}>My listings</Btn>
              </View>
            } />
        ) : list.map(d => (
          <Press key={d.id} onPress={d.open} style={[styles.card, styles.p12]}>
            <View style={styles.row12}>
              <PhotoPlaceholder tag={d.photo} style={styles.thumb56} />
              <View style={styles.flex1}>
                <View style={styles.titleRow}>
                  <T s={13.5} w={700} truncate style={styles.flex1}>{d.title}</T>
                  <Badge color={d.done ? 'green' : 'brand'}>{d.stage}</Badge>
                </View>
                <View style={[styles.row8, styles.mt2, styles.center]}>
                  <T num s={13} w={800} c={colors.brand700}>{formatINR(d.price)}</T>
                  <View style={[styles.role, { backgroundColor: d.role === 'Buying' ? colors.brand50 : colors.amber50 }]}>
                    <T s={10} w={700} c={d.role === 'Buying' ? colors.brand700 : colors.amber700}>{d.role}</T>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.progressRow}>
              <View style={styles.flex1}><ProgressBar value={d.pct} /></View>
              <T num s={11} w={700} c={colors.ink500}>{d.pct}%</T>
              <Icon name="chevron-right" size={16} color="#94A3B8" />
            </View>
          </Press>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  center: { alignItems: 'center' },
  selfCenter: { alignSelf: 'center' },
  mt2: { marginTop: 2 },
  mt12: { marginTop: 12 },
  p12: { padding: 12 },
  row8: { flexDirection: 'row', gap: 8 },
  row12: { flexDirection: 'row', gap: 12 },
  list: { paddingHorizontal: 16, gap: 12 },
  card: { borderRadius: 16, backgroundColor: colors.white, boxShadow: cardShadow, overflow: 'hidden' },
  cardTop: { flexDirection: 'row', gap: 12, padding: 12 },
  thumb64: { width: 64, height: 64, borderRadius: 12 },
  thumb56: { width: 56, height: 56, borderRadius: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  segments: { flexDirection: 'row', gap: 2, marginTop: 8 },
  segment: { height: 6, flex: 1, borderRadius: 9999 },
  pad: { paddingHorizontal: 12, paddingBottom: 12 },
  status: { borderRadius: 12, padding: 10 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  footer: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.ink100 },
  footBtn: { flex: 1, height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  footDivider: { width: 1, backgroundColor: colors.ink100 },
  visitRow: { flexDirection: 'row', gap: 12 },
  dateTile: { width: 56, borderRadius: 12, backgroundColor: colors.brand50, boxShadow: ring(colors.brand100), paddingVertical: 6 },
  role: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 9999 },
  progressRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  emptyActions: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
});
