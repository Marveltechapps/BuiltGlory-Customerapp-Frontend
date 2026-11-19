import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { jToggleCompare, useJ } from '../../context/journeyStore';
import type { ScreenName } from '../../navigation/types';
import { colors, elev, gradients, ring, shadows } from '../../theme';
import type { Property } from '../../types/property';
import { advantagesFor, nearbyFor } from '../../utils/propertyInsights';
import { Icon } from '../icons/Icon';
import { buzz, Press } from '../ui/Press';
import { SectionTitle } from '../ui/SectionTitle';
import { T } from '../ui/T';

/** "Compare" pill over a listing card photo (up to 3 properties). */
export function CompareToggle({ pid }: { pid: string }) {
  const s = useJ();
  const on = s.compare.includes(pid);
  const full = !on && s.compare.length >= 3;
  return (
    <Press
      disabled={full}
      onPress={() => { if (jToggleCompare(pid)) buzz(); }}
      accessibilityLabel={full ? 'You can compare up to 3 properties' : on ? 'Remove from compare' : 'Add to compare'}
      style={[styles.compare, on ? styles.compareOn : styles.compareOff, full && styles.half]}>
      <View style={[styles.box, on ? styles.boxOn : styles.boxOff]}>
        {on && <Icon name="check" size={11} color="#1A6FFF" strokeWidth={3} />}
      </View>
      <T s={11.5} w={700} c={on ? colors.white : colors.ink800}>Compare</T>
    </Press>
  );
}

/** Map preview pin used on location cards. */
export function MapPin({ size = 40, icon = 20 }: { size?: number; icon?: number }) {
  return (
    <View style={styles.pinWrap} pointerEvents="none">
      <View style={[styles.pin, { width: size, height: size, marginTop: -size }]}>
        <Icon name="map-pin" size={icon} color="white" />
      </View>
    </View>
  );
}

/** Location + Advantages previews on the property detail screen. */
export function DetailLocationAdvantages({ p, go }: { p: Property; go: (s: ScreenName, ctx?: Record<string, unknown>) => void }) {
  const near = nearbyFor(p).slice(0, 3);
  const advs = advantagesFor(p).slice(0, 3);
  return (
    <>
      <View style={styles.mt20}>
        <SectionTitle action={<Pressable onPress={() => go('locationView', { p })}><T s={12} w={700} c={colors.brand600}>See all</T></Pressable>}>Location</SectionTitle>
        <Pressable onPress={() => go('locationView', { p })} style={styles.locCard} accessibilityRole="button">
          <View style={styles.map96}>
            <View style={[StyleSheet.absoluteFill, styles.mapBg]} />
            <MapGrid />
            <MapPin size={32} icon={15} />
          </View>
          <View style={styles.nearRow}>
            {near.map(n => (
              <View key={n.label} style={styles.nearCell}>
                <T s={10.5} c={colors.ink500} truncate>{n.label}</T>
                <T num s={12.5} w={700}>{n.km} km</T>
              </View>
            ))}
          </View>
        </Pressable>
      </View>
      <View style={styles.mt20}>
        <SectionTitle action={<Pressable onPress={() => go('advantages', { p })}><T s={12} w={700} c={colors.brand600}>See all</T></Pressable>}>Advantages</SectionTitle>
        <View style={styles.gap8}>
          {advs.map(a => (
            <View key={a.title} style={styles.adv}>
              <View style={[styles.advIcon, { backgroundColor: a.color + '18' }]}><Icon name={a.icon} size={16} color={a.color} /></View>
              <View style={styles.flex1}>
                <T s={13} w={700} truncate>{a.title}</T>
                <T s={11} c={colors.ink500} truncate>{a.body}</T>
              </View>
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

/** White grid lines over the map backdrop (.bg-map::before). */
/**
 * The design's .bg-map::before grid: two 1px white (55%) lines per 38px tile, tiled from the top-left.
 * The vertical line sits at each tile's left edge, the horizontal one at its bottom edge (0deg gradient).
 * Drawn with an SVG pattern because React Native's background-image has no background-size tiling.
 */
export function MapGrid() {
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Defs>
        <Pattern id="bgMapGrid" x={0} y={0} width={38} height={38} patternUnits="userSpaceOnUse">
          <Rect x={0} y={0} width={1} height={38} fill="rgba(255,255,255,0.55)" />
          <Rect x={0} y={37} width={38} height={1} fill="rgba(255,255,255,0.55)" />
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" fill="url(#bgMapGrid)" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  mt20: { marginTop: 20 },
  gap8: { gap: 8 },
  half: { opacity: 0.5 },
  compare: { position: 'absolute', right: 12, top: 158, zIndex: 10, height: 32, paddingLeft: 8, paddingRight: 12, borderRadius: 9999, flexDirection: 'row', alignItems: 'center', gap: 6 },
  compareOn: { backgroundColor: colors.brand600, boxShadow: elev.brand },
  compareOff: { backgroundColor: 'rgba(255,255,255,0.72)', boxShadow: ring('rgba(255,255,255,0.7)') },
  box: { width: 16, height: 16, borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  boxOn: {},
  boxOff: { boxShadow: ring(colors.ink400) },
  pinWrap: { position: 'absolute', left: 0, right: 0, top: '50%', alignItems: 'center' },
  pin: { borderRadius: 9999, backgroundColor: colors.brand600, alignItems: 'center', justifyContent: 'center', boxShadow: elev.brand },
  locCard: { width: '100%', borderRadius: 16, backgroundColor: colors.white, overflow: 'hidden', boxShadow: ring('rgba(226,232,240,0.7)') },
  map96: { height: 96 },
  mapBg: { experimental_backgroundImage: gradients.map },
  nearRow: { padding: 12, flexDirection: 'row', gap: 8 },
  nearCell: { flex: 1, minWidth: 0, borderRadius: 12, backgroundColor: colors.ink50, paddingHorizontal: 8, paddingVertical: 6 },
  adv: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 16, backgroundColor: colors.white, boxShadow: shadows(ring('rgba(226,232,240,0.7)')) },
  advIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
