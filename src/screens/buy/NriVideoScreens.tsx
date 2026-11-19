import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { StatusHero } from '../../components/hero/StatusHero';
import { Icon } from '../../components/icons/Icon';
import { Grid } from '../../components/layout/Grid';
import { BottomBar, Screen, TopBar } from '../../components/layout/Screen';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { Btn } from '../../components/ui/Btn';
import { EmptyState } from '../../components/ui/EmptyState';
import { SolidBtn } from '../../components/ui/SolidBtn';
import { T } from '../../components/ui/T';
import { jBuy, jScheduleVisit } from '../../context/journeyStore';
import type { ScreenProps } from '../../navigation/types';
import * as visits from '../../services/visits.service';
import { colors } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { formatINR } from '../../utils/format';
import { useResolvedProperty } from '../../utils/useResolvedProperty';

const LANGS: [string, string][] = [['English', 'English'], ['Tamil', 'Tamil'], ['Hindi', 'Hindi'], ['Kannada', 'Kannada']];

function Option({ on, label, onPress, full, pad = 10 }: { on: boolean; label: string; onPress: () => void; full?: boolean; pad?: number }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.opt, { paddingVertical: pad }, full && styles.optFull, on ? styles.optOn : pressed ? styles.optHover : styles.optOff]}>
      <T s={full ? 13 : 12} w={500} c={on ? colors.brand700 : colors.ink900} align={full ? 'left' : 'center'}>{label}</T>
    </Pressable>
  );
}

