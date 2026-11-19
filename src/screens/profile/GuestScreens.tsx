import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../components/icons/Icon';
import { BottomNav } from '../../components/layout/BottomNav';
import { Card, InsetGroup, Row } from '../../components/layout/Groups';
import { Screen } from '../../components/layout/Screen';
import { Btn } from '../../components/ui/Btn';
import { Float } from '../../components/ui/Float';
import { PopIn, Stagger } from '../../components/ui/Motion';
import { DragSheet } from '../../components/ui/Sheet';
import { T } from '../../components/ui/T';
import type { ScreenName, ScreenProps } from '../../navigation/types';
import { colors, gradients, ring } from '../../theme';

/** Screens a guest must sign in for, with the reason shown in the gate. */
export const GUEST_GATED: Partial<Record<ScreenName | 'fav', string>> & { fav: string; sellType: string } = {
  enquiry: 'submit an enquiry', visitCalendar: 'schedule a site visit', rescheduleVisit: 'reschedule a visit',
  nriVideoCall: 'book an NRI video call', sellType: 'list a property', sellIntent: 'list a property',
  myListings: 'see your listings', myEnquiries: 'track your enquiries', notifications: 'get notifications',
  profileEdit: 'edit your profile', favorites: 'save properties', fav: 'save properties',
};

const PERKS: [string, string][] = [
  ['heart', 'Save properties and get price alerts'],
  ['message-circle', 'Enquire and book site visits'],
  ['tag', 'List and sell your property'],
];

/** Sign-in gate sheet shown when a guest taps a gated action. */
export function GuestGate({ reason, onSignIn, onClose }: { reason: string; onSignIn: () => void; onClose: () => void }) {
  return (
    <DragSheet onClose={onClose}>
      <View style={styles.gateTop}>
        <View style={styles.lockWrap}>
          <PopIn style={[StyleSheet.absoluteFill, styles.lockBg]} />
          <Icon name="lock" size={26} color="white" />
        </View>
        <T display s={21} w={800} ls={-0.025} align="center" style={styles.mt16}>Sign in to {reason}</T>
        <T s={13} c={colors.ink500} lh={1.625} align="center" style={styles.gateSub}>You're browsing as a guest. It takes less than a minute with your phone number.</T>
      </View>
      <Stagger style={styles.perks} step={50}>
        {PERKS.map(([i, t], k) => (
          <View key={t} style={[styles.perk, k > 0 && styles.perkDivider]}>
            <View style={styles.perkIcon}><Icon name={i} size={15} color="#1A6FFF" /></View>
            <T s={13} w={600} c={colors.ink800}>{t}</T>
          </View>
        ))}
      </Stagger>
      <View style={styles.gateBtns}>
        <Btn onPress={onSignIn} icon="log-in" full>Sign in with phone</Btn>
        <Btn variant="outline" onPress={onClose} full>Keep browsing</Btn>
      </View>
    </DragSheet>
  );
}

/** P-00 Guest profile */
export function GuestProfileScreen({ go, onNav, signIn }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const lock = <Icon name="lock" size={15} color="#94A3B8" />;
  return (
    <Screen padBottom footer={<BottomNav legacy active="profile" onNav={onNav} />}>
      <View style={[styles.hero, { marginTop: -insets.top, paddingTop: insets.top + 12 }]}>
        <Float style={styles.heroGlow} />
        <View style={styles.heroRow}>
          <View style={styles.avatar}><Icon name="user" size={28} color="white" /></View>
          <View>
            <T s={11} w={700} upper ls={0.12} c="rgba(255,255,255,0.6)">Guest mode</T>
            <T display s={24} w={800} ls={-0.03} lh={1.25} c="#FFFFFF">Hello, guest</T>
            <T s={12.5} c="rgba(255,255,255,0.75)" style={styles.mt2}>Sign in to save, enquire and sell.</T>
          </View>
        </View>
      </View>
      <View style={styles.cardWrap}>
        <Card style={styles.cardRow}>
          <View style={styles.flex1}>
            <T s={14} w={700}>Create your free account</T>
            <T s={11.5} c={colors.ink500} style={styles.mt2}>Your browsing stays where you left it.</T>
          </View>
          <Btn size="sm" onPress={() => signIn()}>Sign in</Btn>
        </Card>
      </View>
      <View style={styles.groups}>
        <InsetGroup label="Needs an account">
          <Row icon="message-square" label="My Enquiries" sub="Track enquiries and visits" onPress={() => go('myEnquiries')} trailing={lock} />
          <Row icon="building" iconTone="green" label="My Listings" sub="Properties you've listed" onPress={() => go('myListings')} trailing={lock} />
          <Row icon="heart" iconTone="rose" label="Saved Properties" sub="Shortlist and price alerts" onPress={() => go('favorites')} trailing={lock} />
        </InsetGroup>
        <InsetGroup label="Open to everyone">
          <Row icon="smartphone" iconTone="ink" label="App Settings" sub="Language, theme, location" onPress={() => go('appSettings')} />
          <Row icon="circle-help" label="Help & FAQs" onPress={() => go('helpFaqs')} />
          <Row icon="info" iconTone="ink" label="About Us" onPress={() => go('aboutUs')} />
          <Row icon="file-text" iconTone="ink" label="Terms of Use" onPress={() => go('termsOfUse')} />
        </InsetGroup>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  mt2: { marginTop: 2 },
  mt16: { marginTop: 16 },
  gateTop: { alignItems: 'center', paddingTop: 4 },
  lockWrap: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  lockBg: { borderRadius: 16, opacity: 0.9, experimental_backgroundImage: gradients.meshBrand },
  gateSub: { marginTop: 6, maxWidth: 270 },
  perks: { marginTop: 20, borderRadius: 16, backgroundColor: colors.ink50, boxShadow: ring('rgba(226,232,240,0.7)') },
  perk: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10 },
  perkDivider: { borderTopWidth: 1, borderTopColor: 'rgba(226,232,240,0.7)' },
  perkIcon: { width: 32, height: 32, borderRadius: 12, backgroundColor: colors.white, boxShadow: ring(colors.ink200), alignItems: 'center', justifyContent: 'center' },
  gateBtns: { marginTop: 20, gap: 10 },
  hero: { paddingBottom: 64, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, overflow: 'hidden', experimental_backgroundImage: gradients.meshBrand },
  heroGlow: {
    position: 'absolute', top: -64 - 70, right: -56 - 70, width: 208 + 140, height: 208 + 140,
    experimental_backgroundImage: 'radial-gradient(circle closest-side, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.095) 25%, rgba(255,255,255,0.05) 57%, rgba(255,255,255,0) 100%)',
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', boxShadow: ring('rgba(255,255,255,0.3)'), alignItems: 'center', justifyContent: 'center' },
  cardWrap: { paddingHorizontal: 16, marginTop: -36, zIndex: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  groups: { paddingHorizontal: 16, marginTop: 20, gap: 20 },
});
