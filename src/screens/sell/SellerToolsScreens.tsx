import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { EmptyGlyph } from '../../components/hero/StatusHero';
import { Icon } from '../../components/icons/Icon';
import { Grid } from '../../components/layout/Grid';
import { Screen, TopBar } from '../../components/layout/Screen';
import { Badge, type BadgeColor } from '../../components/ui/Badge';
import { Btn } from '../../components/ui/Btn';
import { Chip } from '../../components/ui/Chip';
import { buzz, Press } from '../../components/ui/Press';
import { T } from '../../components/ui/T';
import type { ScreenProps } from '../../navigation/types';
import * as sellRequests from '../../services/sellRequests.service';
import type { SellEnquiryRow, SellVisitRow } from '../../services/sellRequests.service';
import { colors, ring, type } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { formatINR } from '../../utils/format';

const STATUS_COLOR: Record<string, BadgeColor> = {
  new: 'rose',
  responded: 'brand',
  contacted: 'brand',
  shortlisted: 'green',
  visit_scheduled: 'green',
  negotiating: 'amber',
  closed: 'ink',
};

type EnquiryUi = {
  id: string;
  sellRequestId: string;
  name: string;
  time: string;
  msg: string;
  status: string;
};

function relativeTime(iso?: string): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return '';
  const h = Math.floor(ms / 3600000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Yesterday';
  return `${d} days`;
}

function mapEnquiry(e: SellEnquiryRow, sellRequestId: string): EnquiryUi {
  const name = e.buyerSnapshot?.name || 'Buyer';
  const interest = e.interestType ? String(e.interestType).replace(/_/g, ' ') : '';
  return {
    id: String(e._id),
    sellRequestId,
    name,
    time: relativeTime(e.submittedAt),
    msg: String(e.additionalMessage || interest || e.preferredContact || 'Interested in your listing'),
    status: String(e.status || 'new'),
  };
}

async function loadActivityForListings(preferredId?: string): Promise<{
  enquiries: EnquiryUi[];
  visits: Array<SellVisitRow & { sellRequestId: string; name: string; day: string; slot: string }>;
  availability: string[];
  sellRequestId: string;
}> {
  const ids: string[] = [];
  if (preferredId) ids.push(preferredId);
  else {
    const { items } = await sellRequests.listMySellRequests({ limit: 20 });
    for (const sr of items || []) if (sr._id) ids.push(String(sr._id));
  }
  const enquiries: EnquiryUi[] = [];
  const visits: Array<SellVisitRow & { sellRequestId: string; name: string; day: string; slot: string }> = [];
  let availability: string[] = [];
  let primaryId = preferredId || ids[0] || '';
  for (const id of ids) {
    try {
      const activity = await sellRequests.getSellRequestActivity(id);
      if (!primaryId) primaryId = id;
      if (Array.isArray(activity.availability) && activity.availability.length) {
        availability = activity.availability.map(String);
      }
      for (const e of activity.enquiries || []) enquiries.push(mapEnquiry(e, id));
      for (const v of activity.visits || []) {
        const date = v.visitDate ? new Date(v.visitDate) : null;
        const day = date && Number.isFinite(date.getTime())
          ? date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })
          : '—';
        visits.push({
          ...v,
          sellRequestId: id,
          name: v.buyerName || 'Buyer',
          day,
          slot: String(v.visitTime || '—'),
        });
      }
    } catch {
      // skip listings that fail individually
    }
  }
  return { enquiries, visits, availability, sellRequestId: primaryId };
}

