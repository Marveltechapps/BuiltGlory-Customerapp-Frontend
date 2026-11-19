import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../../components/icons/Icon';
import { JourneyLock } from '../../components/journey/JourneyParts';
import { DockBar } from '../../components/layout/AppScreen';
import { Card } from '../../components/layout/Groups';
import { Grid } from '../../components/layout/Grid';
import { Screen, TopBar } from '../../components/layout/Screen';
import { Btn } from '../../components/ui/Btn';
import { EmptyState } from '../../components/ui/EmptyState';
import { buzz, Press } from '../../components/ui/Press';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { T } from '../../components/ui/T';
import { getJ, jActiveBuyPid, jBuy, jFind, jScheduleVisit, useJ } from '../../context/journeyStore';
import type { ScreenProps } from '../../navigation/types';
import * as visits from '../../services/visits.service';
import { colors, elev, ring } from '../../theme';
import type { Property } from '../../types/property';
import { MONTHS_LONG } from '../../utils/dates';
import { errorMessage } from '../../utils/errorMessage';
import { useResolvedProperty } from '../../utils/useResolvedProperty';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface Ymd { y: number; m: number; d: number }
const cmp = (a: Ymd, b: Ymd) => (a.y !== b.y ? a.y - b.y : a.m !== b.m ? a.m - b.m : a.d - b.d);
const toIso = (d: Ymd) => `${d.y}-${String(d.m + 1).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
const labelDate = (d: Ymd) => `${MONTHS_LONG[d.m]} ${d.d}, ${d.y}`;
const tomorrowYmd = (): Ymd => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  t.setDate(t.getDate() + 1);
  return { y: t.getFullYear(), m: t.getMonth(), d: t.getDate() };
};

/** B-12 Schedule a visit */
function VisitCalendar({ go, back, ctx }: ScreenProps) {
  const { property: p, loading: loadingP } = useResolvedProperty(ctx);
  const min = useMemo(() => tomorrowYmd(), []);
  const [view, setView] = useState({ y: min.y, m: min.m });
  const [sel, setSel] = useState<Ymd>(min);
  const [slot, setSlot] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [availLoading, setAvailLoading] = useState(false);
  const [availError, setAvailError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const firstDow = new Date(view.y, view.m, 1).getDay();
  const isBeforeMinMonth = view.y < min.y || (view.y === min.y && view.m <= min.m);
  const cells = Array.from({ length: firstDow + daysInMonth }).map((_, i) => i - firstDow + 1);

  useEffect(() => {
    if (!p?.id) return;
    const ac = new AbortController();
    setAvailLoading(true);
    setAvailError(null);
    const from = toIso(sel);
    visits
      .getVisitAvailability({ propertyId: p.id, visitType: 'physical', from, days: 14 }, ac.signal)
      .then(res => {
        if (ac.signal.aborted) return;
        const day = (res.days || []).find(d => d.date === from) || (res.days || [])[0];
        const available = (day?.slots || []).filter(s => s.available).map(s => s.time);
        setSlots(available);
        setSlot(prev => (available.includes(prev) ? prev : available[0] || ''));
      })
      .catch(err => {
        if (ac.signal.aborted) return;
        setSlots([]);
        setSlot('');
        setAvailError(errorMessage(err));
      })
      .finally(() => {
        if (!ac.signal.aborted) setAvailLoading(false);
      });
    return () => ac.abort();
  }, [p?.id, sel]);

  const confirm = async () => {
    if (!p || !slot || busy) return;
    setBusy(true);
    setSubmitError(null);
    try {
      const buy = jBuy(p.id);
      const visit = await visits.createVisit({
        propertyId: p.id,
        enquiryId: buy?.enquiry?.enquiryId || buy?.enquiry?.id || ctx?.enquiryId,
        visitDate: toIso(sel),
        visitTime: slot,
        visitType: 'physical',
      });
      const vd = labelDate(sel);
      jScheduleVisit(p, vd, slot, false, {
        visitId: visit._id,
        ref: visit.referenceId,
        visitDateIso: visit.visitDate || toIso(sel),
      });
      go('visitConfirmation', { date: vd, slot, p, visitId: visit._id, referenceId: visit.referenceId });
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loadingP) {
    return (
      <Screen>
        <TopBar onBack={back} title="Schedule a visit" />
        <View style={styles.load}><ActivityIndicator color={colors.brand600} /></View>
      </Screen>
    );
  }
  if (!p) {
    return (
      <Screen>
        <TopBar onBack={back} title="Schedule a visit" />
        <EmptyState icon="building-2" title="Property not found" body="Choose a property first." action={<Btn onPress={back}>Go back</Btn>} />
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar onBack={back} title="Schedule a visit" sub="Separate from enquiries — tracked in My Visits" />
      <View style={styles.px4}>
        <View style={styles.monthRow}>
          <Pressable onPress={() => { if (!isBeforeMinMonth) setView(v => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 })); }} disabled={isBeforeMinMonth} style={({ pressed }) => [styles.round36, pressed && !isBeforeMinMonth && styles.hover]} accessibilityLabel="Previous month">
            <Icon name="chevron-left" size={18} color={isBeforeMinMonth ? colors.ink200 : colors.ink700} />
          </Pressable>
          <T s={14} w={600}>{MONTHS_LONG[view.m]} {view.y}</T>
          <Pressable onPress={() => setView(v => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }))} style={({ pressed }) => [styles.round36, pressed && styles.hover]} accessibilityLabel="Next month">
            <Icon name="chevron-right" size={18} color={colors.ink700} />
          </Pressable>
        </View>
        <Grid cols={7} gap={4} style={styles.mb4}>
          {DOW.map((d, i) => <T key={i} s={11} c={colors.ink500} align="center">{d}</T>)}
        </Grid>
        <Grid cols={7} gap={4}>
          {cells.map((dayN, i) => {
            if (dayN < 1) return <View key={i} />;
            const cell = { y: view.y, m: view.m, d: dayN };
            const isPast = cmp(cell, min) < 0, isToday = cmp(cell, min) === 0, isSel = cmp(cell, sel) === 0;
            return (
              <Pressable key={i} disabled={isPast} onPress={() => setSel(cell)}
                style={({ pressed }) => [styles.day, isSel ? styles.daySel : isToday ? styles.dayToday : pressed ? styles.dayHover : null]}>
                <T s={13} w={isSel || isToday ? 700 : 400} c={isSel ? colors.white : isToday ? colors.brand600 : isPast ? colors.ink300 : colors.ink700}>{dayN}</T>
              </Pressable>
            );
          })}
        </Grid>
        <T display s={14} w={600} style={styles.slotsTitle}>Available time slots</T>
        {availLoading ? (
          <ActivityIndicator color={colors.brand600} />
        ) : availError ? (
          <T s={12} c={colors.rose600}>{availError}</T>
        ) : slots.length === 0 ? (
          <T s={12} c={colors.ink500}>No slots available on this date. Try another day.</T>
        ) : (
          <Grid cols={4} gap={8}>
            {slots.map(s => (
              <Pressable key={s} onPress={() => setSlot(s)} style={[styles.slot, slot === s ? styles.slotOn : styles.slotOff]}>
                <T s={11.5} w={slot === s ? 600 : 400} c={slot === s ? colors.brand700 : colors.ink900}>{s}</T>
              </Pressable>
            ))}
          </Grid>
        )}
        <View style={styles.summary}>
          <Icon name="calendar" size={14} color="#1A6FFF" />
          <T s={12}>Visit on <T w={700}>{labelDate(sel)}{slot ? ` at ${slot}` : ''}</T></T>
        </View>
        {submitError ? <T s={12} c={colors.rose600} style={styles.mt8}>{submitError}</T> : null}
        <Btn full style={styles.mt16} disabled={!slot || busy} onPress={confirm}>{busy ? 'Confirming…' : 'Confirm visit'}</Btn>
      </View>
    </Screen>
  );
}

/** B-12 gate: a visit can be booked only after an enquiry. */
export function VisitGateScreen(props: ScreenProps) {
  useJ();
  const { property: resolved } = useResolvedProperty(props.ctx);
  const p: Property | undefined = resolved || props.ctx?.p || (getJ().activeBuy ? jFind(getJ().activeBuy as string) : undefined);
  const b = p && jBuy(p.id);
  if (!p || !b || !b.enquiry) {
    return (
      <Screen>
        <TopBar onBack={props.back} title="Schedule Visit" />
        <EmptyState icon="lock" title="Submit an enquiry first"
          body={p ? `Site visits for ${p.title} can be booked once your enquiry is submitted. Our advisor will call you, then you can pick a date.` : 'Choose a property and submit an enquiry before booking a site visit.'}
          action={<Btn icon="send" style={styles.selfCenter} onPress={() => props.go(p ? 'enquiry' : 'buyTypes', p ? { p } : undefined)}>{p ? 'Submit enquiry' : 'Browse properties'}</Btn>} />
      </Screen>
    );
  }
  return <VisitCalendar {...props} />;
}

/** B-12a Reschedule visit */
export function RescheduleScreen({ go, back, ctx }: ScreenProps) {
  const s = useJ();
  const pid = jActiveBuyPid(ctx);
  const b = s.buys.find(x => x.pid === pid && !x.cancelled);
  const { property: resolved } = useResolvedProperty(ctx);
  const p: Property | undefined = resolved || (pid ? jFind(pid) : undefined) || ctx?.p;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const min = tomorrowYmd();
  const [mo, setMo] = useState({ y: min.y, m: min.m });
  const [sel, setSel] = useState<Ymd | null>(null);
  const [slot, setSlot] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!p?.id || !sel) {
      setSlots([]);
      return;
    }
    const ac = new AbortController();
    visits
      .getVisitAvailability({ propertyId: p.id, visitType: 'physical', from: toIso(sel), days: 7 }, ac.signal)
      .then(res => {
        if (ac.signal.aborted) return;
        const day = (res.days || []).find(d => d.date === toIso(sel));
        const available = (day?.slots || []).filter(x => x.available).map(x => x.time);
        setSlots(available);
        setSlot(prev => (available.includes(prev) ? prev : available[0] || ''));
      })
      .catch(() => {
        if (!ac.signal.aborted) setSlots([]);
      });
    return () => ac.abort();
  }, [p?.id, sel]);

  if (!p || !b || !b.visit) {
    return <JourneyLock back={back} title="Reschedule visit" body="There's no visit booked to reschedule. Book one from the property page." action={() => go(p ? 'visitCalendar' : 'buyTypes', { p })} label={p ? 'Schedule a visit' : 'Browse properties'} />;
  }
  const visit = b.visit;
  const first = new Date(mo.y, mo.m, 1).getDay(), dim = new Date(mo.y, mo.m + 1, 0).getDate();
  const max = new Date(now);
  max.setDate(max.getDate() + 60);
  const label = sel ? labelDate(sel) : '';
  const same = label === visit.date && slot === visit.slot;
  const shift = (k: number) => setMo(({ y, m }) => { const d = new Date(y, m + k, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const canPrev = mo.y > min.y || (mo.y === min.y && mo.m > min.m);
  const canNext = new Date(mo.y, mo.m + 1, 1) <= max;
  const confirm = async () => {
    if (!sel || !slot || same || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (visit.visitId) {
        await visits.rescheduleVisit(visit.visitId, { visitDate: toIso(sel), visitTime: slot });
      } else {
        await visits.createVisit({
          propertyId: p.id,
          enquiryId: b.enquiry?.enquiryId || b.enquiry?.id,
          visitDate: toIso(sel),
          visitTime: slot,
          visitType: 'physical',
        });
      }
      jScheduleVisit(p, label, slot, true, {
        visitId: visit.visitId,
        ref: visit.ref,
        visitDateIso: toIso(sel),
      });
      buzz(12);
      go('visitConfirmation', { date: label, slot, p, rescheduled: true, visitId: visit.visitId });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  const cells: (number | null)[] = [...Array.from({ length: first }).map(() => null), ...Array.from({ length: dim }).map((_, i) => i + 1)];
  return (
    <Screen footer={<DockBar legacy><Btn full disabled={!sel || !slot || same || busy} onPress={confirm}>{busy ? 'Rescheduling…' : sel && slot ? `Move to ${label}, ${slot}` : 'Pick a date and time'}</Btn></DockBar>}>
      <TopBar onBack={back} title="Reschedule visit" sub={p.title} />
      <View style={styles.rBody}>
        <View style={styles.current}>
          <Icon name="calendar-x" size={18} color="#D97706" />
          <View>
            <T s={11} w={700} upper ls={0.08} c={colors.amber700}>Current booking</T>
            <T s={13} w={700}>{visit.date} · {visit.slot}</T>
          </View>
        </View>
        <Card pad={12}>
          <View style={[styles.monthRow, styles.mb8]}>
            <Press disabled={!canPrev} onPress={() => shift(-1)} accessibilityLabel="Previous month" style={[styles.round36, !canPrev && styles.dim]}><Icon name="chevron-left" size={18} /></Press>
            <T display s={15} w={700}>{MONTHS_LONG[mo.m]} {mo.y}</T>
            <Press disabled={!canNext} onPress={() => shift(1)} accessibilityLabel="Next month" style={[styles.round36, !canNext && styles.dim]}><Icon name="chevron-right" size={18} /></Press>
          </View>
          <Grid cols={7} style={styles.mb4}>
            {DOW.map((d, i) => <T key={i} s={10.5} w={700} c={colors.ink400} align="center">{d}</T>)}
          </Grid>
          <Grid cols={7} gap={4}>
            {cells.map((d, i) => {
              if (d == null) return <View key={'e' + i} />;
              const dt = new Date(mo.y, mo.m, d);
              const cell = { y: mo.y, m: mo.m, d };
              const off = cmp(cell, min) < 0 || dt > max || dt.getDay() === 0;
              const on = !!sel && sel.y === mo.y && sel.m === mo.m && sel.d === d;
              return (
                <Pressable key={d} disabled={off} onPress={() => { setSel({ y: mo.y, m: mo.m, d }); buzz(); }}
                  style={({ pressed }) => [styles.rDay, on ? styles.rDayOn : pressed && !off ? { backgroundColor: colors.brand50 } : null]}>
                  <T num s={13} w={600} c={on ? colors.white : off ? colors.ink300 : colors.ink800}>{d}</T>
                </Pressable>
              );
            })}
          </Grid>
          <T s={11} c={colors.ink400} style={styles.mt8}>Sundays unavailable · up to 60 days ahead</T>
        </Card>
        <View>
          <SectionTitle>Time slot</SectionTitle>
          <Grid cols={4} gap={8}>
            {(slots.length ? slots : ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM']).map(x => (
              <Press key={x} onPress={() => setSlot(x)} style={[styles.rSlot, slot === x ? styles.slotOn : styles.slotOff]}>
                <T s={12} w={600} c={slot === x ? colors.brand700 : colors.ink900}>{x}</T>
              </Press>
            ))}
          </Grid>
        </View>
        {same && <View style={styles.same}><T s={12} c={colors.amber700}>That's your current booking. Pick a different date or time.</T></View>}
        {error ? <T s={12} c={colors.rose600}>{error}</T> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  px4: { paddingHorizontal: 16 },
  load: { paddingVertical: 64, alignItems: 'center' },
  selfCenter: { alignSelf: 'center' },
  mb4: { marginBottom: 4 },
  mb8: { marginBottom: 8 },
  mt8: { marginTop: 8 },
  mt16: { marginTop: 16 },
  dim: { opacity: 0.3 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  round36: { width: 36, height: 36, borderRadius: 9999, alignItems: 'center', justifyContent: 'center' },
  hover: { backgroundColor: colors.ink100 },
  day: { aspectRatio: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  daySel: { backgroundColor: colors.brand600 },
  dayToday: { borderWidth: 1, borderColor: colors.brand600 },
  dayHover: { backgroundColor: colors.ink50 },
  slotsTitle: { marginTop: 20, marginBottom: 8 },
  slot: { paddingVertical: 10, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  slotOn: { borderColor: colors.brand600, backgroundColor: colors.brand50 },
  slotOff: { borderColor: colors.ink200 },
  summary: { marginTop: 16, padding: 12, backgroundColor: colors.ink50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  rBody: { paddingHorizontal: 16, paddingBottom: 128, gap: 16 },
  current: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, backgroundColor: colors.amber50, boxShadow: ring(colors.amber200) },
  rDay: { height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rDayOn: { backgroundColor: colors.brand600, boxShadow: elev.brand },
  rSlot: { height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  same: { backgroundColor: colors.amber50, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
});