function formatDayLabel(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

/** B-13a NRI video call scheduling */
export function NRIVideoCallScreen({ go, back, ctx }: ScreenProps) {
  const { property: p, loading: loadingP, error: propertyError } = useResolvedProperty(ctx);
  const [dates, setDates] = useState<Array<{ date: string; slots: string[] }>>([]);
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [language, setLanguage] = useState('English');
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fromIso = useMemo(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return t.toISOString().slice(0, 10);
  }, []);

  useEffect(() => {
    if (!p?.id) return;
    const ac = new AbortController();
    setLoadingAvail(true);
    visits
      .getVisitAvailability({ propertyId: p.id, visitType: 'virtual', from: fromIso, days: 7 }, ac.signal)
      .then(res => {
        if (ac.signal.aborted) return;
        const next = (res.days || []).map(d => ({
          date: d.date,
          slots: (d.slots || []).filter(s => s.available).map(s => s.time),
        })).filter(d => d.slots.length > 0);
        setDates(next);
        if (next[0]) {
          setDate(next[0].date);
          setSlot(next[0].slots[0] || '');
        }
      })
      .catch(err => {
        if (ac.signal.aborted) return;
        setError(errorMessage(err));
        setDates([]);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoadingAvail(false);
      });
    return () => ac.abort();
  }, [p?.id, fromIso]);

  const slotsForDate = dates.find(d => d.date === date)?.slots || [];

  const schedule = async () => {
    if (!p || !date || !slot || busy) return;
    setBusy(true);
    setError(null);
    try {
      const buy = jBuy(p.id);
      const visit = await visits.createVisit({
        propertyId: p.id,
        enquiryId: buy?.enquiry?.enquiryId || buy?.enquiry?.id || ctx?.enquiryId,
        visitDate: date,
        visitTime: slot,
        visitType: 'virtual',
        preferredLanguage: language,
      });
      jScheduleVisit(p, formatDayLabel(date), slot, false, {
        visitId: visit._id,
        ref: visit.referenceId,
        visitDateIso: date,
      });
      go('nriVideoConfirm', { p, date: formatDayLabel(date), slot, language, visitId: visit._id });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loadingP) {
    return (
      <Screen>
        <TopBar onBack={back} title="Schedule Video Call" />
        <View style={styles.load}><ActivityIndicator color={colors.brand600} /></View>
      </Screen>
    );
  }
  if (!p) {
    return (
      <Screen>
        <TopBar onBack={back} title="Schedule Video Call" />
        <EmptyState icon="video" title="Property not found" body={propertyError || 'Choose a property first.'} action={<Btn onPress={back}>Go back</Btn>} />
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <BottomBar>
          <SolidBtn disabled={!date || !slot || busy} onPress={schedule}>{busy ? 'Scheduling…' : 'Schedule Video Call'}</SolidBtn>
        </BottomBar>
      }>
      <TopBar onBack={back} title="Schedule Video Call" sub="NRI Property Tour" />
      <View style={styles.body}>
        <View style={styles.prop}>
          <PhotoPlaceholder tag={p.id} style={styles.thumb} />
          <View style={styles.flex1}>
            <T s={13} w={600} truncate>{p.title}</T>
            <T s={11} c={colors.ink500} truncate>{p.location}</T>
            <T s={12} w={700} c={colors.brand600}>{formatINR(p.price)}</T>
          </View>
        </View>
        <View style={styles.mb16}>
          <T s={13} w={600} style={styles.mb8}>Preferred Language</T>
          <Grid cols={2} gap={8}>
            {LANGS.map(([code, name]) => <Option key={code} on={language === code} label={name} onPress={() => setLanguage(code)} />)}
          </Grid>
        </View>
        <View style={styles.mb16}>
          <T s={13} w={600} style={styles.mb8}>Select Date</T>
          {loadingAvail ? (
            <ActivityIndicator color={colors.brand600} />
          ) : dates.length === 0 ? (
            <T s={12} c={colors.ink500}>No video slots available right now.</T>
          ) : (
            <Grid cols={3} gap={8}>
              {dates.map(d => (
                <Option
                  key={d.date}
                  on={date === d.date}
                  label={formatDayLabel(d.date)}
                  onPress={() => { setDate(d.date); setSlot(d.slots[0] || ''); }}
                  pad={8}
                />
              ))}
            </Grid>
          )}
        </View>
        <View style={styles.mb24}>
          <T s={13} w={600} style={styles.mb8}>Select Time (IST)</T>
          <View style={styles.gap8}>
            {slotsForDate.map(s => <Option key={s} on={slot === s} label={s} onPress={() => setSlot(s)} full pad={12} />)}
          </View>
        </View>
        {error ? <T s={12} c={colors.rose600} style={styles.mb16}>{error}</T> : null}
        <View style={styles.info}>
          <View style={styles.infoRow}>
            <Icon name="info" size={16} color="#2563EB" style={styles.mt2} />
            <View style={styles.flex1}>
              <T s={12} w={600} c={colors.blue900}>Live Video Tour</T>
              <T s={11} c={colors.blue700} style={styles.mt2}>Our advisor will give you a complete property walkthrough via video call. Duration: 30-45 minutes.</T>
            </View>
          </View>
        </View>
      </View>
    </Screen>
  );
}

/** B-13b NRI video call confirmed */
export function NRIVideoCallConfirmScreen({ go, ctx }: ScreenProps) {
  const { property: p, loading } = useResolvedProperty(ctx);
  if (loading) {
    return (
      <Screen fill>
        <View style={styles.center}><ActivityIndicator color={colors.brand600} /></View>
      </Screen>
    );
  }
  return (
    <Screen fill>
      <View style={styles.center}>
        <View style={styles.inner}>
          <StatusHero icon="video" tone="info" />
          <T display s={22} w={700} align="center">Video call scheduled!</T>
          <T s={13} c={colors.ink500} lh={1.625} align="center" style={styles.sub}>Your NRI property tour is confirmed. Our advisor will call you at the scheduled time.</T>
          <View style={styles.details}>
            <T s={12} w={600} upper ls={0.05} c={colors.ink500}>Call Details</T>
            <View>
              <T s={11} c={colors.ink500}>Property</T>
              <T s={13} w={600}>{p?.title || '—'}</T>
            </View>
            <Grid cols={2} gap={16}>
              <View><T s={11} c={colors.ink500}>Date</T><T s={13} w={600}>{ctx?.date}</T></View>
              <View><T s={11} c={colors.ink500}>Time (IST)</T><T s={13} w={600}>{ctx?.slot}</T></View>
            </Grid>
            <View>
              <T s={11} c={colors.ink500}>Language</T>
              <T s={13} w={600} style={styles.capitalize}>{ctx?.language || 'English'}</T>
            </View>
            <T s={11} c={colors.ink500} style={styles.note}>You'll receive a call link 10 minutes before the scheduled time</T>
          </View>
          <View style={styles.actions}>
            <Btn variant="outline" flex onPress={() => go('myVisits')}>My Visits</Btn>
            <Btn flex onPress={() => go('home')}>Home</Btn>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  load: { paddingVertical: 64, alignItems: 'center' },
  mt2: { marginTop: 2 },
  mb8: { marginBottom: 8 },
  mb16: { marginBottom: 16 },
  mb24: { marginBottom: 24 },
  gap8: { gap: 8 },
  capitalize: { textTransform: 'capitalize' },
  body: { paddingHorizontal: 16, paddingBottom: 96 },
  prop: { borderRadius: 14, borderWidth: 1, borderColor: colors.ink200, padding: 12, marginBottom: 16, flexDirection: 'row', gap: 12 },
  thumb: { width: 56, height: 56, borderRadius: 6 },
  opt: { borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  optFull: { width: '100%', paddingHorizontal: 12, alignItems: 'flex-start' },
  optOn: { borderColor: colors.brand600, backgroundColor: colors.brand50 },
  optOff: { borderColor: colors.ink200 },
  optHover: { borderColor: colors.brand300 },
  info: { borderRadius: 14, backgroundColor: colors.blue50, borderWidth: 1, borderColor: colors.blue200, padding: 16, marginBottom: 16 },
  infoRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  inner: { width: '100%', alignItems: 'center' },
  sub: { marginTop: 8, maxWidth: 280 },
  details: { marginTop: 24, alignSelf: 'stretch', borderRadius: 14, borderWidth: 1, borderColor: colors.ink200, padding: 16, gap: 12 },
  note: { fontStyle: 'italic', paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.ink100 },
  actions: { marginTop: 24, flexDirection: 'row', gap: 8, alignSelf: 'stretch' },
});