/** Seller: buyer enquiries from sell-request activity */
export function SellEnquiriesScreen({ go, back, ctx }: ScreenProps) {
  const preferredId = String(ctx?.sellRequestId || ctx?.lid || '');
  const [tab, setTab] = useState('all');
  const [rows, setRows] = useState<EnquiryUi[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadActivityForListings(preferredId || undefined)
      .then(res => { if (!cancelled) setRows(res.enquiries); })
      .catch(e => { if (!cancelled) setErr(errorMessage(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [preferredId]);

  const list = rows.filter(e => tab === 'all' || e.status === tab);
  return (
    <Screen>
      <TopBar onBack={back} title="Buyer enquiries" sub={loading ? 'Loading…' : `${rows.length} total`} />
      <View style={styles.px4}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.mb8}>
          {['all', 'new', 'responded', 'visit_scheduled', 'negotiating'].map(t => (
            <Chip key={t} active={tab === t} onPress={() => setTab(t)}>{t === 'all' ? 'All' : t.replace(/_/g, ' ')}</Chip>
          ))}
        </ScrollView>
        {err ? <T s={12} c={colors.rose600} style={styles.mb8}>{err}</T> : null}
        {loading ? (
          <View style={styles.empty}><T s={13} c={colors.ink400}>Loading enquiries…</T></View>
        ) : list.length === 0 ? (
          <View style={styles.empty}><EmptyGlyph name="inbox" /><T s={13} c={colors.ink400} style={styles.mt8}>No enquiries yet</T></View>
        ) : (
          <View style={styles.gap8}>
            {list.map(e => (
              <View key={e.id} style={styles.card}>
                <View style={styles.row12}>
                  <View style={styles.avatar}><T s={15} w={700} c={colors.brand700}>{(e.name[0] || 'B').toUpperCase()}</T></View>
                  <View style={styles.flex1}>
                    <View style={styles.inline8}>
                      <T s={13} w={600} truncate>{e.name}</T>
                      <Badge color={STATUS_COLOR[e.status] || 'ink'}>{e.status.replace(/_/g, ' ')}</Badge>
                    </View>
                    {e.time ? <T s={10.5} c={colors.ink500}>{e.time}</T> : null}
                  </View>
                </View>
                <T s={12.5} c={colors.ink700} lh={1.625} style={styles.mt8}>{e.msg}</T>
                <View style={styles.actions}>
                  <Btn size="sm" variant="outline" icon="calendar" onPress={() => go('sellVisitMgmt', { sellRequestId: e.sellRequestId, lid: e.sellRequestId })}>Schedule</Btn>
                  <Btn size="sm" icon="message-circle" onPress={() => go('sellChat', { sellRequestId: e.sellRequestId, lid: e.sellRequestId })}>Chat</Btn>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

/** Seller: visit scheduling from sell-request activity */
export function SellVisitMgmtScreen({ back, ctx }: ScreenProps) {
  const preferredId = String(ctx?.sellRequestId || ctx?.lid || '');
  const [sellRequestId, setSellRequestId] = useState(preferredId);
  const [visits, setVisits] = useState<Array<SellVisitRow & { sellRequestId: string; name: string; day: string; slot: string }>>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [busyId, setBusyId] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await loadActivityForListings(preferredId || undefined);
      setVisits(res.visits);
      setSlots(res.availability.length ? res.availability : ['9–11 AM', '3–5 PM', '5–7 PM']);
      setSellRequestId(res.sellRequestId);
    } catch (e) {
      setErr(errorMessage(e));
      setVisits([]);
    } finally {
      setLoading(false);
    }
  }, [preferredId]);

  useEffect(() => { void reload(); }, [reload]);

  const saveSlots = async (next: string[]) => {
    setSlots(next);
    if (!sellRequestId) return;
    try {
      await sellRequests.setSellAvailability(sellRequestId, next);
    } catch (e) {
      setErr(errorMessage(e));
    }
  };

  const decide = async (visit: { _id: string; sellRequestId: string }, action: 'confirm' | 'decline') => {
    setBusyId(visit._id);
    setErr('');
    try {
      await sellRequests.sellVisitAction(visit.sellRequestId, visit._id, action === 'confirm' ? { action: 'confirm' } : { action: 'decline' });
      await reload();
      buzz(14);
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusyId('');
    }
  };

  const confirmed = visits.filter(v => v.status === 'confirmed').length;
  return (
    <Screen>
      <TopBar onBack={back} title="Visit scheduling" sub={loading ? 'Loading…' : `${visits.length} requests · ${confirmed} confirmed`} />
      <View style={styles.px4}>
        <T display s={13} w={600} style={styles.mb8}>Your availability</T>
        <Grid cols={4} gap={8} style={styles.mb20}>
          {['9–11 AM', '11–1 PM', '3–5 PM', '5–7 PM'].map(sl => {
            const on = slots.includes(sl);
            return (
              <Press key={sl} onPress={() => { buzz(); void saveSlots(on ? slots.filter(x => x !== sl) : [...slots, sl]); }} style={[styles.slot, on ? styles.slotOn : styles.slotOff]}>
                <T s={11} w={700} c={on ? colors.emerald700 : colors.ink500} align="center">{sl}</T>
              </Press>
            );
          })}
        </Grid>
        <T display s={13} w={600} style={styles.mb8}>Visit requests</T>
        {err ? <T s={12} c={colors.rose600} style={styles.mb8}>{err}</T> : null}
        {loading ? (
          <View style={styles.empty}><T s={13} c={colors.ink400}>Loading visits…</T></View>
        ) : visits.length === 0 ? (
          <View style={styles.empty}><EmptyGlyph name="calendar" /><T s={13} c={colors.ink400} style={styles.mt8}>No visit requests yet</T></View>
        ) : (
          <View style={styles.gap8}>
            {visits.map(v => {
              const state = String(v.status || 'requested');
              const parts = v.day.split(' ');
              return (
                <View key={v._id} style={[styles.card, styles.visitRow]}>
                  <View style={styles.dayTile}>
                    <T s={9} upper c={colors.brand700} align="center">{parts[0] || '—'}</T>
                    <T s={14} w={700} c={colors.brand700} lh={1} align="center">{parts[1] || ''}</T>
                  </View>
                  <View style={styles.flex1}>
                    <T s={13} w={600}>{v.name}</T>
                    <T s={11} c={colors.ink500}>{v.slot}</T>
                  </View>
                  {state === 'confirmed' ? <Badge color="green" icon="check">Confirmed</Badge>
                    : state === 'cancelled' || state === 'declined' ? <Badge color="rose" icon="x">Declined</Badge>
                    : (
                      <View style={styles.row4}>
                        <Press disabled={busyId === v._id} onPress={() => { void decide(v, 'confirm'); }} style={[styles.decide, { backgroundColor: colors.emerald50, boxShadow: ring(colors.emerald200) }]} accessibilityLabel="Confirm"><Icon name="check" size={14} color="#10B981" /></Press>
                        <Press disabled={busyId === v._id} onPress={() => { void decide(v, 'decline'); }} style={[styles.decide, { backgroundColor: colors.rose50, boxShadow: ring(colors.rose200) }]} accessibilityLabel="Decline"><Icon name="x" size={14} color="#E11D48" /></Press>
                      </View>
                    )}
                </View>
              );
            })}
          </View>
        )}
      </View>
    </Screen>
  );
}

interface Msg { from: 'buyer' | 'me'; text: string; time: string; offer?: number; counter?: number }

/** Seller: negotiation chat — messages via POST /me/sell-requests/:id/messages */
export function SellChatScreen({ back, ctx }: ScreenProps) {
  const sellRequestId = String(ctx?.sellRequestId || ctx?.lid || '');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!sellRequestId) return;
    let cancelled = false;
    sellRequests.getSellRequestActivity(sellRequestId)
      .then(activity => {
        if (cancelled) return;
        const history = (activity as { messages?: Array<{ text?: string; from?: string; createdAt?: string; amount?: number }> }).messages;
        if (Array.isArray(history)) {
          setMessages(history.map(m => ({
            from: m.from === 'seller' || m.from === 'me' ? 'me' : 'buyer',
            text: m.text || '',
            time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            offer: m.amount,
          })));
        }
      })
      .catch(e => { if (!cancelled) setErr(errorMessage(e)); });
    return () => { cancelled = true; };
  }, [sellRequestId]);

  const send = async () => {
    if (!draft.trim() || !sellRequestId || busy) return;
    setBusy(true);
    setErr('');
    const text = draft.trim();
    try {
      await sellRequests.sendSellMessage(sellRequestId, text);
      setMessages(prev => [...prev, { from: 'me', text, time: 'now' }]);
      setDraft('');
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen>
      <View style={styles.chatHead}>
        <Pressable onPress={back} style={styles.back} accessibilityLabel="Back"><Icon name="arrow-left" size={20} /></Pressable>
        <View style={styles.avatar}><T s={16} w={700} c={colors.brand700}>B</T></View>
        <View style={styles.flex1}>
          <T s={14} w={600}>Builtglory</T>
          <View style={styles.inline4}><View style={styles.online} /><T s={10.5} c={colors.emerald600}>Negotiation</T></View>
        </View>
      </View>
      <View style={[styles.thread, styles.threadContent]}>
        {err ? <T s={12} c={colors.rose600} align="center">{err}</T> : null}
        {!messages.length ? <T s={10.5} c={colors.ink500} align="center" style={styles.mb4}>No messages yet</T> : <T s={10.5} c={colors.ink500} align="center" style={styles.mb4}>Today</T>}
        {messages.map((m, i) => {
          const me = m.from === 'me';
          return (
            <View key={i} style={[styles.msgRow, { justifyContent: me ? 'flex-end' : 'flex-start' }]}>
              <View style={[styles.bubble, me ? styles.bubbleMe : styles.bubbleThem]}>
                <T s={13} c={me ? colors.white : colors.ink900}>{m.text}</T>
                {(m.offer || m.counter) ? (
                  <View style={[styles.offerTag, me ? styles.offerMe : styles.offerThem]}>
                    <T s={12} w={600} c={me ? colors.white : colors.emerald700}>{m.offer ? 'Offer: ' : 'Counter: '}{formatINR((m.offer || m.counter) as number)}</T>
                  </View>
                ) : null}
                <T s={9.5} c={me ? 'rgba(255,255,255,0.7)' : colors.ink400} style={styles.mt4}>{m.time}</T>
              </View>
            </View>
          );
        })}
      </View>
      <View style={styles.composer}>
        <View style={styles.inputRow}>
          <TextInput value={draft} onChangeText={setDraft} onSubmitEditing={() => void send()} returnKeyType="send" placeholder="Type a message…" placeholderTextColor={colors.ink400} style={styles.input} />
          <Pressable onPress={() => void send()} style={styles.send} accessibilityLabel="Send"><Icon name="send" size={14} color="white" /></Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  px4: { paddingHorizontal: 16 },
  gap8: { gap: 8 },
  row4: { flexDirection: 'row', gap: 4 },
  row12: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  inline4: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  inline8: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mt4: { marginTop: 4 },
  mt8: { marginTop: 8 },
  mb4: { marginBottom: 4 },
  mb8: { marginBottom: 8, flexGrow: 0 },
  mb20: { marginBottom: 20 },
  chips: { gap: 8, paddingBottom: 8 },
  empty: { paddingVertical: 48, alignItems: 'center' },
  card: { padding: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.ink200 },
  avatar: { width: 40, height: 40, borderRadius: 9999, backgroundColor: colors.brand100, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  slot: { paddingVertical: 8, borderRadius: 14, borderWidth: 1 },
  slotOn: { borderColor: colors.emerald500, backgroundColor: colors.emerald50 },
  slotOff: { borderColor: colors.ink200 },
  visitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dayTile: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.brand50, alignItems: 'center', justifyContent: 'center' },
  decide: { width: 32, height: 32, borderRadius: 9999, alignItems: 'center', justifyContent: 'center' },
  chatHead: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: colors.ink200, backgroundColor: colors.white },
  back: { marginLeft: -4, padding: 8, borderRadius: 9999 },
  online: { width: 6, height: 6, borderRadius: 9999, backgroundColor: colors.emerald500 },
  headBtn: { width: 36, height: 36, borderRadius: 9999, backgroundColor: colors.ink100, alignItems: 'center', justifyContent: 'center' },
  thread: { backgroundColor: colors.ink50 },
  threadContent: { paddingHorizontal: 12, paddingVertical: 12, gap: 8 },
  msgRow: { flexDirection: 'row' },
  bubble: { maxWidth: '78%', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  bubbleMe: { backgroundColor: colors.brand600, borderBottomRightRadius: 6 },
  bubbleThem: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.ink200, borderBottomLeftRadius: 6 },
  offerTag: { marginTop: 6, marginHorizontal: -8, marginBottom: -4, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, borderWidth: 1 },
  offerMe: { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)' },
  offerThem: { backgroundColor: colors.emerald50, borderColor: colors.emerald200 },
  composer: { paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.ink200, backgroundColor: colors.white },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: { flex: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9999, backgroundColor: colors.ink100, ...type(14), lineHeight: 20, color: colors.ink900 },
  send: { width: 36, height: 36, borderRadius: 9999, backgroundColor: colors.brand600, alignItems: 'center', justifyContent: 'center' },
});
