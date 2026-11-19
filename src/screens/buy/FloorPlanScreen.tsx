import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type DimensionValue } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { Icon } from '../../components/icons/Icon';
import { Screen, TopBar } from '../../components/layout/Screen';
import { T } from '../../components/ui/T';
import { Toast } from '../../components/ui/Toast';
import type { ScreenProps } from '../../navigation/types';
import { colors, ring } from '../../theme';
import { useToast } from '../../utils/useToast';

const PLANS = [
  { label: '2 BHK — 950 sqft', tag: 'plan-a' },
  { label: '3 BHK — 1200 sqft', tag: 'plan-b' },
  { label: '4 BHK — 1600 sqft', tag: 'plan-c' },
];
const ROOMS: { n: string; a: string; l: DimensionValue; t: DimensionValue; w: DimensionValue; h: DimensionValue }[] = [
  { n: 'Living Room', a: '320 sqft', l: '6%', t: '7%', w: '41%', h: '42%' },
  { n: 'Kitchen', a: '110 sqft', l: '50%', t: '7%', w: '27%', h: '25%' },
  { n: 'Bath', a: '45 sqft', l: '79%', t: '7%', w: '15%', h: '25%' },
  { n: 'Master Bed', a: '190 sqft', l: '6%', t: '52%', w: '41%', h: '33%' },
  { n: 'Bed 2', a: '150 sqft', l: '50%', t: '35%', w: '44%', h: '24%' },
  { n: 'Balcony', a: '70 sqft', l: '50%', t: '62%', w: '44%', h: '23%' },
];

/** Blueprint grid lines every 16px. */
function Blueprint() {
  const [w, setW] = useState(0);
  return (
    <View style={[StyleSheet.absoluteFill, styles.grid]} onLayout={e => setW(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <Svg width={w} height={320}>
          {Array.from({ length: Math.ceil(w / 16) }).map((_, i) => <Line key={'v' + i} x1={i * 16 + 0.5} y1={0} x2={i * 16 + 0.5} y2={320} stroke="rgba(26,111,255,0.09)" strokeWidth={1} />)}
          {Array.from({ length: 20 }).map((_, i) => <Line key={'h' + i} x1={0} y1={i * 16 + 0.5} x2={w} y2={i * 16 + 0.5} stroke="rgba(26,111,255,0.09)" strokeWidth={1} />)}
        </Svg>
      )}
    </View>
  );
}

/** B-04a Floor plan viewer */
export function FloorPlanScreen({ back }: ScreenProps) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [toast, showToast] = useToast(2000);
  return (
    <Screen dark footer={<Toast message={toast} />}>
      <TopBar onBack={back} title="Floor Plans" dark right={
        <Pressable onPress={() => showToast('Floor plan saved to Photos')} style={styles.dl} accessibilityLabel="Download"><Icon name="download" size={16} color="white" /></Pressable>
      } />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs} style={styles.mb12}>
        {PLANS.map((pl, i) => (
          <Pressable key={i} onPress={() => setActive(i)} style={[styles.tab, { backgroundColor: active === i ? colors.brand600 : 'rgba(255,255,255,0.1)' }]}>
            <T s={12} w={600} c={active === i ? colors.white : 'rgba(255,255,255,0.7)'}>{pl.label}</T>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.planWrap}>
        <View style={{ transform: [{ scale: zoom }] }}>
          <View style={styles.plan}>
            <Blueprint />
            <View style={styles.wall} />
            {ROOMS.map(r => (
              <View key={r.n} style={[styles.room, { left: r.l, top: r.t, width: r.w, height: r.h }]}>
                <T s={9.5} w={700} c="#1B3A5C" lh={1.25} align="center">{r.n}</T>
                <T num s={8} c="#5B7B9E" align="center" style={styles.mt2}>{r.a}</T>
              </View>
            ))}
            <View style={styles.compassRow}>
              <T num s={10} w={700} c="#5B7B9E">{PLANS[active].label}</T>
              <View style={styles.compass}>
                <Icon name="compass" size={13} color="#24466F" />
                <T s={9} w={700} c="#24466F">N</T>
              </View>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.zoomRow}>
        <Pressable onPress={() => setZoom(z => Math.max(0.7, z - 0.2))} style={styles.zoomBtn} accessibilityLabel="Zoom out"><Icon name="zoom-out" size={18} color="white" /></Pressable>
        <T s={12} c="rgba(255,255,255,0.7)" align="center" style={styles.zoomLabel}>{Math.round(zoom * 100)}%</T>
        <Pressable onPress={() => setZoom(z => Math.min(2.5, z + 0.2))} style={styles.zoomBtn} accessibilityLabel="Zoom in"><Icon name="zoom-in" size={18} color="white" /></Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mt2: { marginTop: 2 },
  mb12: { marginBottom: 12, flexGrow: 0 },
  dl: { width: 36, height: 36, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  tabs: { gap: 8, paddingHorizontal: 16 },
  tab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 },
  planWrap: { paddingHorizontal: 16 },
  plan: { width: '100%', height: 320, borderRadius: 14, overflow: 'hidden', backgroundColor: '#EEF3FA', boxShadow: ring('#C3D2E4') },
  grid: { opacity: 0.7 },
  wall: { position: 'absolute', left: 12, right: 12, top: 12, bottom: 32, borderWidth: 3, borderColor: '#24466F', borderRadius: 3 },
  room: { position: 'absolute', borderWidth: 2, borderColor: '#3C6FA8', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  compassRow: { position: 'absolute', bottom: 6, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  compass: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  zoomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 16 },
  zoomBtn: { width: 40, height: 40, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  zoomLabel: { width: 48 },
});
