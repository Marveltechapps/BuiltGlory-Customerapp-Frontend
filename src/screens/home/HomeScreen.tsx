import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sheen } from '../../components/Btn';
import { BottomNav } from '../../components/BottomNav';
import { CoachMarks, type CoachRect } from '../../components/CoachMarks';
import { Badge, Heart } from '../../components/Form';
import { EmptyGlyph, CountUp } from '../../components/Hero';
import { Icon } from '../../components/Icon';
import { Float, Rise } from '../../components/Motion';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { PropertyCard, useFavToggle } from '../../components/PropertyCard';
import { Press } from '../../components/Press';
import { FlowTint } from '../../components/Screen';
import { ErrorState, Skeleton } from '../../components/States';
import { T } from '../../components/T';
import { useAuth } from '../../context/AuthContext';
import type { PropertyView } from '../../interfaces/PropertyView';
import { useResource } from '../../lib/useResource';
import { useNav, useRefocus, useScreen } from '../../navigation/NavContext';
import { getUnreadCount } from '../../services/notification.service';
import { listProperties } from '../../services/property.service';
import { meshes, palette, tw, twh } from '../../theme';
import { formatINR } from '../../utils/format';
import { placeLabel, toPropertyView } from '../../utils/property';
import { readJson, STORAGE_KEYS, writeJson } from '../../utils/storage';

function UpcomingCard({
  p,
  onPress,
}: {
  p: PropertyView;
  onPress: () => void;
}) {
  const { onToggle, isSaved } = useFavToggle();
  return (
    <View style={styles.upCard}>
      <Press onPress={onPress} pressScale={1}>
        <PhotoPlaceholder tag={p.id} src={p.images[0]} height={130}>
          <View style={styles.upBadge}>
            <Badge color="amber">Upcoming</Badge>
          </View>
          <View style={styles.upHeart}>
            <Heart active={isSaved(p.id)} onPress={() => onToggle(p.id)} />
          </View>
        </PhotoPlaceholder>
      </Press>
      <View style={styles.upBody}>
        <T style={styles.upTitle} numberOfLines={1}>
          {p.title}
        </T>
        <T style={styles.upLoc} numberOfLines={1}>
          {placeLabel(p)}
        </T>
        <T style={styles.upPrice}>{formatINR(p.price)}</T>
        <View style={styles.soon}>
          <Icon name="clock" size={10} color="#FFFFFF" />
          <T style={styles.soonText}>Launching soon</T>
        </View>
      </View>
    </View>
  );
}

function RailState({
  loading,
  error,
  onRetry,
  empty,
  emptyIcon,
  emptyText,
  children,
}: {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  empty: boolean;
  emptyIcon: 'building-2' | 'clock';
  emptyText: string;
  children: React.ReactNode;
}) {
  if (loading) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
      >
        {[0, 1].map(i => (
          <View key={i} style={styles.railItem}>
            <Skeleton h={200} r={14} />
          </View>
        ))}
      </ScrollView>
    );
  }
  if (error) return <ErrorState compact message={error} onRetry={onRetry} />;
  if (empty) {
    return (
      <View style={styles.emptyRail}>
        <EmptyGlyph name={emptyIcon} />
        <T style={styles.emptyText}>{emptyText}</T>
      </View>
    );
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rail}
    >
      {children}
    </ScrollView>
  );
}

