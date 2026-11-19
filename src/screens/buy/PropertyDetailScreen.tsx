import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../components/icons/Icon';
import { DetailLocationAdvantages } from '../../components/journey/BuyParts';
import { DetailScreen } from '../../components/layout/AppScreen';
import { Card, PriceBlock, SpecGrid } from '../../components/layout/Groups';
import { Grid } from '../../components/layout/Grid';
import { Screen, TopBar } from '../../components/layout/Screen';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { Btn } from '../../components/ui/Btn';
import { EmptyState } from '../../components/ui/EmptyState';
import { SwipeGallery } from '../../components/ui/Gestures';
import { buzz, Press } from '../../components/ui/Press';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { T } from '../../components/ui/T';
import { Toast } from '../../components/ui/Toast';
import { getJ, jBuy, jToggleCompare } from '../../context/journeyStore';
import type { ScreenName, ScreenProps } from '../../navigation/types';
import { colors, ease, elev, ring } from '../../theme';
import { formatINR } from '../../utils/format';
import { useResolvedProperty } from '../../utils/useResolvedProperty';

const glass = { backgroundColor: 'rgba(255,255,255,0.72)', boxShadow: elev.e2 };

function Dot({ on, onPress }: { on: boolean; onPress: () => void }) {
  const w = useRef(new Animated.Value(on ? 24 : 6)).current;
  useEffect(() => { Animated.timing(w, { toValue: on ? 24 : 6, duration: 420, easing: ease.spring, useNativeDriver: false }).start(); }, [on, w]);
  return (
    <Pressable onPress={onPress} hitSlop={6}>
      <Animated.View style={[styles.dot, { width: w, backgroundColor: on ? '#FFFFFF' : 'rgba(255,255,255,0.55)' }]} />
    </Pressable>
  );
}

const EXPLORE: [ScreenName, string, string][] = [['vrTour', 'glasses', 'VR Tour'], ['aerial', 'plane', 'Aerial'], ['specs', 'list-checks', 'Specs'], ['locationView', 'map-pin', 'Location'], ['advantages', 'sparkles', 'Advantages'], ['compare', 'git-compare', 'Compare']];

