import React from 'react';
import { StyleSheet } from 'react-native';
import { colors, gradients } from '../../theme';
import { Icon } from '../icons/Icon';
import { Press } from './Press';
import { T } from './T';

export interface ChipProps {
  active?: boolean;
  children?: React.ReactNode;
  onPress?: () => void;
  icon?: string;
}

/** Filter chip: white outline, or brand gradient when active. */
export function Chip({ active, children, onPress, icon }: ChipProps) {
  const c = active ? colors.white : colors.ink700;
  return (
    <Press onPress={onPress} style={[styles.chip, active ? styles.on : styles.off]} accessibilityState={{ selected: !!active }}>
      {icon ? <Icon name={icon} size={12} color={c} /> : null}
      <T s={12} w={600} c={c} numberOfLines={1}>{children}</T>
    </Press>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
  },
  on: {
    borderColor: 'transparent',
    experimental_backgroundImage: gradients.primarySoft,
    boxShadow: '0 4px 12px -3px rgba(26,111,255,0.6)',
  },
  off: { backgroundColor: colors.white, borderColor: colors.ink200 },
});
