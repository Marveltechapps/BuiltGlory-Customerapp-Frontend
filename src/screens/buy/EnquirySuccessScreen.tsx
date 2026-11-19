import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { StatusHero } from '../../components/hero/StatusHero';
import { Icon } from '../../components/icons/Icon';
import { Grid } from '../../components/layout/Grid';
import { Screen } from '../../components/layout/Screen';
import { Btn } from '../../components/ui/Btn';
import { Press } from '../../components/ui/Press';
import { T } from '../../components/ui/T';
import type { ScreenProps } from '../../navigation/types';
import { colors } from '../../theme';

const NEXT = ['Advisor calls within 1 hour', 'Answers on price, documents and loans', 'Status updates in My Enquiries'];

/** B-11 Enquiry submitted */
export function EnquirySuccessScreen({ go, ctx }: ScreenProps) {
  const p = ctx?.p;
  const isNRI: boolean = ctx?.isNRI || false;
  return (
    <Screen fill>
      <View style={styles.center}>
        <View style={styles.inner}>
          <StatusHero icon="check" tone="success" />
          <T display s={22} w={700} align="center">Enquiry submitted!</T>
          <T s={13} c={colors.ink500} lh={1.625} align="center" style={styles.sub}>
            Our advisor will call you within an hour. Track its progress in My Enquiries.
          </T>
          <View style={styles.next}>
            <T s={11} w={600} upper ls={0.05} c={colors.ink500}>What happens next</T>
            {NEXT.map(t => (
              <View key={t} style={styles.nextRow}>
                <Icon name="check-circle" size={14} color="#1A6FFF" />
                <T s={12.5}>{t}</T>
              </View>
            ))}
          </View>
          <Btn full style={styles.mt24} icon="inbox" onPress={() => go('myEnquiries')}>Go to My Enquiries</Btn>
          <Grid cols={2} gap={8} style={styles.mt8}>
            <Btn variant="outline" size="sm" full onPress={() => go('home')}>Home</Btn>
            <Btn variant="outline" size="sm" full onPress={() => go('propertyDetail', p ? { p } : undefined)}>View Property</Btn>
          </Grid>
          <Press onPress={() => go('visitCalendar', p ? { p, isNRI } : undefined)} style={styles.schedule}>
            <Icon name="calendar" size={13} color="#1A6FFF" />
            <T s={12.5} w={600} c={colors.brand600}>Want to see it in person? Schedule a visit separately</T>
          </Press>
          {isNRI && (
            <Pressable onPress={() => go('nriVideoCall', { p, isNRI })} style={({ pressed }) => [styles.nri, { backgroundColor: pressed ? colors.blue700 : colors.blue600 }]}>
              <Icon name="video" size={15} color="white" />
              <T s={13} w={600} c="#FFFFFF">NRI Video Call Schedule</T>
            </Pressable>
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  inner: { width: '100%', alignItems: 'center' },
  sub: { marginTop: 8, maxWidth: 250 },
  mt8: { marginTop: 8, alignSelf: 'stretch' },
  mt24: { marginTop: 24 },
  next: { marginTop: 24, padding: 12, backgroundColor: colors.ink50, borderRadius: 14, alignSelf: 'stretch', gap: 8 },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  schedule: { marginTop: 12, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  nri: { width: '100%', marginTop: 8, height: 40, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
