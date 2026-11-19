import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mapProperties } from '../../api/mappers';
import { EmptyGlyph } from '../../components/hero/StatusHero';
import { Icon } from '../../components/icons/Icon';
import { BottomNav } from '../../components/layout/BottomNav';
import { Screen } from '../../components/layout/Screen';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { PropertyCard } from '../../components/PropertyCard';
import { Badge } from '../../components/ui/Badge';
import { CountUp } from '../../components/ui/CountUp';
import { Float } from '../../components/ui/Float';
import { Heart } from '../../components/ui/Heart';
import { Press } from '../../components/ui/Press';
import { Sheen } from '../../components/ui/Sheen';
import { T } from '../../components/ui/T';
import { useAuth } from '../../context/AuthContext';
import { coachViews, measureCoachTarget, type CoachKey } from '../../lib/coachTargets';
import type { ScreenProps } from '../../navigation/types';
import * as notifications from '../../services/notifications.service';
import * as properties from '../../services/properties.service';
import { colors, elev, gradients, ring } from '../../theme';
import type { Property } from '../../types/property';
import { errorMessage } from '../../utils/errorMessage';
import { formatINR } from '../../utils/format';
import { cacheProperties } from '../../utils/propertyCache';

const soft = (rgb: string, a: number) =>
  `radial-gradient(circle closest-side, rgba(${rgb},${a}) 0%, rgba(${rgb},${a * 0.95}) 25%, rgba(${rgb},${a * 0.5}) 57%, rgba(${rgb},0) 100%)`;

/** Bell that rings three times after 1.2s while there are unread notifications. */
function LiveBell({ live }: { live: boolean }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!live) return;
    const one = Animated.timing(t, { toValue: 1, duration: 1000, easing: Easing.bezier(0.34, 1.32, 0.44, 1), useNativeDriver: true });
    const anim = Animated.sequence([Animated.delay(1200), one, Animated.timing(t, { toValue: 0, duration: 0, useNativeDriver: true }), one, Animated.timing(t, { toValue: 0, duration: 0, useNativeDriver: true }), one]);
    anim.start();
    return () => anim.stop();
  }, [live, t]);
  const rotate = t.interpolate({ inputRange: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 1], outputRange: ['0deg', '16deg', '-14deg', '10deg', '-6deg', '3deg', '0deg'] });
  return (
    <Animated.View style={{ transform: [{ translateY: -8 }, { rotate }, { translateY: 8 }] }}>
      <Icon name="bell" size={17} color="#ffffff" />
    </Animated.View>
  );
}

function SectionHead({ title, sub, onAll }: { title: string; sub: string; onAll: () => void }) {
  return (
    <View style={styles.sectionHead}>
      <View>
        <T s={15} w={700}>{title}</T>
        <T s={11} c={colors.ink500}>{sub}</T>
      </View>
      <Pressable onPress={onAll} style={styles.seeAll} accessibilityRole="button">
        <T s={12} w={600} c={colors.brand600}>See All</T>
        <Icon name="arrow-right" size={12} color={colors.brand600} />
      </Pressable>
    </View>
  );
}

