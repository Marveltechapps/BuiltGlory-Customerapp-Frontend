import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PropertyTypeGrid } from '../../components/PropertyTypeGrid';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { useNav } from '../../navigation/NavContext';
import { tw } from '../../theme';

/** B-01 Property type selection. */
export function BuyTypeScreen() {
  const nav = useNav();
  return (
    <Screen topBar={{ title: 'Select Property Type', back: true }}>
      <View style={styles.lead}>
        <T style={styles.leadText}>What are you looking for?</T>
      </View>
      <PropertyTypeGrid
        onSelect={t =>
          nav.go('buyList', { filters: { typeId: t.id, apiType: t.apiType } })
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: tw('px-4 mb-4'),
  leadText: tw('text-[13px] text-ink-500 text-center'),
});
