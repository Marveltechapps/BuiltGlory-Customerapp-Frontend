import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../../components/icons/Icon';
import { enquiryActions, buyStatus } from '../../components/journey/buyerActions';
import { PropMini, StageRail } from '../../components/journey/JourneyParts';
import { DockBar } from '../../components/layout/AppScreen';
import { Card } from '../../components/layout/Groups';
import { Screen, TopBar } from '../../components/layout/Screen';
import { Badge } from '../../components/ui/Badge';
import { Btn, type BtnVariant } from '../../components/ui/Btn';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spin } from '../../components/ui/Float';
import { FadeIn } from '../../components/ui/Motion';
import { buzz, Press } from '../../components/ui/Press';
import { Sheet } from '../../components/ui/Sheet';
import { T } from '../../components/ui/T';
import {
  BUY_STAGES, TOKEN_AMOUNT, buyStage, buyStepTime, jActiveBuyPid, jAdvanceBuy, jCancelBuy, jCompleteVisit, jFind, useJ, useTick,
} from '../../context/journeyStore';
import type { ScreenProps } from '../../navigation/types';
import { colors, elev } from '../../theme';
import { formatDayTime } from '../../utils/dates';
import { formatINR } from '../../utils/format';

const TONES = {
  done: { bg: colors.emerald50, fg: colors.emerald700, icon: '#10B981', name: 'check', label: 'Completed' },
  current: { bg: colors.brand50, fg: colors.brand700, icon: '#1A6FFF', name: 'loader', label: 'Current step' },
  future: { bg: colors.ink50, fg: colors.ink500, icon: '#94A3B8', name: 'lock', label: 'Upcoming' },
};
const REASONS = ['Found another property', 'Budget changed', 'Location not suitable', 'Other'];

