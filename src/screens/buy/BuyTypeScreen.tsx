import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen, TopBar } from '../../components/layout/Screen';
import { PropertyTypeGrid } from '../../components/PropertyTypeGrid';
import { T } from '../../components/ui/T';
import { BF_DEFAULT, setBF } from '../../context/journeyStore';
import type { ScreenProps } from '../../navigation/types';
import { colors } from '../../theme';

/** B-01 Property type selection */
export function BuyTypeScreen({ go, back }: ScreenProps) {
  return (
    <Screen>
      <TopBar onBack={back} title="Select Property Type" />
      <View style={styles.intro}>
        <T s={13} c={colors.ink500} align="center">What are you looking for?</T>
      </View>
      <PropertyTypeGrid onSelect={type => { setBF({ ...BF_DEFAULT }); go('buyList', { type }); }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { paddingHorizontal: 16, marginBottom: 16 },
});
