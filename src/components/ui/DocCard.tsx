import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, elev, ring } from '../../theme';
import { Icon } from '../icons/Icon';
import { T } from './T';

export interface DocCardProps {
  name: React.ReactNode;
  meta?: React.ReactNode;
  onView?: () => void;
  onDownload?: () => void;
  flagged?: boolean;
  reason?: React.ReactNode;
  action?: React.ReactNode;
}

/** PDF document row with view and download actions. */
export function DocCard({ name, meta, onView, onDownload, flagged, reason, action }: DocCardProps) {
  return (
    <View style={[styles.card, flagged ? styles.flagged : styles.normal]}>
      <View style={styles.row}>
        <View style={[styles.icon, flagged ? styles.iconFlag : styles.iconNormal]}>
          <Icon name="file-text" size={20} color={flagged ? '#D97706' : '#E11D48'} />
        </View>
        <Pressable onPress={onView} style={styles.text} accessibilityRole="button">
          <T s={13} w={600} truncate>{name}</T>
          {meta ? <T s={11} c={colors.ink500}>{meta}</T> : null}
        </Pressable>
        {onDownload ? (
          <Pressable onPress={onDownload} style={({ pressed }) => [styles.dl, pressed && styles.dlPressed]} accessibilityRole="button" accessibilityLabel="Download">
            <Icon name="download" size={15} color="#334155" />
          </Pressable>
        ) : null}
      </View>
      {flagged && reason ? (
        <View style={styles.reason}>
          <Icon name="triangle-alert" size={12} color="#D97706" style={styles.reasonIcon} />
          <T s={11.5} c={colors.amber800} style={styles.reasonText}>{reason}</T>
        </View>
      ) : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, backgroundColor: colors.white, boxShadow: elev.e1 },
  normal: { borderColor: colors.ink200 },
  // bg-white and bg-amber-50/30 are both on the design's card; bg-white wins in the generated CSS.
  flagged: { borderColor: colors.amber300, backgroundColor: colors.white },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconNormal: { backgroundColor: colors.rose50, boxShadow: ring(colors.rose100) },
  iconFlag: { backgroundColor: colors.amber50, boxShadow: ring(colors.amber200) },
  text: { flex: 1, minWidth: 0 },
  dl: { width: 36, height: 36, borderRadius: 9999, backgroundColor: colors.ink100, alignItems: 'center', justifyContent: 'center' },
  dlPressed: { backgroundColor: colors.ink200 },
  reason: { marginHorizontal: 12, marginBottom: 12, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, backgroundColor: colors.amber50, flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  reasonIcon: { marginTop: 3 },
  reasonText: { flex: 1 },
});
