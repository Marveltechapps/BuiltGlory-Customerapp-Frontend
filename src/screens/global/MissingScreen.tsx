import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from '../../components/icons/Icon';
import { AmbientBackground } from '../../components/layout/AmbientBackground';
import { Btn } from '../../components/ui/Btn';
import { T } from '../../components/ui/T';
import { colors, ring } from '../../theme';

/** Fallback when a route has no screen registered (same as the design's placeholder). */
export function MissingScreen({ name, onHome }: { name: string; onHome: () => void }) {
  return (
    <View style={styles.root}>
      <AmbientBackground />
      <View style={styles.icon}><Icon name="triangle-alert" size={24} color="#D97706" /></View>
      <View>
        <T display s={17} w={800} align="center">Screen unavailable</T>
        <T s={12.5} c={colors.ink500} align="center" style={styles.mt4}>No screen registered for “{name}”.</T>
      </View>
      <Btn variant="outline" size="sm" onPress={onHome} style={styles.self}>Back to Home</Btn>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
  icon: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.amber50, boxShadow: ring(colors.amber200), alignItems: 'center', justifyContent: 'center' },
  mt4: { marginTop: 4 },
  self: { alignSelf: 'center' },
});
