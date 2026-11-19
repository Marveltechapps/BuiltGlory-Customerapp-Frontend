import React from 'react';
import { StyleSheet } from 'react-native';
import { colors, elev } from '../../theme';
import { Icon } from '../icons/Icon';
import { Press } from './Press';

/** Favourite toggle shown on photo cards. */
export function Heart({ active, onPress, size = 16 }: { active?: boolean; onPress?: () => void; size?: number }) {
  return (
    <Press
      onPress={onPress}
      hitSlop={4}
      accessibilityLabel={active ? 'Remove from saved' : 'Save property'}
      style={[styles.heart, active ? styles.on : styles.off]}>
      <Icon name="heart" size={size} color={active ? '#E11D48' : colors.ink900} strokeWidth={active ? 2.4 : 2} fill={active ? '#E11D48' : 'none'} />
    </Press>
  );
}

const styles = StyleSheet.create({
  heart: { width: 32, height: 32, borderRadius: 9999, alignItems: 'center', justifyContent: 'center' },
  on: { backgroundColor: colors.white, boxShadow: elev.e2, transform: [{ scale: 1.05 }] },
  off: { backgroundColor: 'rgba(255,255,255,0.85)' },
});
