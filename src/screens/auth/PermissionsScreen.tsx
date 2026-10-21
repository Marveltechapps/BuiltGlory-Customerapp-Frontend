import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Toggle } from '../../components/Form';
import { Icon, type IconName } from '../../components/Icon';
import { Screen, SolidButton } from '../../components/Screen';
import { T } from '../../components/T';
import { useNav } from '../../navigation/NavContext';
import { tw } from '../../theme';
import { requestCameraPermission } from '../../utils/media';
import { readJson, STORAGE_KEYS, writeJson } from '../../utils/storage';

type PermId = 'cam' | 'loc' | 'noti' | 'cont';
const PERMS: Array<{
  id: PermId;
  label: string;
  sub: string;
  icon: IconName;
  required: boolean;
}> = [
  {
    id: 'cam',
    label: 'Camera',
    sub: 'Upload property photos and scan documents',
    icon: 'camera',
    required: true,
  },
  {
    id: 'loc',
    label: 'Location',
    sub: 'Show listings near you and verify properties',
    icon: 'map-pin',
    required: true,
  },
  {
    id: 'noti',
    label: 'Notifications',
    sub: 'Get alerts for new properties and offers',
    icon: 'bell',
    required: false,
  },
  {
    id: 'cont',
    label: 'Contacts',
    sub: 'Refer friends and share listings easily',
    icon: 'users',
    required: false,
  },
];

/** S-08 App permissions. Camera is requested from the OS (used for listing photos); the other choices are stored as preferences. */
export function PermissionsScreen() {
  const nav = useNav();
  const [state, setState] = useState<Record<PermId, boolean>>({
    cam: true,
    loc: true,
    noti: true,
    cont: false,
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    readJson(
      STORAGE_KEYS.permissions,
      null as Record<PermId, boolean> | null,
    ).then(saved => saved && setState(saved));
  }, []);

  const finish = async () => {
    setBusy(true);
    try {
      if (state.cam) await requestCameraPermission().catch(() => false);
      await writeJson(STORAGE_KEYS.permissions, state);
    } finally {
      setBusy(false);
      nav.reset('home');
    }
  };

  return (
    <Screen topBar={{ title: 'App permissions', back: true }}>
      <View style={styles.body}>
        <T style={styles.lead}>
          Builtglory needs a few permissions to work its best. You can change
          these anytime in Settings.
        </T>
        <View style={styles.list}>
          {PERMS.map(p => (
            <View key={p.id} style={styles.row}>
              <View style={styles.iconTile}>
                <Icon name={p.icon} size={20} color="#1A6FFF" />
              </View>
              <View style={styles.flex}>
                <View style={styles.titleRow}>
                  <T style={styles.title}>{p.label}</T>
                  <View
                    style={[
                      styles.pill,
                      p.required ? styles.pillReq : styles.pillOpt,
                    ]}
                  >
                    <T
                      style={[
                        styles.pillText,
                        p.required ? styles.pillReqText : styles.pillOptText,
                      ]}
                    >
                      {p.required ? 'Required' : 'Optional'}
                    </T>
                  </View>
                </View>
                <T style={styles.sub}>{p.sub}</T>
              </View>
              <Toggle
                on={state[p.id]}
                onChange={v => setState(s => ({ ...s, [p.id]: v }))}
              />
            </View>
          ))}
        </View>
        <SolidButton
          label="Finish Setup"
          onPress={finish}
          loading={busy}
          style={styles.cta}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: tw('flex-1'),
  body: tw('px-6'),
  lead: tw('text-[13px] text-ink-500 mb-6'),
  list: { gap: 12 },
  row: tw('p-3 rounded-card border border-ink-200 flex items-center gap-3'),
  iconTile: tw('w-11 h-11 rounded-xl bg-brand-50 items-center justify-center'),
  titleRow: tw('flex items-center gap-1.5'),
  title: tw('text-[14px] font-semibold'),
  pill: tw('px-1.5 py-0.5 rounded-full'),
  pillReq: tw('bg-rose-100'),
  pillOpt: tw('bg-ink-100'),
  pillText: { fontSize: 9, lineHeight: 13.5, fontFamily: 'Inter-Bold' },
  pillReqText: tw('text-rose-600'),
  pillOptText: tw('text-ink-500'),
  sub: tw('text-[11.5px] text-ink-500'),
  cta: tw('mt-6'),
});
