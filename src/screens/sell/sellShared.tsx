import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from '../../components/Icon';
import { Press } from '../../components/Press';
import { T } from '../../components/T';
import { useSellFlow } from '../../context/SellFlowContext';
import { useToast } from '../../context/ToastContext';
import { useResource } from '../../lib/useResource';
import { getSellerActivity } from '../../services/sellRequest.service';
import { palette, tw } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';

/** Pill chip used across the listing wizard (`px-4 py-2 rounded-full` brand / ink-100). */
export function PillChoice({
  label,
  on,
  onPress,
  compact,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <Press
      onPress={onPress}
      style={[
        compact ? styles.pillCompact : styles.pill,
        on ? styles.pillOn : styles.pillOff,
      ]}
    >
      <T style={[styles.pillText, on ? styles.pillTextOn : styles.pillTextOff]}>
        {label}
      </T>
    </Press>
  );
}

/** Bordered option tile (`py-2 rounded-card border`, brand-50 when selected). */
export function TileChoice({
  label,
  on,
  onPress,
  small,
  bold,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
  small?: boolean;
  bold?: boolean;
}) {
  return (
    <Press
      onPress={onPress}
      style={[styles.tile, on ? styles.tileOn : styles.tileOff]}
    >
      <T
        style={[
          small ? styles.tileTextSm : styles.tileText,
          on && styles.tileTextOn,
          bold ? on && styles.semibold : styles.medium,
        ]}
      >
        {label}
      </T>
    </Press>
  );
}

/** Selected type banner with an edit button (SL-01 / SL-04). */
export function TypeBanner({
  label,
  onEdit,
}: {
  label: string;
  onEdit: () => void;
}) {
  return (
    <View style={styles.banner}>
      <T style={styles.bannerText}>{label}</T>
      <Press
        onPress={onEdit}
        style={styles.bannerEdit}
        accessibilityLabel="Change property type"
      >
        <Icon name="edit-2" size={14} color="#1A6FFF" />
      </Press>
    </View>
  );
}

/** Keep the server draft in step with the wizard without blocking navigation. */
export function useBackgroundDraftSave() {
  const sell = useSellFlow();
  const toast = useToast();
  return (step: number) => {
    sell
      .saveDraft(step)
      .catch(e => toast.show(`Draft not saved: ${errorMessage(e)}`, 'warn'));
  };
}

/** GET /me/sell-requests/:id/activity for the seller lifecycle screens. */
export function useSellerActivity(id: string) {
  return useResource(signal => getSellerActivity(id, signal), [id]);
}

/** "Sunrise Heights — 3 BHK" style label for a sell request. */
export function listingTitle(
  req?: {
    propertyTitle?: string;
    specifications?: { bhk?: string | null } | null;
  } | null,
) {
  if (!req) return '';
  const title = req.propertyTitle || 'Your property';
  const bhk = req.specifications?.bhk;
  return bhk && !title.toLowerCase().includes('bhk')
    ? `${title} — ${/bhk|studio/i.test(bhk) ? bhk : `${bhk} BHK`}`
    : title;
}

const styles = StyleSheet.create({
  pill: tw('px-4 py-2 rounded-full'),
  pillCompact: tw('px-3 py-2 rounded-full'),
  pillOn: tw('bg-brand-600'),
  pillOff: tw('bg-ink-100'),
  pillText: tw('text-[12px] font-medium'),
  pillTextOn: { color: '#FFFFFF' },
  pillTextOff: { color: palette.ink[700] },
  tile: tw('py-2 rounded-card border items-center justify-center'),
  tileOn: tw('border-brand-600 bg-brand-50'),
  tileOff: tw('border-ink-200'),
  tileText: tw('text-[12px]'),
  tileTextSm: tw('text-[11px]'),
  tileTextOn: tw('text-brand-700'),
  medium: tw('font-medium'),
  semibold: tw('font-semibold'),
  banner: tw(
    'flex items-center justify-between bg-brand-50 rounded-full px-4 py-2.5',
  ),
  bannerText: tw('text-brand-600 text-[13px] font-medium'),
  bannerEdit: tw('p-1'),
});

/** Seller-facing label for each sell request status. */
export const SELL_STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  new: 'Submitted',
  under_review: 'In review',
  changes_requested: 'Changes requested',
  accepted: 'Accepted',
  approved: 'Approved',
  active: 'Live',
  negotiating: 'Negotiating',
  paused: 'Paused',
  sold: 'Sold',
  rejected: 'Rejected',
};
