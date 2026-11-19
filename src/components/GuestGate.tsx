import React from 'react';
import { StyleSheet, View } from 'react-native';
import { meshes, tw, twh } from '../theme';
import { Btn } from './Btn';
import { Icon, type IconName } from './Icon';
import { Divided } from './Layout';
import { Pop } from './Motion';
import { Sheet } from './Sheet';
import { T } from './T';

const PERKS: Array<[IconName, string]> = [
  ['heart', 'Save properties and get price alerts'],
  ['message-circle', 'Enquire and book site visits'],
  ['tag', 'List and sell your property'],
];

/** Sign-in prompt shown when a guest opens an account-only action (screens-guest.jsx). */
export function GuestGate({
  visible,
  reason,
  onSignIn,
  onClose,
}: {
  visible: boolean;
  reason: string;
  onSignIn: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.head}>
        <View style={styles.lockWrap}>
          <Pop style={[StyleSheet.absoluteFill, styles.lockBg]} />
          <Icon name="lock" size={26} color="#FFFFFF" />
        </View>
        <T style={styles.title}>Sign in to {reason}</T>
        <T style={styles.body}>
          You're browsing as a guest. It takes less than a minute with your
          phone number.
        </T>
      </View>
      <Divided style={styles.perks} color="rgba(226,232,240,0.7)">
        {PERKS.map(([icon, text]) => (
          <View key={text} style={styles.perk}>
            <View style={styles.perkIcon}>
              <Icon name={icon} size={15} color="#1A6FFF" />
            </View>
            <T style={styles.perkText}>{text}</T>
          </View>
        ))}
      </Divided>
      <View style={styles.actions}>
        <Btn onPress={onSignIn} icon="log-in" style={styles.full}>
          Sign in with phone
        </Btn>
        <Btn variant="outline" onPress={onClose} style={styles.full}>
          Keep browsing
        </Btn>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  head: tw('items-center pt-1'),
  lockWrap: tw('w-16 h-16 items-center justify-center'),
  lockBg: {
    borderRadius: 16,
    experimental_backgroundImage: meshes.brand,
    opacity: 0.9,
  },
  title: { ...twh('text-[21px] font-extrabold text-ink-900 mt-4 text-center') },
  body: tw(
    'text-[13px] text-ink-500 mt-1.5 max-w-[270px] leading-relaxed text-center',
  ),
  perks: tw('mt-5 rounded-2xl bg-ink-50 border border-ink-200/70'),
  perk: tw('flex items-center gap-3 px-3.5 py-2.5'),
  perkIcon: tw(
    'w-8 h-8 rounded-xl bg-white border border-ink-200 items-center justify-center shrink-0',
  ),
  perkText: tw('flex-1 text-[13px] font-semibold'),
  actions: { ...tw('mt-5'), gap: 10 },
  full: { alignSelf: 'stretch' },
});
