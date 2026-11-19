import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Btn } from '../../components/Btn';
import { StatusHero } from '../../components/Hero';
import { Press } from '../../components/Press';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { tw, twh } from '../../theme';

/** B-15a Token payment could not be recorded. */
export function PaymentFailureScreen({
  params,
}: ScreenProps<'paymentFailure'>) {
  const nav = useNav();
  const retry = () => nav.popTo('payment', { enquiryId: params.enquiryId });
  return (
    <Screen fill>
      <View style={styles.center}>
        <View style={styles.inner}>
          <StatusHero icon="circle-x" tone="error" />
          <T style={styles.title}>Payment failed</T>
          <T style={styles.body}>
            Your token payment could not be confirmed.{' '}
            <T style={styles.reason}>Reason: {params.reason}</T> No amount was
            deducted.
          </T>
          <View style={styles.actions}>
            <Btn style={styles.full} icon="rotate-cw" onPress={retry}>
              Try Again
            </Btn>
            <Btn
              variant="outline"
              style={styles.full}
              icon="arrow-left-right"
              onPress={retry}
            >
              Choose a Different Method
            </Btn>
          </View>
          <Press
            onPress={() => nav.go('help')}
            pressScale={1}
            style={styles.support}
          >
            <T style={styles.supportText}>Contact Support</T>
          </Press>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: tw('flex-1 items-center justify-center px-6'),
  inner: { width: '100%', alignItems: 'center' },
  title: { ...twh('text-[21px] font-bold text-center') },
  body: tw(
    'text-ink-500 mt-2 text-[13px] max-w-[260px] leading-relaxed text-center',
  ),
  reason: tw('text-[13px] font-bold text-ink-700'),
  actions: { ...tw('mt-6 w-full'), gap: 8 },
  full: tw('w-full'),
  support: tw('mt-4'),
  supportText: tw('text-[13px] text-brand-600 font-semibold'),
});
