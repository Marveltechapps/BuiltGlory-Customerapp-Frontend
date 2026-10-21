import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, type IconName } from '../../components/Icon';
import { Grid } from '../../components/Layout';
import { Press } from '../../components/Press';
import { Screen, ScreenFooter, SolidButton } from '../../components/Screen';
import { SellHeader } from '../../components/SellHeader';
import { T } from '../../components/T';
import { EXTRA_AMENITIES, SPECS } from '../../config/catalog';
import { useSellFlow } from '../../context/SellFlowContext';
import { useNav } from '../../navigation/NavContext';
import { tw } from '../../theme';
import { useBackgroundDraftSave } from './sellShared';

const ALL: Array<{ label: string; icon: IconName }> = [
  ...SPECS,
  ...EXTRA_AMENITIES.map(label => ({ label, icon: 'sparkles' as IconName })),
];

/** SL-05 Amenities (step 5/7). */
export function SellAmenitiesScreen() {
  const nav = useNav();
  const { form, set } = useSellFlow();
  const saveInBackground = useBackgroundDraftSave();
  const selected = new Set(form.amenities);
  const count = ALL.filter(a => selected.has(a.label)).length;
  const toggle = (label: string) =>
    set(
      'amenities',
      selected.has(label)
        ? form.amenities.filter(a => a !== label)
        : [...form.amenities, label],
    );

  return (
    <Screen
      footer={
        <ScreenFooter>
          <SolidButton
            label="Continue to Photos"
            onPress={() => {
              saveInBackground(5);
              nav.go('sellPhotos');
            }}
          />
        </ScreenFooter>
      }
    >
      <SellHeader step={5} title="Amenities" />
      <View style={styles.body}>
        <T style={styles.count}>
          Selected <T style={styles.countNum}>{count}</T> of {ALL.length}
        </T>
        <Grid cols={3} gap={8}>
          {ALL.map(a => {
            const on = selected.has(a.label);
            return (
              <Press
                key={a.label}
                onPress={() => toggle(a.label)}
                style={[styles.tile, on ? styles.tileOn : styles.tileOff]}
              >
                <Icon
                  name={a.icon}
                  size={18}
                  color={on ? '#059669' : '#94A3B8'}
                />
                <T style={styles.label}>{a.label}</T>
                {on && (
                  <View style={styles.check}>
                    <Icon name="check-circle" size={12} color="#059669" />
                  </View>
                )}
              </Press>
            );
          })}
        </Grid>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: tw('px-4 mt-4 pb-24'),
  count: tw('text-[12px] text-ink-500 mb-3'),
  countNum: tw('text-[12px] font-bold text-emerald-700'),
  tile: tw('p-2.5 rounded-card border items-center gap-1.5'),
  tileOn: tw('border-emerald-500 bg-emerald-50'),
  tileOff: tw('border-ink-200'),
  label: tw('text-[10px] text-center font-medium leading-tight'),
  check: tw('absolute top-1.5 right-1.5'),
});
