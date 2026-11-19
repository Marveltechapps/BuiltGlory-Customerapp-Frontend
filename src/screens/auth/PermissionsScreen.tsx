import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from '../../components/icons/Icon';
import { Screen, TopBar } from '../../components/layout/Screen';
import { SolidBtn } from '../../components/ui/SolidBtn';
import { T } from '../../components/ui/T';
import { Toggle } from '../../components/ui/Toggle';
import type { ScreenProps } from '../../navigation/types';
import { colors } from '../../theme';

const PERMS = [
  { id: 'cam', label: 'Camera', sub: 'Upload property photos and scan documents', icon: 'camera', required: true },
  { id: 'loc', label: 'Location', sub: 'Show listings near you and verify properties', icon: 'map-pin', required: true },
  { id: 'noti', label: 'Notifications', sub: 'Get alerts for new properties and offers', icon: 'bell', required: false },
  { id: 'cont', label: 'Contacts', sub: 'Refer friends and share listings easily', icon: 'users', required: false },
] as const;

/** S-08 App permissions */
export function PermissionsScreen({ onNext }: ScreenProps) {
  const [state, setState] = useState<Record<string, boolean>>({ cam: true, loc: true, noti: true, cont: false });
  return (
    <Screen>
      <TopBar title="App permissions" />
      <View style={styles.px6}>
        <T s={13} c={colors.ink500} style={styles.mb24}>Builtglory needs a few permissions to work its best. You can change these anytime in Settings.</T>
        <View style={styles.list}>
          {PERMS.map(p => (
            <View key={p.id} style={styles.row}>
              <View style={styles.icon}><Icon name={p.icon} size={20} color="#1A6FFF" /></View>
              <View style={styles.flex1}>
                <View style={styles.titleRow}>
                  <T s={14} w={600}>{p.label}</T>
                  <View style={[styles.tag, { backgroundColor: p.required ? colors.rose100 : colors.ink100 }]}>
                    <T s={9} w={700} c={p.required ? colors.rose600 : colors.ink500}>{p.required ? 'Required' : 'Optional'}</T>
                  </View>
                </View>
                <T s={11.5} c={colors.ink500}>{p.sub}</T>
              </View>
              <Toggle on={state[p.id]} onChange={v => setState({ ...state, [p.id]: v })} accessibilityLabel={p.label} />
            </View>
          ))}
        </View>
        <SolidBtn onPress={onNext} style={styles.mt24}>Finish Setup</SolidBtn>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  px6: { paddingHorizontal: 24 },
  flex1: { flex: 1 },
  mb24: { marginBottom: 24 },
  mt24: { marginTop: 24 },
  list: { gap: 12 },
  row: { padding: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.ink200, flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.brand50, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 9999 },
});