/** H-01 Home */
export function HomeScreen({ go, fav, toggleFav, onNav, guest, signIn }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const [unread, setUnread] = useState(0);
  const [featured, setFeatured] = useState<Property[]>([]);
  const [upcoming, setUpcoming] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const strip = useRef(new Animated.Value(0)).current;
  const [stripSolid, setStripSolid] = useState(false);
  const onScrollY = (y: number) => {
    const o = Math.min(1, Math.max(0, (y - 200) / 80));
    strip.setValue(o);
    if ((o > 0.9) !== stripSolid) setStripSolid(o > 0.9);
  };

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [featRes, upRes] = await Promise.all([
          properties.listProperties({ featured: true, limit: 6 }, ac.signal),
          properties.listProperties({ upcoming: true, limit: 4 }, ac.signal),
        ]);
        if (ac.signal.aborted) return;
        const feat = mapProperties(featRes.items);
        const up = mapProperties(upRes.items);
        cacheProperties([...feat, ...up]);
        setFeatured(feat);
        setUpcoming(up);
      } catch (err) {
        if (ac.signal.aborted) return;
        setError(errorMessage(err));
        setFeatured([]);
        setUpcoming([]);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnread(0);
      return;
    }
    const ac = new AbortController();
    notifications
      .getUnreadCount(ac.signal)
      .then(res => {
        if (!ac.signal.aborted) setUnread(res?.count || 0);
      })
      .catch(() => {
        if (!ac.signal.aborted) setUnread(0);
      });
    return () => ac.abort();
  }, [isAuthenticated]);

  const searchRef = useRef<View>(null);
  const buyRef = useRef<View>(null);
  const sellRef = useRef<View>(null);
  const measure = (ref: React.RefObject<View | null>, key: CoachKey) => () => {
    // Register the view so the coach-mark overlay can re-measure it when it opens, after Home's
    // entrance animations; this early measurement is only the first estimate.
    coachViews[key] = ref;
    setTimeout(() => measureCoachTarget(key, () => {}), 720);
  };

  return (
    <Screen
      padBottom
      bleed
      onScrollY={onScrollY}
      footer={
        <>
          <Animated.View pointerEvents="none" style={[styles.strip, { height: insets.top, opacity: strip, boxShadow: stripSolid ? '0 6px 16px -10px rgba(11,30,70,0.6)' : undefined }]} />
          <BottomNav legacy active="home" onNav={onNav} />
        </>
      }>
      {/* Immersive hero behind the status bar */}
      <View style={[styles.hero, { paddingTop: insets.top + 4 }]}>
        <Float style={styles.glowA} />
        <Float style={styles.glowB} />
        <View style={styles.headRow}>
          <T display s={23} w={800} c="#FFFFFF" ls={-0.03}>BUILTGLORY</T>
          <View style={styles.headBtns}>
            <Press onPress={() => go('help')} style={styles.glassBtn} accessibilityLabel="Help">
              <Icon name="help-circle" size={17} color="#ffffff" />
            </Press>
            <Press onPress={() => { go('notifications'); setUnread(0); }} style={styles.glassBtn} accessibilityLabel="Notifications">
              <LiveBell live={unread > 0} />
              {unread > 0 && (
                <View style={styles.badge}><T s={9} w={700} c="#FFFFFF" lh={1}>{unread > 99 ? '99+' : unread}</T></View>
              )}
            </Press>
          </View>
        </View>
        <View style={styles.copy}>
          <T display s={26} w={800} c="#FFFFFF" lh={1.12} ls={-0.035}>Find a home{'\n'}worth building on.</T>
          <T s={12.5} c="rgba(255,255,255,0.7)" style={styles.mt8}>Verified listings. Zero brokerage.</T>
          {guest && (
            <Press onPress={() => signIn()} style={styles.guestPill}>
              <View style={styles.guestIcon}><Icon name="user" size={13} color="white" /></View>
              <T s={12} w={700} c="#FFFFFF">Browsing as guest · <T style={styles.underline}>Sign in</T></T>
            </Press>
          )}
        </View>
        <View style={styles.searchWrap}>
          {/* Spotlight target: the bar itself, not the padded row. */}
          <View ref={searchRef} onLayout={measure(searchRef, 'search')} collapsable={false}>
          <Press onPress={() => go('search')} style={styles.search}>
            <Icon name="search" size={17} color="#1A6FFF" />
            <T s={14} c={colors.ink500} style={styles.flex1}>Search by location or property type</T>
            <View style={styles.go}><T s={10} w={700} c={colors.brand700}>GO</T></View>
          </Press>
          </View>
        </View>
      </View>

      {/* Buy / Sell tiles overlap the hero */}
      <View style={styles.tiles}>
        <View style={styles.flex1} ref={buyRef} onLayout={measure(buyRef, 'buy')} collapsable={false}>
          <Press onPress={() => go('buyTypes')} style={[styles.tile, styles.buyTile]}>
            <View style={[StyleSheet.absoluteFill, styles.tileClip]}><Sheen /></View>
            <Icon name="home" size={26} color="white" />
            <View>
              <T display s={17} w={800} ls={-0.02} c="#FFFFFF">Buy</T>
              <T s={11} c="rgba(255,255,255,0.8)">Browse properties</T>
            </View>
          </Press>
        </View>
        <View style={styles.flex1} ref={sellRef} onLayout={measure(sellRef, 'sell')} collapsable={false}>
          <Press onPress={() => go('sellType')} style={[styles.tile, styles.sellTile]}>
            <Icon name="tag" size={26} color="#1A6FFF" />
            <View>
              <T display s={17} w={800} ls={-0.02} c={colors.brand700}>Sell</T>
              <T s={11} c={colors.ink500}>List your property</T>
            </View>
          </Press>
        </View>
      </View>

      {/* Trust strip */}
      <View style={styles.trust}>
        {([[12800, '+', 'Verified listings'], [0, '%', 'Brokerage'], [24, '×7', 'Support']] as [number, string, string][]).map(([n, sfx, l]) => (
          <View key={l} style={styles.trustTile}>
            <CountUp to={n} suffix={sfx} dur={1300} display s={16} w={800} c={colors.brand700} lh={1} ls={-0.03} align="center" />
            <T s={10.5} c={colors.ink500} align="center" style={styles.mt4}>{l}</T>
          </View>
        ))}
      </View>

      {error ? (
        <View style={styles.empty}>
          <EmptyGlyph name="wifi-off" />
          <T s={13} c={colors.ink500} align="center" style={styles.mt8}>{error}</T>
        </View>
      ) : null}

      {/* Featured */}
      <SectionHead title="Featured Properties" sub="Hand-picked, ready to move in" onAll={() => go('featured')} />
      {loading ? (
        <View style={styles.empty}><ActivityIndicator color={colors.brand600} /></View>
      ) : featured.length === 0 ? (
        <View style={styles.empty}><EmptyGlyph name="building-2" /><T s={13} c={colors.ink400} align="center" style={styles.mt8}>No properties available right now</T></View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mt12} contentContainerStyle={styles.rail}>
          {featured.slice(0, 6).map(p => (
            <View key={p.id} style={styles.w240}>
              <PropertyCard p={p} fav={fav.has(p.id)} onFav={() => toggleFav(p.id)} onPress={() => go('propertyDetail', { p })} />
            </View>
          ))}
        </ScrollView>
      )}

      {/* Upcoming */}
      <SectionHead title="Upcoming Properties" sub="Book early access" onAll={() => go('upcoming')} />
      {loading ? (
        <View style={styles.empty}><ActivityIndicator color={colors.brand600} /></View>
      ) : upcoming.length === 0 ? (
        <View style={styles.empty}><EmptyGlyph name="clock" /><T s={13} c={colors.ink400} align="center" style={styles.mt8}>No upcoming properties right now</T></View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mt12} contentContainerStyle={styles.rail}>
          {upcoming.slice(0, 4).map(p => (
            <View key={p.id} style={[styles.w240, styles.upCard]}>
              <Pressable onPress={() => go('propertyDetail', { p })}>
                <PhotoPlaceholder tag={p.id} height={130}>
                  <View style={styles.tl8}><Badge color="amber">Upcoming</Badge></View>
                  <View style={styles.tr8}><Heart active={fav.has(p.id)} onPress={() => toggleFav(p.id)} /></View>
                </PhotoPlaceholder>
              </Pressable>
              <View style={styles.p12}>
                <T s={13} w={600} truncate>{p.title}</T>
                <T s={12} c={colors.ink500} style={styles.mt2}>{p.location}, {p.city}</T>
                <T s={14} w={700} c={colors.brand600} style={styles.mt4}>{formatINR(p.price)}</T>
                <View style={styles.soon}>
                  <Icon name="clock" size={10} color="white" />
                  <T s={10} w={600} c="#FFFFFF">Launching soon</T>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Help card */}
      <View style={styles.helpWrap}>
        <Pressable onPress={() => go('help')} style={styles.help} accessibilityRole="button">
          <View style={styles.helpIcon}><Icon name="headphones" size={18} color="white" /></View>
          <View style={styles.flex1}>
            <T s={14} w={600} c={colors.brand700}>Need help finding a home?</T>
            <T s={11} c={colors.brand600}>Chat with our property advisor</T>
          </View>
          <Icon name="arrow-right" size={16} color="#1A6FFF" />
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  mt2: { marginTop: 2 },
  mt4: { marginTop: 4 },
  mt8: { marginTop: 8 },
  mt12: { marginTop: 12 },
  p12: { padding: 12 },
  underline: { textDecorationLine: 'underline' },
  strip: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30, experimental_backgroundImage: gradients.meshBrand },
  hero: { paddingBottom: 56, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, overflow: 'hidden', experimental_backgroundImage: gradients.meshBrand },
  glowA: { position: 'absolute', top: -64 - 70, right: -56 - 70, width: 224 + 140, height: 224 + 140, experimental_backgroundImage: soft('255,255,255', 0.1) },
  glowB: { position: 'absolute', bottom: -80 - 70, left: -64 - 70, width: 208 + 140, height: 208 + 140, experimental_backgroundImage: soft('74,140,255', 0.25) },
  headRow: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headBtns: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  glassBtn: { width: 36, height: 36, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.15)', boxShadow: ring('rgba(255,255,255,0.2)'), alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -2, right: -2, minWidth: 17, height: 17, paddingHorizontal: 4, borderRadius: 9999, backgroundColor: colors.rose500, alignItems: 'center', justifyContent: 'center', boxShadow: ring('#1B4AA8', 2) },
  copy: { paddingHorizontal: 16, marginTop: 4 },
  guestPill: { marginTop: 12, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 6, paddingRight: 12, paddingVertical: 6, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.15)', boxShadow: ring('rgba(255,255,255,0.25)') },
  guestIcon: { width: 24, height: 24, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  searchWrap: { paddingHorizontal: 16, marginTop: 20 },
  search: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.72)', boxShadow: elev.e2 },
  go: { backgroundColor: colors.brand50, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9999 },
  tiles: { paddingHorizontal: 16, marginTop: -32, zIndex: 10, flexDirection: 'row', gap: 12 },
  tile: { height: 104, borderRadius: 16, padding: 16, justifyContent: 'space-between' },
  tileClip: { borderRadius: 16, overflow: 'hidden' },
  buyTile: { experimental_backgroundImage: 'linear-gradient(135deg, #3B86FF, #1259D4)', boxShadow: elev.e3 },
  sellTile: { backgroundColor: colors.white, boxShadow: elev.e2 },
  trust: { paddingHorizontal: 16, marginTop: 12, flexDirection: 'row', gap: 8 },
  trustTile: { flex: 1, padding: 10, borderRadius: 14, experimental_backgroundImage: 'linear-gradient(180deg, #F8FAFC, #FFFFFF)', boxShadow: ring('rgba(226,232,240,0.7)') },
  sectionHead: { paddingHorizontal: 16, marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  empty: { paddingHorizontal: 16, paddingVertical: 32, alignItems: 'center' },
  rail: { paddingLeft: 16, gap: 12, paddingBottom: 4 },
  w240: { width: 240 },
  upCard: { backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.ink200, overflow: 'hidden' },
  tl8: { position: 'absolute', top: 8, left: 8 },
  tr8: { position: 'absolute', top: 8, right: 8 },
  soon: { marginTop: 8, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.ink900, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  helpWrap: { paddingHorizontal: 16, marginTop: 24 },
  help: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.brand200, backgroundColor: colors.brand50 },
  helpIcon: { width: 40, height: 40, borderRadius: 9999, backgroundColor: colors.brand600, alignItems: 'center', justifyContent: 'center' },
});
