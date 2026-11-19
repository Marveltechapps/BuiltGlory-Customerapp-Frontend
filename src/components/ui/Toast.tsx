import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { elev } from '../../theme';
import { StatusMark, type MarkKind } from '../hero/StatusMark';
import { PopIn } from './Motion';
import { T } from './T';

/** Dark floating toast with an animated status mark. Hidden when message is empty. */
export function Toast({ message, icon = 'check-circle', kind }: { message?: string | null; icon?: string; kind?: MarkKind; color?: string }) {
  const insets = useSafeAreaInsets();
  if (!message) return null;
  const k: MarkKind = kind ?? (/fail|error|invalid|unable|could not|couldn't|try again/i.test(message) || (/x|alert/.test(icon) && icon !== 'check-circle') ? 'error'
    : /warn|expire|pending/i.test(message) ? 'warn' : 'success');
  return (
    <View pointerEvents="none" style={[styles.wrap, { bottom: 80 + insets.bottom }]}>
      <PopIn key={message} duration={460}>
        <View style={styles.toast}>
          <StatusMark key={message} kind={k} size={24} delay={0.12} />
          <T s={13} w={600} c="#FFFFFF" style={styles.text}>{message}</T>
        </View>
      </PopIn>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, zIndex: 60 },
  toast: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14,
    backgroundColor: 'rgba(9,14,30,0.82)',
    boxShadow: elev.e3,
  },
  text: { flex: 1 },
});
