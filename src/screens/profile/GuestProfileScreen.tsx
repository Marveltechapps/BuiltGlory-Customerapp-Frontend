import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav } from '../../components/BottomNav';
import { Btn } from '../../components/Btn';
import { Icon } from '../../components/Icon';
import { Card, InsetGroup, Row } from '../../components/Layout';
import { Float } from '../../components/Motion';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { useNav } from '../../navigation/NavContext';
import { meshes, tw, twh } from '../../theme';

/** P-00 Guest profile: account-only rows open the sign-in gate (handled by the navigator). */
export function GuestProfileScreen() {
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const lock = <Icon name="lock" size={15} color="#94A3B8" />;
  return (
    <Screen padBottom bleed overlay={<BottomNav active="profile" />}>
      {/* Reference: -mt-11 pt-14 under a 44px status bar, i.e. content starts 12px below the bar. */}
      <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
        <Float style={styles.blob}>
          <View />
        </Float>
        <View style={styles.heroRow}>
          <View style={styles.avatar}>
            <Icon name="user" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.flex}>
            <T style={styles.kicker}>Guest mode</T>
            <T style={styles.hello}>Hello, guest</T>
            <T style={styles.heroSub}>Sign in to save, enquire and sell.</T>
          </View>
        </View>
      </View>
      <View style={styles.cardWrap}>
        <Card style={styles.card}>
          <View style={styles.flex}>
            <T style={styles.cardTitle}>Create your free account</T>
            <T style={styles.cardSub}>Your browsing stays where you left it.</T>
          </View>
          <Btn size="sm" style={styles.selfCenter} onPress={() => nav.signIn(null)}>
            Sign in
          </Btn>
        </Card>
      </View>
      <View style={styles.groups}>
        <InsetGroup label="Needs an account">
          <Row
            icon="message-square"
            label="My Enquiries"
            sub="Track enquiries and visits"
            onPress={() => nav.go('myEnquiries')}
            trailing={lock}
          />
          <Row
            icon="building"
            iconTone="green"
            label="My Listings"
            sub="Properties you've listed"
            onPress={() => nav.go('myListings')}
            trailing={lock}
          />
          <Row
            icon="heart"
            iconTone="rose"
            label="Saved Properties"
            sub="Shortlist and price alerts"
            onPress={() => nav.go('favorites')}
            trailing={lock}
          />
        </InsetGroup>
        <InsetGroup label="Open to everyone">
          <Row
            icon="smartphone"
            iconTone="ink"
            label="App Settings"
            sub="Language, theme, location"
            onPress={() => nav.go('appSettings')}
          />
          <Row
            icon="circle-help"
            label="Help & FAQs"
            onPress={() => nav.go('helpFaqs')}
          />
          <Row
            icon="info"
            iconTone="ink"
            label="About Us"
            onPress={() => nav.go('aboutUs')}
          />
          <Row
            icon="file-text"
            iconTone="ink"
            label="Terms of Use"
            onPress={() => nav.go('termsOfUse')}
          />
        </InsetGroup>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  selfCenter: tw('self-center'),
  flex: tw('flex-1'),
  hero: {
    ...tw('pb-16 px-5 overflow-hidden'),
    experimental_backgroundImage: meshes.brand,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  blob: {
    position: 'absolute',
    top: -64,
    right: -56,
    width: 208,
    height: 208,
    borderRadius: 104,
    backgroundColor: 'rgba(255,255,255,0.1)',
    filter: 'blur(24px)',
  },
  heroRow: tw('flex items-center gap-3.5'),
  avatar: {
    ...tw('w-16 h-16 rounded-2xl items-center justify-center'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.3)',
  },
  kicker: {
    ...tw('text-[11px] font-bold uppercase tracking-[.12em]'),
    color: 'rgba(255,255,255,0.6)',
  },
  hello: {
    ...twh('text-[24px] font-extrabold text-white leading-tight'),
    letterSpacing: 24 * -0.03,
  },
  heroSub: { ...tw('text-[12.5px] mt-0.5'), color: 'rgba(255,255,255,0.75)' },
  cardWrap: { ...tw('px-4 z-10'), marginTop: -36 },
  card: tw('flex items-center gap-3'),
  cardTitle: tw('text-[14px] font-bold text-ink-900'),
  cardSub: tw('text-[11.5px] text-ink-500 mt-0.5'),
  groups: { ...tw('px-4 mt-5'), gap: 20 },
});