/** P-08 Buyer tracker with stage-wise navigation */
export function BuyTrackerScreen({ go, back, ctx }: ScreenProps) {
  const s = useJ();
  const pid = jActiveBuyPid(ctx);
  const b = s.buys.find(x => x.pid === pid && !x.cancelled) || s.buys.find(x => x.pid === pid);
  const p = pid ? jFind(pid) : undefined;
  const stage = buyStage(b);
  useTick(!!b && stage === 1, 1000);
  const [sel, setSel] = useState(Math.max(0, stage));
  const [cancel, setCancel] = useState(false);
  const [reason, setReason] = useState('');
  useEffect(() => { setSel(Math.max(0, stage)); }, [stage]);

  if (!b || !p || !pid) {
    return (
      <Screen>
        <TopBar onBack={back} title="Enquiry tracker" />
        <EmptyState icon="inbox" title="No active enquiry" body="Submit an enquiry or book a visit on a property to start tracking it here."
          action={<Btn style={styles.selfCenter} onPress={() => go('buyTypes')}>Browse properties</Btn>} />
      </Screen>
    );
  }
  const pick = (i: number) => { setSel(i); buzz(); };
  const done = stage >= 9;
  const detail = (i: number): string => {
    const k = BUY_STAGES[i][0];
    if (k === 'submitted') return b.enquiry ? `Enquiry for ${(b.enquiry.types || []).join(', ') || 'property details'}.` : 'Visit booked directly from the property page.';
    if (k === 'call') return stage > 1 ? 'Your Builtglory advisor called to confirm your requirements.' : 'An advisor will call you shortly to confirm your requirements.';
    if (k === 'visit') return b.visit ? `${b.visit.status === 'completed' ? 'Visited' : b.visit.status === 'cancelled' ? 'Cancelled' : 'Scheduled'} · ${b.visit.date}, ${b.visit.slot} · Ref #${b.visit.ref}` : 'Pick a date and time to see the property.';
    if (k === 'deal') return stage > 3 ? `Deal confirmed at ${formatINR(p.price)}.` : 'Confirm the agreed price to start the paperwork.';
    if (k === 'docs') return stage > 4 ? 'Title, EC and approval documents reviewed.' : 'Review the title, EC and approval documents.';
    if (k === 'kyc') return stage > 5 ? `KYC verified · PAN ${b.kyc ? b.kyc.pan : ''}` : 'Verify your identity before any payment.';
    if (k === 'token') return stage > 6 ? `Token of ${formatINR(TOKEN_AMOUNT)} paid.` : `Token amount ${formatINR(TOKEN_AMOUNT)}.`;
    if (k === 'method') return stage > 7 ? `Balance via ${b.method || 'bank transfer'}.` : 'Choose how you will pay the balance.';
    if (k === 'registration') return stage > 8 ? 'Sale deed registered at the Sub-Registrar office.' : 'Appointment at the Sub-Registrar office.';
    return 'The property is yours.';
  };
  const actions = (i: number): React.ReactNode[] | null => {
    const k = BUY_STAGES[i][0];
    const A = (l: string, f: () => void, v: BtnVariant = 'soft') => <Btn key={l} size="sm" variant={v} onPress={f}>{l}</Btn>;
    if (k === 'submitted') return [A('View property', () => go('propertyDetail', { p }), 'outline')];
    if (k === 'call') return i === stage && !b.visit ? [A('Schedule visit now', () => go('visitCalendar', { p }), 'primary'), A('Call advisor', () => go('callUs'), 'outline')] : [A('Call advisor', () => go('callUs'), 'outline')];
    if (k === 'visit' && i === stage) return b.visit && b.visit.status === 'scheduled'
      ? [A('Reschedule', () => go('rescheduleVisit', { p, date: b.visit?.date, slot: b.visit?.slot }), 'outline'), A('Mark visit done', () => { jCompleteVisit(pid); buzz(12); }, 'primary')]
      : [A('Schedule visit', () => go('visitCalendar', { p }), 'primary')];
    if (k === 'visit' && b.visit) return [A('My visits', () => go('myVisits'), 'outline')];
    if (k === 'deal') return [A(stage > 3 ? 'View deal' : 'Confirm deal', () => go('buyerDeal', { p }), i === stage ? 'primary' : 'outline')];
    if (k === 'docs') return [A(stage > 4 ? 'View documents' : 'Review documents', () => go('documentsShared', { p }), i === stage ? 'primary' : 'outline')];
    if (k === 'kyc') return [A(i === stage ? 'Complete KYC' : 'View KYC', () => go('buyerKyc', { p }), i === stage ? 'primary' : 'outline')];
    if ((k === 'token' || k === 'method') && i === stage) return [A('Pay token', () => go('payment', { p }), 'primary')];
    if (k === 'token' || k === 'method') return [A('Payment receipt', () => go('pdfViewer', { title: 'Token Receipt' }), 'outline')];
    if (k === 'completed') return [A('Sale deed', () => go('pdfViewer', { title: 'Sale Deed' }), 'primary')];
    if (k === 'registration') return [A('View appointment', () => go('registrationDetails', { p }), 'outline'),
      ...(i === stage ? [A('Registration done', () => { jAdvanceBuy(pid, 9); buzz(14); }, 'primary')] : [])];
    return null;
  };
  const [statusLabel, statusColor] = buyStatus(b);
  const i = Math.max(0, Math.min(sel, BUY_STAGES.length - 1));
  const st: 'done' | 'current' | 'future' = i < stage || done ? 'done' : i === stage ? 'current' : 'future';
  const tm = st === 'done' ? buyStepTime(b, i) : null;
  const acts = st === 'future' ? null : actions(i);
  const tone = TONES[st];
  const primary = enquiryActions(b, p, go)[0];

  return (
    <Screen
      footer={
        <>
          {!b.cancelled && (
            <DockBar legacy>
              {stage <= 2 ? <Btn variant="outline" full onPress={() => setCancel(true)}>Cancel</Btn> : null}
              <Btn full icon={primary.icon} onPress={primary.fn}>{primary.label}</Btn>
            </DockBar>
          )}
          {cancel && (
            <Sheet title="Cancel this enquiry?" onClose={() => setCancel(false)}>
              <View style={styles.gap8}>
                {REASONS.map(r => (
                  <Pressable key={r} onPress={() => setReason(r)} style={[styles.reason, reason === r ? styles.reasonOn : styles.reasonOff]}>
                    <T s={13} w={reason === r ? 600 : 400}>{r}</T>
                  </Pressable>
                ))}
              </View>
              <Btn variant="danger" full style={styles.mt16} disabled={!reason} onPress={() => { jCancelBuy(pid, reason); setCancel(false); buzz(14); }}>Cancel enquiry</Btn>
            </Sheet>
          )}
        </>
      }>
      <TopBar onBack={back} title="Enquiry tracker" sub={'Ref #' + b.id} />
      <View style={styles.body}>
        <PropMini p={p} right={<Badge color={statusColor}>{statusLabel}</Badge>} />
        {!b.cancelled && <StageRail stages={BUY_STAGES} cur={done ? 10 : stage} sel={sel} onPick={pick} />}
        {b.cancelled ? (
          <Card pad={16} style={styles.cancelled}>
            <T s={14} w={700} c={colors.rose700}>Enquiry cancelled</T>
            <T s={12.5} c="rgba(199,0,54,0.8)" style={styles.mt4}>{b.cancelReason || 'Cancelled by you'} · {formatDayTime(b.cancelledAt)}</T>
          </Card>
        ) : (
          <FadeIn key={i} style={styles.stepCard}>
            <View style={[styles.stepHead, { backgroundColor: tone.bg }]}>
              <View style={styles.rowBetween}>
                <View style={styles.inline6}>
                  {st === 'current' ? <Spin period={1400}><Icon name={tone.name} size={13} color={tone.icon} /></Spin> : <Icon name={tone.name} size={13} color={tone.icon} />}
                  <T s={11} w={700} upper ls={0.08} c={tone.fg}>{tone.label}</T>
                </View>
                <T num s={12} w={700} c={colors.ink500}>Step {i + 1} of {BUY_STAGES.length}</T>
              </View>
              <T display s={22} w={800} ls={-0.03} style={styles.mt6}>{BUY_STAGES[i][1]}</T>
              <T s={12} c={colors.ink500} style={styles.mt2}>{tm ? 'Done · ' + formatDayTime(tm) : st === 'current' ? 'In progress' : 'Unlocks after ' + BUY_STAGES[i - 1][1].toLowerCase()}</T>
            </View>
            <View style={styles.p16}>
              <T s={13.5} lh={1.625} c={st === 'future' ? colors.ink400 : colors.ink700}>{st === 'future' ? 'Complete the current step first. This step opens once the one before it is done.' : detail(i)}</T>
              {acts && acts.length > 0 ? <View style={styles.acts}>{acts}</View> : null}
              {st === 'future' && <Btn size="sm" variant="outline" style={styles.mt16} icon="arrow-left" onPress={() => pick(stage)}>Go to current step</Btn>}
            </View>
            <View style={styles.pager}>
              <Press disabled={i === 0} onPress={() => pick(i - 1)} style={[styles.pagerBtn, i === 0 && styles.disabled]}>
                <Icon name="chevron-left" size={16} color={colors.ink600} />
                <T s={13} w={600} c={colors.ink600}>Previous</T>
              </Press>
              <View style={styles.pagerDivider} />
              <Press disabled={i >= BUY_STAGES.length - 1} onPress={() => pick(i + 1)} style={[styles.pagerBtn, i >= BUY_STAGES.length - 1 && styles.disabled]}>
                <T s={13} w={600} c={colors.ink600}>Next</T>
                <Icon name="chevron-right" size={16} color={colors.ink600} />
              </Press>
            </View>
          </FadeIn>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  selfCenter: { alignSelf: 'center' },
  gap8: { gap: 8 },
  mt2: { marginTop: 2 },
  mt4: { marginTop: 4 },
  mt6: { marginTop: 6 },
  mt16: { marginTop: 16 },
  p16: { padding: 16 },
  disabled: { opacity: 0.3 },
  body: { paddingHorizontal: 16, paddingBottom: 128, gap: 16 },
  cancelled: { backgroundColor: '#FFF6F7' },
  stepCard: { borderRadius: 24, backgroundColor: colors.white, boxShadow: elev.e2, overflow: 'hidden' },
  stepHead: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.ink100 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inline6: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  acts: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pager: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.ink100 },
  pagerBtn: { flex: 1, height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  pagerDivider: { width: 1, backgroundColor: colors.ink100 },
  reason: { width: '100%', padding: 12, borderRadius: 12, borderWidth: 1 },
  reasonOn: { borderColor: colors.rose400, backgroundColor: colors.rose50 },
  reasonOff: { borderColor: colors.ink200 },
});
