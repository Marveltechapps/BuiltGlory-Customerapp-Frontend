import React from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';
import { StatusHero } from '../../components/hero/StatusHero';
import { Icon } from '../../components/icons/Icon';
import { Grid } from '../../components/layout/Grid';
import { Screen } from '../../components/layout/Screen';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { Btn } from '../../components/ui/Btn';
import { EmptyState } from '../../components/ui/EmptyState';
import { T } from '../../components/ui/T';
import { jVisitRef } from '../../context/journeyStore';
import type { ScreenProps } from '../../navigation/types';
import { colors } from '../../theme';
import { formatINR } from '../../utils/format';
import { useResolvedProperty } from '../../utils/useResolvedProperty';

/** B-13 Visit confirmed */
export function VisitConfirmationScreen({ go, ctx }: ScreenProps) {
  const { property: p, loading } = useResolvedProperty(ctx);
  const isNRI: boolean = ctx?.isNRI || false;
  const ref = ctx?.referenceId || (p ? jVisitRef(p.id) : '—');

  if (loading) {
    return (
      <Screen>
        <View style={styles.load}><ActivityIndicator color={colors.brand600} /></View>
      </Screen>
    );
  }
  if (!p) {
    return (
      <Screen>
        <EmptyState icon="calendar-check" title="Visit confirmed" body="Your visit is booked. Open My Visits for details."
          action={<Btn onPress={() => go('myVisits')}>My Visits</Btn>} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <StatusHero icon="calendar-check" tone="success" />
        <T display s={22} w={700} align="center">Visit confirmed!</T>
        <T s={13} c={colors.ink500} align="center" style={styles.mt8}>We've added it to your calendar.</T>
      </View>
      <View style={styles.body}>
        <View style={styles.ticket}>
          <View style={styles.ticketHead}>
            <T s={11} upper ls={0.05} c="rgba(255,255,255,0.8)">Your visit</T>
            <T s={18} w={700} c="#FFFFFF" style={styles.mt4}>{ctx?.date || '—'}</T>
            <T s={13} c="#FFFFFF">{ctx?.slot || '—'}</T>
          </View>
          <View style={styles.ticketBody}>
            <View style={styles.row12}>
              <PhotoPlaceholder tag={p.id} style={styles.thumb} />
              <View style={styles.flex1}>
                <T s={13} w={600} truncate>{p.title}</T>
                <T s={11} c={colors.ink500}>{p.location}, {p.city}</T>
                <T s={12} w={700} c={colors.brand600} style={styles.mt2}>{formatINR(p.price)}</T>
              </View>
            </View>
            <Grid cols={2} gap={8} style={styles.meta}>
              <View><T s={10} c={colors.ink500}>Advisor</T><T s={12} w={600}>Builtglory</T></View>
              <View><T s={10} c={colors.ink500}>Reference</T><T s={12} w={600}>{ref}</T></View>
            </Grid>
          </View>
        </View>

        {isNRI && (
          <View style={styles.nri}>
            <View style={styles.row12}>
              <View style={styles.nriIcon}><Icon name="video" size={16} color="white" /></View>
              <View style={styles.flex1}>
                <T s={13} w={600} c={colors.blue900}>Video Call Available</T>
                <T s={12} c={colors.blue700} style={styles.mt2}>Schedule a live video tour with our advisor before visiting in person.</T>
              </View>
            </View>
            <Pressable onPress={() => go('nriVideoCall', { p, date: ctx?.date, slot: ctx?.slot })} style={({ pressed }) => [styles.nriBtn, { backgroundColor: pressed ? colors.blue700 : colors.blue600 }]}>
              <Icon name="video" size={14} color="white" />
              <T s={13} w={600} c="#FFFFFF">Schedule Video Call</T>
            </Pressable>
          </View>
        )}

        <Grid cols={2} gap={8} style={styles.mb12}>
          <Btn variant="outline" full icon="map-pin" onPress={() => Linking.openURL('https://maps.google.com/?q=' + encodeURIComponent(`${p.location}, ${p.city}`))}>Directions</Btn>
          <Btn variant="outline" full icon="calendar" onPress={() => go('rescheduleVisit', { p, date: ctx?.date, slot: ctx?.slot, visitId: ctx?.visitId })}>Reschedule</Btn>
        </Grid>
        <Btn full icon="list-checks" onPress={() => go('enquiryDetail', { p })}>Track deal progress</Btn>
        <Btn variant="outline" full style={styles.mt8} icon="calendar-check" onPress={() => go('myVisits')}>Go to My Visits</Btn>
        <Btn variant="ghost" full style={styles.mt4} onPress={() => go('home')}>Back to Home</Btn>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  load: { flex: 1, paddingVertical: 80, alignItems: 'center', justifyContent: 'center' },
  mt2: { marginTop: 2 },
  mt4: { marginTop: 4 },
  mt8: { marginTop: 8 },
  mb12: { marginBottom: 12 },
  row12: { flexDirection: 'row', gap: 12 },
  hero: { paddingHorizontal: 16, paddingTop: 32, alignItems: 'center' },
  body: { paddingHorizontal: 16, marginTop: 24 },
  ticket: { borderRadius: 14, borderWidth: 1, borderColor: colors.ink200, overflow: 'hidden', marginBottom: 16 },
  ticketHead: { backgroundColor: colors.brand600, paddingHorizontal: 16, paddingVertical: 12 },
  ticketBody: { padding: 16, gap: 12 },
  thumb: { width: 60, height: 60, borderRadius: 6 },
  meta: { paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.ink100 },
  nri: { borderRadius: 14, borderWidth: 1, borderColor: colors.blue200, backgroundColor: colors.blue50, padding: 16, marginBottom: 16 },
  nriIcon: { width: 40, height: 40, borderRadius: 9999, backgroundColor: colors.blue600, alignItems: 'center', justifyContent: 'center' },
  nriBtn: { width: '100%', marginTop: 12, height: 40, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
