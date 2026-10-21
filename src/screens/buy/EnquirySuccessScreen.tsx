import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Btn } from '../../components/Btn';
import { StatusHero } from '../../components/Hero';
import { Icon } from '../../components/Icon';
import { Grid } from '../../components/Layout';
import { Screen, SolidButton } from '../../components/Screen';
import { T } from '../../components/T';
import { useAuth } from '../../context/AuthContext';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { tw, twh } from '../../theme';

/** B-11 Enquiry submitted. */
export function EnquirySuccessScreen({
  params,
}: ScreenProps<'enquirySuccess'>) {
  const nav = useNav();
  const { user } = useAuth();
  const { property, enquiry } = params;
  const isNRI = user?.userType === 'nri' || user?.userType === 'pio';
  return (
    <Screen fill>
      <View style={styles.center}>
        <View style={styles.inner}>
          <StatusHero icon="check" tone="success" />
          <T style={styles.title}>Enquiry submitted!</T>
          <T style={styles.body}>
            Our advisor will call you within an hour. Track all your enquiries
            in History.
          </T>
          <View style={styles.next}>
            <T style={styles.nextLabel}>What happens next</T>
            {[
              'Advisor calls within 1 hour',
              'Site visit confirmed by SMS',
              'Offer & paperwork support',
            ].map(t => (
              <View key={t} style={styles.nextRow}>
                <Icon name="check-circle" size={14} color="#1A6FFF" />
                <T style={styles.nextText}>{t}</T>
              </View>
            ))}
          </View>
          <Grid cols={3} gap={8} style={styles.actions}>
            <Btn
              variant="outline"
              size="sm"
              wrap
              onPress={() => nav.jump('home')}
              style={styles.stretch}
            >
              Home
            </Btn>
            <Btn
              variant="outline"
              size="sm"
              wrap
              onPress={() =>
                nav.go('propertyDetail', { id: property.id, property })
              }
              style={styles.stretch}
            >
              View Property
            </Btn>
            <Btn
              size="sm"
              wrap
              onPress={() =>
                nav.go('visitCalendar', { property, enquiryId: enquiry._id })
              }
              style={styles.stretch}
            >
              Schedule Visit
            </Btn>
          </Grid>
          {isNRI && (
            <SolidButton
              tone="blue"
              height={40}
              label="NRI Video Call Schedule"
              icon={<Icon name="video" size={15} color="#FFFFFF" />}
              onPress={() =>
                nav.go('nriVideoCall', { property, enquiryId: enquiry._id })
              }
              style={styles.nri}
            />
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: tw('flex-1 items-center justify-center px-6'),
  inner: { width: '100%' },
  stretch: { alignSelf: 'stretch', paddingHorizontal: 6 },
  title: { ...twh('text-[22px] font-bold text-center') },
  body: tw(
    'text-ink-500 mt-2 max-w-[250px] self-center text-[13px] leading-relaxed text-center',
  ),
  next: { ...tw('mt-6 p-3 bg-ink-50 rounded-card'), gap: 8 },
  nextLabel: tw(
    'text-[11px] text-ink-500 font-semibold uppercase tracking-wider',
  ),
  nextRow: tw('flex items-center gap-2'),
  nextText: tw('text-[12.5px]'),
  actions: tw('mt-6'),
  nri: { ...tw('mt-2'), borderRadius: 14 },
});
