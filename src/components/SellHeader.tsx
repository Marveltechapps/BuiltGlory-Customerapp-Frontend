import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNav, useScreen } from '../navigation/NavContext';
import { tw, twh } from '../theme';
import { ProgressBar } from './Form';
import { Icon } from './Icon';
import { WordReveal } from './Motion';
import { Press } from './Press';
import { T } from './T';

/** Step header of the listing wizard (`SellHeader`): back, progress, "n/7", animated title. */
export function SellHeader({
  step,
  totalSteps = 7,
  title,
  sub,
  onBack,
}: {
  step: number;
  totalSteps?: number;
  title: string;
  sub?: string;
  onBack?: () => void;
}) {
  const nav = useNav();
  const { firstVisit } = useScreen();
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Press
          onPress={onBack ?? nav.back}
          style={styles.back}
          accessibilityLabel="Back"
        >
          <Icon name="arrow-left" size={20} />
        </Press>
        <View style={styles.flex}>
          <ProgressBar value={(step / totalSteps) * 100} />
        </View>
        <T style={styles.count}>
          {step}/{totalSteps}
        </T>
      </View>
      <WordReveal text={title} disabled={!firstVisit} style={styles.title} />
      {sub ? <T style={styles.sub}>{sub}</T> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: tw('px-4 pt-1 pb-3'),
  row: { ...tw('flex items-center gap-2 mb-2.5'), marginLeft: -8 },
  back: tw('w-9 h-9 rounded-full items-center justify-center'),
  flex: tw('flex-1'),
  count: tw('num text-[11px] font-bold text-ink-500 shrink-0'),
  title: {
    ...twh('text-[24px] font-extrabold text-ink-900 leading-tight'),
    letterSpacing: 24 * -0.035,
  },
  sub: tw('text-[12.5px] text-ink-500 mt-1'),
});
