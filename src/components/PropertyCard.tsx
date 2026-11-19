import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { Property } from '../types/property';
import { colors, elev } from '../theme';
import { formatINR } from '../utils/format';
import { Icon } from './icons/Icon';
import { PhotoPlaceholder } from './PhotoPlaceholder';
import { Badge } from './ui/Badge';
import { Heart } from './ui/Heart';
import { Press } from './ui/Press';
import { T } from './ui/T';

export interface PropertyCardProps {
  p: Property;
  onPress?: () => void;
  onFav?: () => void;
  fav?: boolean;
  variant?: 'list' | 'compact';
}

/** Listing card: full-width photo card, or a compact row with a square thumbnail. */
export function PropertyCard({ p, onPress, onFav, fav, variant = 'list' }: PropertyCardProps) {
  if (variant === 'compact') {
    return (
      <Press onPress={onPress} style={styles.card}>
        <View style={styles.compactRow}>
          <PhotoPlaceholder tag={p.id} style={styles.thumb}>
            <View style={styles.thumbBadge}><Badge color="brand">{p.type}</Badge></View>
          </PhotoPlaceholder>
          <View style={styles.compactBody}>
            <View style={styles.compactTop}>
              <T s={14} w={600} truncate style={styles.flex1}>{p.title}</T>
              <Heart active={fav} onPress={onFav} />
            </View>
            <View style={styles.inline4}>
              <Icon name="map-pin" size={11} color={colors.ink500} />
              <T s={11} c={colors.ink500}>{p.location}, {p.city}</T>
            </View>
            <T num s={16} w={800} c={colors.brand700} ls={-0.02} style={styles.mt4}>{formatINR(p.price)}</T>
            <View style={styles.compactMeta}>
              {p.bhk > 0 && <T s={11} c={colors.ink500}><T w={700} c={colors.ink700}>{p.bhk}</T> BHK</T>}
              <T s={11} c={colors.ink500}><T w={700} c={colors.ink700}>{p.area}</T> sqft</T>
              {p.verified && (
                <View style={styles.inline2}>
                  <Icon name="badge-check" size={11} color={colors.emerald600} />
                  <T s={11} c={colors.emerald600}>Verified</T>
                </View>
              )}
            </View>
          </View>
        </View>
      </Press>
    );
  }
  return (
    <Press onPress={onPress} style={styles.card}>
      <PhotoPlaceholder tag={p.id} height={200}>
        <View style={styles.badges}>
          <Badge color="brand">{p.type}</Badge>
          {p.verified && <Badge color="green" icon="badge-check">Verified</Badge>}
        </View>
        {p.soldOut && (
          <View style={styles.soldOverlay}>
            <View style={styles.soldStamp}><T s={13} w={900} c={colors.white} ls={0.2}>SOLD OUT</T></View>
          </View>
        )}
        <View style={styles.heart}><Heart active={fav} onPress={onFav} /></View>
      </PhotoPlaceholder>
      <View style={styles.body}>
        <T display s={16} w={700} ls={-0.02} lh={1.375} truncate>{p.title}</T>
        <T num s={20} w={800} c={colors.brand700} ls={-0.03} style={styles.mt6}>{formatINR(p.price)}</T>
        <View style={styles.meta}>
          {p.bhk > 0 && (
            <View style={styles.inline4}>
              <Icon name="bed-double" size={12} color={colors.ink500} />
              <T s={12} c={colors.ink500}><T w={700} c={colors.ink700}>{p.bhk}</T> BHK</T>
            </View>
          )}
          <View style={styles.inline4}>
            <Icon name="ruler" size={12} color={colors.ink500} />
            <T s={12} c={colors.ink500}><T w={700} c={colors.ink700}>{p.area}</T> sqft</T>
          </View>
          {p.bhk === 0 && (
            <View style={styles.inline4}>
              <Icon name="trending-up" size={12} color={colors.ink500} />
              <T s={12} c={colors.ink500}>{formatINR(p.sqftPrice)}/sqft</T>
            </View>
          )}
        </View>
        <View style={[styles.inline4, styles.mt8]}>
          <Icon name="map-pin" size={12} color="#1D4ED8" />
          <T s={12} w={500} c={colors.brand700} truncate style={styles.flex1}>{p.location}, {p.city}</T>
        </View>
      </View>
    </Press>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%', backgroundColor: colors.white, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: colors.ink200, boxShadow: elev.e1 },
  compactRow: { flexDirection: 'row', gap: 12, padding: 8 },
  thumb: { width: 92, height: 92, borderRadius: 8 },
  thumbBadge: { position: 'absolute', top: 6, left: 6 },
  compactBody: { flex: 1, minWidth: 0, paddingVertical: 4 },
  compactTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  compactMeta: { flexDirection: 'row', gap: 12, marginTop: 4, alignItems: 'center' },
  badges: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', gap: 6 },
  soldOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.45)', alignItems: 'center', justifyContent: 'center' },
  soldStamp: { borderWidth: 2, borderColor: colors.white, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, transform: [{ rotate: '-6deg' }] },
  heart: { position: 'absolute', top: 12, right: 12 },
  body: { padding: 14 },
  meta: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  inline4: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  inline2: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  flex1: { flex: 1 },
  mt4: { marginTop: 4 },
  mt6: { marginTop: 6 },
  mt8: { marginTop: 8 },
});