/** B-04 Property detail */
export function PropertyDetailScreen({ go, back, ctx, fav, toggleFav }: ScreenProps) {
  const { property: p, loading, error } = useResolvedProperty(ctx);
  const insets = useSafeAreaInsets();
  const [img, setImg] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [toast, setToast] = useState('');
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 1600); return () => clearTimeout(t); }, [toast]);

  useEffect(() => {
    if (p?.soldOut) go('soldOut', { p });
  }, [p, go]);

  if (loading) {
    return (
      <Screen>
        <TopBar onBack={back} title="Property" />
        <View style={styles.centerLoad}><ActivityIndicator color={colors.brand600} size="large" /></View>
      </Screen>
    );
  }
  if (!p) {
    return (
      <Screen>
        <TopBar onBack={back} title="Property" />
        <EmptyState icon="building-2" title="Property not found" body={error || 'This listing may have been removed.'}
          action={<Btn onPress={back}>Go back</Btn>} />
      </Screen>
    );
  }

  const n = p.images.length || 1;
  const isFav = fav.has(p.id);
  const enquired = !!jBuy(p.id)?.enquiry;

  const gallery = (h?: number) => (
    <SwipeGallery count={n} index={img} onIndex={setImg} height={h} style={h ? undefined : styles.flex1}>
      {(p.images.length ? p.images : ['']).map((_, i) => <PhotoPlaceholder key={i} tag={p.id + i} style={styles.full} />)}
    </SwipeGallery>
  );

  const hero = (
    <View style={styles.full}>
      {gallery(280)}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Press onPress={back} style={[styles.round40, glass, styles.backBtn]} accessibilityLabel="Back"><Icon name="arrow-left" size={18} /></Press>
        {p.verified && (
          <View style={styles.verified} pointerEvents="none">
            <Icon name="badge-check" size={12} color="white" />
            <T s={11} w={700} c="#FFFFFF">Verified</T>
          </View>
        )}
        <View style={styles.topRight}>
          <Press onPress={() => { toggleFav(p.id); buzz(); }} style={[styles.round40, glass]} accessibilityLabel="Save">
            <Icon name="heart" size={18} color={isFav ? '#E11D48' : '#0F172A'} fill={isFav ? '#E11D48' : 'none'} />
          </Press>
          <Press onPress={() => go('shareProperty', { p })} style={[styles.round40, glass]} accessibilityLabel="Share"><Icon name="share-2" size={18} /></Press>
        </View>
        <Press onPress={() => setFullscreen(true)} style={[styles.round36, styles.maxBtn, { backgroundColor: 'rgba(255,255,255,0.72)', boxShadow: ring('rgba(255,255,255,0.5)') }]} accessibilityLabel="Full screen">
          <Icon name="maximize-2" size={16} />
        </Press>
        <View style={styles.counter} pointerEvents="none"><T num s={11} w={700} c="#FFFFFF">{img + 1}/{n}</T></View>
        <View style={styles.dots} pointerEvents="box-none">
          {(p.images.length ? p.images : ['']).map((_, i) => <Dot key={i} on={i === img} onPress={() => setImg(i)} />)}
        </View>
        <View style={styles.hint} pointerEvents="none"><T s={10} w={600} c="rgba(255,255,255,0.7)" ls={0.025}>swipe to browse</T></View>
      </View>
    </View>
  );

  const overlay = (
    <>
      <Toast message={toast} />
      {fullscreen && (
        <View style={[styles.viewer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.viewerStage}>
            {gallery()}
            <Pressable onPress={() => setFullscreen(false)} style={[styles.round36, styles.vClose]} accessibilityLabel="Close"><Icon name="x" size={18} color="white" /></Pressable>
            <View style={styles.vCount}><T s={11} w={600} c="#FFFFFF">{img + 1}/{n}</T></View>
            <Pressable onPress={() => setImg(i => (i === 0 ? n - 1 : i - 1))} style={[styles.round36, styles.vPrev]} accessibilityLabel="Previous"><Icon name="chevron-left" size={18} color="white" /></Pressable>
            <Pressable onPress={() => setImg(i => (i === n - 1 ? 0 : i + 1))} style={[styles.round36, styles.vNext]} accessibilityLabel="Next"><Icon name="chevron-right" size={18} color="white" /></Pressable>
          </View>
          <View style={styles.vBar}>
            <Pressable onPress={() => setFullscreen(false)} style={styles.vBtnLight}><T s={12} w={600} c="#000000">Close</T></Pressable>
            <Pressable onPress={() => setToast('Download started')} style={styles.vBtnBrand}>
              <Icon name="download" size={12} color="white" />
              <T s={12} w={600} c="#FFFFFF">Download</T>
            </Pressable>
          </View>
        </View>
      )}
    </>
  );

  return (
    <DetailScreen
      title={p.title}
      onBack={back}
      hero={hero}
      heroHeight={280}
      overlay={overlay}
      dockSummary={
        <>
          <PriceBlock price={formatINR(p.price)} per={`${formatINR(p.sqftPrice)}/sqft`} note={p.negotiable ? 'Negotiable' : null} />
          <Press onPress={() => { toggleFav(p.id); buzz(); }} style={styles.favDock} accessibilityLabel="Save">
            <Icon name="heart" size={19} color={isFav ? '#E11D48' : '#64748B'} fill={isFav ? '#E11D48' : 'none'} />
          </Press>
        </>
      }
      dock={[
        <Btn key="v" variant="outline" full icon={enquired ? 'calendar' : 'lock'} onPress={() => go('visitCalendar', { p })}>Schedule Visit</Btn>,
        <Btn key="e" full icon="message-circle" onPress={() => go('enquiry', { p })}>Enquire</Btn>,
      ]}>
      <View style={styles.body}>
        <T display s={20} w={800} lh={1.375} ls={-0.025}>{p.title}</T>
        <Pressable onPress={() => go('mapView', { p })} style={styles.locRow}>
          <Icon name="map-pin" size={13} color={colors.ink500} />
          <T s={12.5} c={colors.ink500}>{p.location}, {p.city}</T>
          <T s={12.5} w={600} c={colors.brand600} style={styles.ml4}>View map →</T>
        </Pressable>
        <View style={styles.mt16}>
          <SpecGrid cols={4} items={[
            { icon: 'bed-double', value: p.bhk > 0 ? p.bhk : '—', label: 'BHK' },
            { icon: 'ruler', value: p.area, label: 'sqft' },
            { icon: 'building', value: p.floor, label: 'Floor' },
            { icon: 'calendar', value: '—', label: 'Age' },
          ]} />
        </View>
        <View style={styles.mt20}>
          <SectionTitle>About this property</SectionTitle>
          <T s={13} c={colors.ink600} lh={1.625}>{p.desc}</T>
        </View>
        <DetailLocationAdvantages p={p} go={go} />
        <View style={styles.mt20}><SectionTitle>Floor plan</SectionTitle></View>
        <Grid cols={3} gap={8} style={styles.mb20}>
          {[0, 1, 2].map(i => (
            <Pressable key={i} onPress={() => go('floorPlan', { p })} style={styles.plan}>
              <PhotoPlaceholder noPhoto gradient={['#E8EEF6', '#CBD8E8']} tag={'plan-' + p.id + i} height={90}>
                <View style={styles.planLabel}><T s={10} w={600} c="#FFFFFF">Plan {i + 1}</T></View>
                <View style={styles.planMax}><Icon name="maximize-2" size={10} color="white" /></View>
              </PhotoPlaceholder>
            </Pressable>
          ))}
        </Grid>
        <View style={styles.mb8}><SectionTitle>Explore</SectionTitle></View>
        <Grid cols={3} gap={8} style={styles.mb20}>
          {EXPLORE.map(([k, ic, l]) => (
            <Press key={k} onPress={() => { if (k === 'compare' && !getJ().compare.includes(p.id)) jToggleCompare(p.id); go(k, { p }); }} style={styles.explore}>
              <Icon name={ic} size={20} color="#1A6FFF" style={styles.mb4} />
              <T s={11} w={600} align="center">{l}</T>
            </Press>
          ))}
        </Grid>
        <Card pad={12} style={styles.advisor}>
          <View style={styles.avatar}><T s={16} w={700} c="#FFFFFF">RS</T></View>
          <View style={styles.flex1}>
            <T s={13.5} w={700} truncate>Rajesh Subramanian</T>
            <T s={11} c={colors.ink500}>Builtglory Advisor · 4.9 ★</T>
          </View>
          <Press onPress={() => setToast('Calling advisor…')} style={styles.call} accessibilityLabel="Call advisor"><Icon name="phone" size={15} color="#1A6FFF" /></Press>
        </Card>
      </View>
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  full: { width: '100%', height: '100%' },
  centerLoad: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  mb4: { marginBottom: 4 },
  mb8: { marginBottom: 8 },
  mb20: { marginBottom: 20 },
  mt16: { marginTop: 16 },
  mt20: { marginTop: 20 },
  ml4: { marginLeft: 4 },
  round40: { width: 40, height: 40, borderRadius: 9999, alignItems: 'center', justifyContent: 'center' },
  round36: { width: 36, height: 36, borderRadius: 9999, alignItems: 'center', justifyContent: 'center' },
  backBtn: { position: 'absolute', left: 16, top: 12 },
  verified: { position: 'absolute', top: 64, left: 16, backgroundColor: colors.emerald500, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 9999, flexDirection: 'row', alignItems: 'center', gap: 4, boxShadow: elev.e2 },
  topRight: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', gap: 8 },
  maxBtn: { position: 'absolute', bottom: 12, left: 12 },
  counter: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(9,14,30,0.55)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999 },
  dots: { position: 'absolute', bottom: 14, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { height: 6, borderRadius: 9999 },
  hint: { position: 'absolute', bottom: 36, left: 0, right: 0, alignItems: 'center' },
  favDock: { width: 44, height: 44, borderRadius: 9999, backgroundColor: colors.ink100, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 16, paddingTop: 4 },
  locRow: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  plan: { borderRadius: 6, overflow: 'hidden', height: 90 },
  planLabel: { position: 'absolute', bottom: 4, left: 4, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 4, paddingHorizontal: 6 },
  planMax: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 9999, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  explore: { padding: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.ink200, backgroundColor: colors.white, alignItems: 'center' },
  advisor: { flexDirection: 'row', alignItems: 'center', gap: 12, experimental_backgroundImage: `linear-gradient(90deg, ${colors.brand50}, #FFFFFF)` },
  avatar: { width: 44, height: 44, borderRadius: 9999, experimental_backgroundImage: 'linear-gradient(135deg, #3B86FF, #1259D4)', alignItems: 'center', justifyContent: 'center', boxShadow: elev.e2 },
  call: { width: 40, height: 40, borderRadius: 9999, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', boxShadow: elev.e2 },
  viewer: { ...StyleSheet.absoluteFillObject, zIndex: 50, backgroundColor: '#000000' },
  viewerStage: { flex: 1, overflow: 'hidden' },
  vClose: { position: 'absolute', top: 16, left: 16, backgroundColor: 'rgba(255,255,255,0.2)', zIndex: 10 },
  vCount: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 9999 },
  vPrev: { position: 'absolute', left: 12, top: '50%', marginTop: -18, backgroundColor: 'rgba(255,255,255,0.2)', zIndex: 10 },
  vNext: { position: 'absolute', right: 12, top: '50%', marginTop: -18, backgroundColor: 'rgba(255,255,255,0.2)', zIndex: 10 },
  vBar: { backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', justifyContent: 'center', gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  vBtnLight: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.white },
  vBtnBrand: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.brand600, flexDirection: 'row', alignItems: 'center', gap: 6 },
});
