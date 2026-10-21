import React, { useCallback } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useToast } from '../context/ToastContext';
import type { PropertyView } from '../interfaces/PropertyView';
import { useNav } from '../navigation/NavContext';
import { tw, twh } from '../theme';
import { errorMessage } from '../utils/errorMessage';
import { formatINR } from '../utils/format';
import { placeLabel } from '../utils/property';
import { Badge, Heart } from './Form';
import { Icon } from './Icon';
import { PhotoPlaceholder } from './PhotoPlaceholder';
import { Press } from './Press';
import { T } from './T';

/** Save/unsave with the guest gate and error toast the reference flows expect. */
export function useFavToggle() {
  const { isSignedIn } = useAuth();
  const { toggle, isSaved } = useFavorites();
  const nav = useNav();
  const toast = useToast();
  const onToggle = useCallback(
    async (id: string) => {
      if (!isSignedIn) {
        nav.signIn(null);
        return;
      }
      try {
        await toggle(id);
      } catch (e) {
        toast.show(errorMessage(e), 'error');
      }
    },
    [isSignedIn, nav, toast, toggle],
  );
  return { onToggle, isSaved: (id: string) => isSignedIn && isSaved(id) };
}

interface CardProps {
  p: PropertyView;
  onPress?: () => void;
  variant?: 'list' | 'compact';
  style?: StyleProp<ViewStyle>;
  /** Hide the heart (e.g. cards inside non-interactive previews). */
  hideHeart?: boolean;
}

export function PropertyCard({
  p,
  onPress,
  variant = 'list',
  style,
  hideHeart,
}: CardProps) {
  const { onToggle, isSaved } = useFavToggle();
  const fav = isSaved(p.id);
  const area = p.area ? String(p.area) : '—';
  if (variant === 'compact') {
    return (
      <Press
        onPress={onPress}
        style={[styles.card, style]}
        accessibilityLabel={p.title}
      >
        <View style={styles.compactRow}>
          <PhotoPlaceholder
            tag={p.id}
            src={p.images[0]}
            style={styles.compactPhoto}
          >
            <View style={styles.compactBadge}>
              <Badge color="brand">{p.typeTag}</Badge>
            </View>
          </PhotoPlaceholder>
          <View style={styles.compactBody}>
            <View style={styles.compactTop}>
              <T style={styles.compactTitle} numberOfLines={1}>
                {p.title}
              </T>
              {!hideHeart && (
                <Heart active={fav} onPress={() => onToggle(p.id)} />
              )}
            </View>
            <View style={styles.compactLoc}>
              <Icon name="map-pin" size={11} color="#64748B" />
              <T style={styles.compactLocText} numberOfLines={1}>
                {placeLabel(p)}
              </T>
            </View>
            <T style={styles.compactPrice}>{formatINR(p.price)}</T>
            <View style={styles.compactMeta}>
              {p.bhk ? (
                <T style={styles.meta11}>
                  <T style={styles.metaStrong11}>{p.bhk}</T> BHK
                </T>
              ) : null}
              <T style={styles.meta11}>
                <T style={styles.metaStrong11}>{area}</T> sqft
              </T>
              {p.verified && (
                <View style={styles.verifiedInline}>
                  <Icon name="badge-check" size={11} color="#009966" />
                  <T style={styles.verifiedText}>Verified</T>
                </View>
              )}
            </View>
          </View>
        </View>
      </Press>
    );
  }
  return (
    <Press
      onPress={onPress}
      style={[styles.card, style]}
      accessibilityLabel={p.title}
    >
      <PhotoPlaceholder tag={p.id} src={p.images[0]} height={200}>
        <View style={styles.badges}>
          <Badge color="brand">{p.typeTag}</Badge>
          {p.verified && (
            <Badge color="green" icon="badge-check">
              Verified
            </Badge>
          )}
        </View>
        {!hideHeart && (
          <View style={styles.heart}>
            <Heart active={fav} onPress={() => onToggle(p.id)} />
          </View>
        )}
      </PhotoPlaceholder>
      <View style={styles.body}>
        <T style={styles.title} numberOfLines={1}>
          {p.title}
        </T>
        <T style={styles.price}>{formatINR(p.price)}</T>
        <View style={styles.metaRow}>
          {p.bhk ? (
            <View style={styles.metaItem}>
              <Icon name="bed-double" size={12} color="#64748B" />
              <T style={styles.meta12}>
                <T style={styles.metaStrong12}>{p.bhk}</T> BHK
              </T>
            </View>
          ) : null}
          <View style={styles.metaItem}>
            <Icon name="ruler" size={12} color="#64748B" />
            <T style={styles.meta12}>
              <T style={styles.metaStrong12}>{area}</T> sqft
            </T>
          </View>
          {!p.bhk && p.pricePerSqft ? (
            <View style={styles.metaItem}>
              <Icon name="trending-up" size={12} color="#64748B" />
              <T style={styles.meta12}>{formatINR(p.pricePerSqft)}/sqft</T>
            </View>
          ) : null}
        </View>
        <View style={styles.locRow}>
          <Icon name="map-pin" size={12} color="#1D4ED8" />
          <T style={styles.loc} numberOfLines={1}>
            {placeLabel(p)}
          </T>
        </View>
      </View>
    </Press>
  );
}

const styles = StyleSheet.create({
  card: tw(
    'w-full bg-white rounded-card overflow-hidden border border-ink-200 elev-1',
  ),
  badges: tw('absolute top-3 left-3 flex gap-1.5'),
  heart: tw('absolute top-3 right-3'),
  body: tw('p-3.5'),
  title: twh('text-[16px] font-bold text-ink-900 leading-snug'),
  price: tw(
    'num mt-1.5 text-[20px] font-extrabold text-brand-700 tracking-[-.03em]',
  ),
  metaRow: tw('mt-2 flex items-center gap-3'),
  metaItem: tw('flex items-center gap-1'),
  meta12: tw('text-[12px] text-ink-500'),
  metaStrong12: tw('text-[12px] font-bold text-ink-700'),
  locRow: tw('mt-2 flex items-center gap-1'),
  loc: tw('flex-1 text-[12px] text-brand-700 font-medium'),
  compactRow: tw('flex gap-3 p-2'),
  compactPhoto: { ...tw('rounded-lg shrink-0'), width: 92, height: 92 },
  compactBadge: tw('absolute top-1.5 left-1.5'),
  compactBody: tw('flex-1 min-w-0 py-1'),
  compactTop: tw('flex items-start justify-between gap-2'),
  compactTitle: tw('flex-1 text-[14px] font-semibold text-ink-900'),
  compactLoc: tw('flex items-center gap-1 mt-0.5'),
  compactLocText: tw('flex-1 text-[11px] text-ink-500'),
  compactPrice: tw(
    'num text-[16px] font-extrabold text-brand-700 mt-1 tracking-[-.02em]',
  ),
  compactMeta: tw('flex items-center gap-3 mt-1'),
  meta11: tw('text-[11px] text-ink-500'),
  metaStrong11: tw('text-[11px] font-bold text-ink-700'),
  verifiedInline: tw('flex items-center gap-0.5'),
  verifiedText: tw('text-[11px] text-emerald-600'),
});