/** H-01 Home. `forceTour` renders the H-06 coach marks route. */
export function HomeScreen({
  forceTour,
  onTourDone,
}: { forceTour?: boolean; onTourDone?: () => void } = {}) {
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const { flow, firstVisit, focused } = useScreen();
  const { isSignedIn, isGuest } = useAuth();
  const scrollY = useRef(new Animated.Value(0)).current;

  const featured = useResource(
    signal =>
      listProperties({ featured: true, limit: 5 }, signal).then(r =>
        r.data.map(toPropertyView),
      ),
    [],
  );
  const upcoming = useResource(
    signal =>
      listProperties({ upcoming: true, limit: 3 }, signal).then(r =>
        r.data.map(toPropertyView),
      ),
    [],
  );
  const verified = useResource(
    signal =>
      listProperties({ verified: true, limit: 1 }, signal).then(
        r => r.meta.total,
      ),
    [],
  );
  const unread = useResource(
    signal => getUnreadCount(signal).then(r => r.count),
    [isSignedIn],
    isSignedIn,
  );
  useRefocus(() => {
    if (isSignedIn) unread.reload();
  });

  // H-06 coach marks: first time Home is shown on this device.
  const searchRef = useRef<View>(null);
  const buyRef = useRef<View>(null);
  const sellRef = useRef<View>(null);
  const rootRef = useRef<View>(null);
  const [tour, setTour] = useState<Array<CoachRect | null> | null>(null);
  const measure = useCallback(async () => {
    // Measured relative to the screen root that hosts the overlay. (On Android, measureInWindow is offset by the
    // status bar while this edge-to-edge screen draws under it.)
    const m = (ref: React.RefObject<View | null>, r: number) =>
      new Promise<CoachRect | null>(resolve => {
        if (!ref.current || !rootRef.current) return resolve(null);
        ref.current.measureLayout(
          rootRef.current,
          (x, y, w, h) => resolve({ x, y, w, h, r }),
          () => resolve(null),
        );
      });
    const navH = 64 + insets.bottom;
    setTour([
      await m(searchRef, 16),
      await m(buyRef, 16),
      await m(sellRef, 16),
      { x: 0, y: height - navH, w: width, h: navH, r: 0 },
    ]);
  }, [height, insets.bottom, width]);
  useEffect(() => {
    if (!focused) return;
    let t: ReturnType<typeof setTimeout>;
    (async () => {
      const seen = forceTour
        ? false
        : await readJson<boolean>(STORAGE_KEYS.coachSeen, false);
      if (!seen) t = setTimeout(measure, 800);
    })();
    return () => clearTimeout(t);
  }, [focused, forceTour, measure]);
  const endTour = () => {
    setTour(null);
    writeJson(STORAGE_KEYS.coachSeen, true);
    onTourDone?.();
  };

  const stripOpacity = scrollY.interpolate({
    inputRange: [200, 280],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const featuredList = featured.data ?? [];
  const upcomingList = upcoming.data ?? [];
  const sections = [
    <View
      key="hero"
      style={[styles.hero, { paddingTop: Math.max(insets.top, 24) + 4 }]}
    >
      <Float style={styles.heroBlobA} />
      <Float style={styles.heroBlobB} delay={1400} />
      <View style={styles.heroTop}>
        <T style={styles.brand}>BUILTGLORY</T>
        <View style={styles.heroBtns}>
          <Press
            onPress={() => nav.go('help')}
            style={styles.heroBtn}
            accessibilityLabel="Help"
          >
            <Icon name="help-circle" size={17} color="#FFFFFF" />
          </Press>
          <Press
            onPress={() => nav.go('notifications')}
            style={styles.heroBtn}
            accessibilityLabel="Notifications"
          >
            <Icon name="bell" size={17} color="#FFFFFF" />
            {(unread.data ?? 0) > 0 && (
              <View style={styles.unread}>
                <T style={styles.unreadText}>
                  {(unread.data ?? 0) > 99 ? '99+' : unread.data}
                </T>
              </View>
            )}
          </Press>
        </View>
      </View>
      <View style={styles.heroCopy}>
        <T style={styles.headline}>Find a home{'\n'}worth building on.</T>
        <T style={styles.heroSub}>Verified listings. Zero brokerage.</T>
        {isGuest && (
          <Press onPress={() => nav.signIn(null)} style={styles.guestPill}>
            <View style={styles.guestIcon}>
              <Icon name="user" size={13} color="#FFFFFF" />
            </View>
            <T style={styles.guestText}>
              Browsing as guest ·{' '}
              <T style={[styles.guestText, styles.underline]}>Sign in</T>
            </T>
          </Press>
        )}
      </View>
      <View style={styles.searchWrap} ref={searchRef} collapsable={false}>
        <Press
          onPress={() => nav.go('search')}
          style={styles.search}
          accessibilityLabel="Search"
        >
          <Icon name="search" size={17} color="#1A6FFF" />
          <T style={styles.searchText}>Search by location or property type</T>
          <View style={styles.go}>
            <T style={styles.goText}>GO</T>
          </View>
        </Press>
      </View>
    </View>,
    <View key="tiles" style={styles.tiles}>
      <View style={styles.flex1} ref={buyRef} collapsable={false}>
        <Press onPress={() => nav.go('buyTypes')} style={styles.buyTile}>
          <Sheen />
          <Icon name="home" size={26} color="#FFFFFF" />
          <View>
            <T style={styles.tileTitleWhite}>Buy</T>
            <T style={styles.tileSubWhite}>Browse properties</T>
          </View>
        </Press>
      </View>
      <View style={styles.flex1} ref={sellRef} collapsable={false}>
        <Press onPress={() => nav.go('sellType')} style={styles.sellTile}>
          <Icon name="tag" size={26} color="#1A6FFF" />
          <View>
            <T style={styles.tileTitleBrand}>Sell</T>
            <T style={styles.tileSub}>List your property</T>
          </View>
        </Press>
      </View>
    </View>,
    <View key="trust" style={styles.trust}>
      {(
        [
          [verified.data ?? 0, '+', 'Verified listings'],
          [0, '%', 'Brokerage'],
          [24, '×7', 'Support'],
        ] as Array<[number, string, string]>
      ).map(([n, sfx, l]) => (
        <View key={l} style={styles.trustCell}>
          <CountUp to={n} suffix={sfx} dur={1300} style={styles.trustValue} />
          <T style={styles.trustLabel}>{l}</T>
        </View>
      ))}
    </View>,
    <View key="featuredHead" style={styles.sectionHead}>
      <View>
        <T style={styles.sectionTitle}>Featured Properties</T>
        <T style={styles.sectionSub}>Hand-picked, ready to move in</T>
      </View>
      <Press onPress={() => nav.go('featured')} style={styles.seeAll}>
        <T style={styles.seeAllText}>See All</T>
        <Icon name="arrow-right" size={12} color="#1A6FFF" />
      </Press>
    </View>,
    <RailState
      key="featured"
      loading={featured.loading}
      error={featured.error}
      onRetry={featured.reload}
      empty={!featuredList.length}
      emptyIcon="building-2"
      emptyText="No properties available right now"
    >
      {featuredList.map(p => (
        <View key={p.id} style={styles.railItem}>
          <PropertyCard
            p={p}
            onPress={() => nav.go('propertyDetail', { id: p.id, property: p })}
          />
        </View>
      ))}
    </RailState>,
    <View key="upcomingHead" style={styles.sectionHead}>
      <View>
        <T style={styles.sectionTitle}>Upcoming Properties</T>
        <T style={styles.sectionSub}>Book early access</T>
      </View>
      <Press onPress={() => nav.go('upcoming')} style={styles.seeAll}>
        <T style={styles.seeAllText}>See All</T>
        <Icon name="arrow-right" size={12} color="#1A6FFF" />
      </Press>
    </View>,
    <RailState
      key="upcoming"
      loading={upcoming.loading}
      error={upcoming.error}
      onRetry={upcoming.reload}
      empty={!upcomingList.length}
      emptyIcon="clock"
      emptyText="No upcoming properties right now"
    >
      {upcomingList.map(p => (
        <View key={p.id} style={styles.railItem}>
          <UpcomingCard
            p={p}
            onPress={() => nav.go('propertyDetail', { id: p.id, property: p })}
          />
        </View>
      ))}
    </RailState>,
    <View key="help" style={styles.helpWrap}>
      <Press onPress={() => nav.go('help')} style={styles.help}>
        <View style={styles.helpIcon}>
          <Icon name="headphones" size={18} color="#FFFFFF" />
        </View>
        <View style={styles.flex1}>
          <T style={styles.helpTitle}>Need help finding a home?</T>
          <T style={styles.helpSub}>Chat with our property advisor</T>
        </View>
        <Icon name="arrow-right" size={16} color="#1A6FFF" />
      </Press>
    </View>,
  ];

  return (
    <View
      ref={rootRef}
      collapsable={false}
      style={[StyleSheet.absoluteFill, styles.root]}
    >
      <StatusBar barStyle="light-content" />
      <FlowTint flow={flow} />
      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: 96 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
      >
        {sections.map((s, i) => (
          <Rise
            key={i}
            delay={10 + Math.min(i, 6) * 50}
            disabled={!firstVisit}
            style={i === 1 ? styles.tilesLayer : undefined}
          >
            {s}
          </Rise>
        ))}
      </Animated.ScrollView>
      <Animated.View
        pointerEvents="none"
        style={[styles.strip, { height: insets.top, opacity: stripOpacity }]}
      />
      <BottomNav active="home" />
      {tour && <CoachMarks spots={tour} onDone={endTour} />}
    </View>
  );
}

/** H-06 Coach Marks route: Home with the tour forced on. */
export function CoachMarksScreen() {
  const nav = useNav();
  return <HomeScreen forceTour onTourDone={() => nav.jump('home')} />;
}

const styles = StyleSheet.create({
  root: { backgroundColor: '#FFFFFF' },
  flex1: { flex: 1 },
  strip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    experimental_backgroundImage: meshes.brand,
  },
  hero: {
    ...tw('relative pb-14 overflow-hidden'),
    experimental_backgroundImage: meshes.brand,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  heroBlobA: {
    position: 'absolute',
    top: -64 - 40,
    right: -56 - 40,
    width: 224 + 80,
    height: 224 + 80,
    experimental_backgroundImage:
      'radial-gradient(circle closest-side, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.1) 45%, transparent 100%)',
  },
  heroBlobB: {
    position: 'absolute',
    bottom: -80 - 40,
    left: -64 - 40,
    width: 208 + 80,
    height: 208 + 80,
    experimental_backgroundImage:
      'radial-gradient(circle closest-side, rgba(74,140,255,0.25) 0%, rgba(74,140,255,0.25) 45%, transparent 100%)',
  },
  heroTop: tw('relative px-4 pt-2 pb-3 flex items-center justify-between'),
  brand: twh('text-[23px] font-extrabold text-white'),
  heroBtns: tw('flex items-center gap-1.5'),
  heroBtn: {
    ...tw('w-9 h-9 rounded-full items-center justify-center'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  unread: {
    ...tw(
      'absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] bg-rose-500 rounded-full items-center justify-center px-1',
    ),
    borderWidth: 2,
    borderColor: '#1B4AA8',
  },
  unreadText: {
    fontSize: 9,
    lineHeight: 11,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  heroCopy: tw('relative px-4 mt-1'),
  headline: twh('text-[26px] font-extrabold text-white leading-[1.12]'),
  heroSub: tw('text-[12.5px] text-white/70 mt-2'),
  guestPill: {
    ...tw('mt-3 flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full'),
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  guestIcon: {
    ...tw('w-6 h-6 rounded-full items-center justify-center'),
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  guestText: tw('text-[12px] font-bold text-white'),
  underline: { textDecorationLine: 'underline' },
  searchWrap: tw('relative px-4 mt-5'),
  search: {
    ...tw('w-full flex items-center gap-2.5 px-4 py-3.5 rounded-2xl elev-2'),
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  searchText: tw('flex-1 text-[14px] text-ink-500'),
  go: tw('bg-brand-50 px-2 py-1 rounded-full'),
  goText: {
    fontSize: 10,
    lineHeight: 15,
    fontFamily: 'Inter-Bold',
    color: palette.brand[700],
  },
  tilesLayer: { zIndex: 10 },
  tiles: { ...tw('px-4 relative flex gap-3'), marginTop: -32 },
  buyTile: {
    ...tw(
      'relative h-[104px] rounded-2xl p-4 justify-between overflow-hidden elev-3',
    ),
    experimental_backgroundImage: 'linear-gradient(135deg, #3B86FF, #1259D4)',
  },
  sellTile: tw('h-[104px] rounded-2xl p-4 justify-between bg-white elev-2'),
  tileTitleWhite: twh('text-[17px] font-extrabold text-white'),
  tileSubWhite: tw('text-[11px] text-white/80'),
  tileTitleBrand: twh('text-[17px] font-extrabold text-brand-700'),
  tileSub: tw('text-[11px] text-ink-500'),
  trust: tw('px-4 mt-3 flex gap-2'),
  trustCell: {
    ...tw('flex-1 p-2.5 rounded-card items-center'),
    experimental_backgroundImage:
      'linear-gradient(to bottom, #F8FAFC, #FFFFFF)',
    boxShadow: '0 0 0 1px rgba(226,232,240,0.7)',
  },
  trustValue: twh('num text-[16px] font-extrabold text-brand-700 leading-none'),
  trustLabel: tw('text-[10.5px] text-ink-500 mt-1'),
  sectionHead: tw('px-4 mt-6 flex items-center justify-between'),
  sectionTitle: tw('text-[15px] font-bold'),
  sectionSub: tw('text-[11px] text-ink-500'),
  seeAll: tw('flex items-center gap-1'),
  seeAllText: tw('text-brand-600 text-[12px] font-semibold'),
  rail: { ...tw('mt-3 pl-4 pr-4 pb-1'), gap: 12 },
  railItem: { width: 240 },
  emptyRail: tw('px-4 py-8 items-center'),
  emptyText: tw('mt-2 text-[13px] text-ink-400'),
  upCard: tw('bg-white rounded-card border border-ink-200 overflow-hidden'),
  upBadge: tw('absolute top-2 left-2'),
  upHeart: tw('absolute top-2 right-2'),
  upBody: tw('p-3'),
  upTitle: tw('text-[13px] font-semibold'),
  upLoc: tw('text-[12px] text-ink-500 mt-0.5'),
  upPrice: tw('text-[14px] font-bold text-brand-600 mt-1'),
  soon: {
    ...tw('mt-2 bg-ink-900 px-2 py-1 rounded flex items-center gap-1'),
    alignSelf: 'flex-start',
  },
  soonText: tw('text-[10px] font-semibold text-white'),
  helpWrap: tw('px-4 mt-6'),
  help: tw(
    'w-full flex items-center gap-3 p-4 rounded-card border border-brand-200 bg-brand-50',
  ),
  helpIcon: tw(
    'w-10 h-10 rounded-full bg-brand-600 items-center justify-center',
  ),
  helpTitle: tw('text-[14px] font-semibold text-brand-700'),
  helpSub: tw('text-[11px] text-brand-600'),
});
