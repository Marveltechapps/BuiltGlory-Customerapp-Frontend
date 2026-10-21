import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppScreen } from '../../components/AppScreen';
import { Btn } from '../../components/Btn';
import { Chip } from '../../components/Form';
import { Icon } from '../../components/Icon';
import { Rise } from '../../components/Motion';
import { PropertyCard } from '../../components/PropertyCard';
import { Press } from '../../components/Press';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  SkeletonCard,
} from '../../components/States';
import { T } from '../../components/T';
import { propertyTypeById } from '../../config/catalog';
import type { BuyFilters } from '../../interfaces/BuyFilters';
import { usePaged } from '../../lib/useResource';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { listProperties } from '../../services/property.service';
import { palette, tw } from '../../theme';
import { activeFilterCount, toPropertyQuery } from '../../utils/filters';
import { toPropertyView } from '../../utils/property';

const QUICK: Array<[string, keyof BuyFilters]> = [
  ['Verified', 'verified'],
  ['Ready to move', 'readyToMove'],
  ['Under ₹1Cr', 'underOneCrore'],
  ['3+ BHK', 'threePlusBhk'],
  ['Negotiable', 'negotiable'],
];

/** B-03 Listing results. */
export function BuyListScreen({ params }: ScreenProps<'buyList'>) {
  const nav = useNav();
  const base = params.filters;
  const [chip, setChip] = useState<string>('Verified');
  const quickKey = QUICK.find(([label]) => label === chip)?.[1];
  const filters: BuyFilters = {
    ...base,
    ...(quickKey ? { [quickKey]: true } : {}),
  };
  const key = JSON.stringify(filters);
  const list = usePaged(
    (page, signal) =>
      listProperties(toPropertyQuery(filters, page, 20), signal).then(r => ({
        data: r.data.map(toPropertyView),
        meta: r.meta,
      })),
    [key],
  );
  const label = propertyTypeById(base.typeId)?.label ?? 'Properties';
  const count = activeFilterCount(base);

  return (
    <AppScreen
      title={label}
      sub={
        list.loading
          ? 'Loading…'
          : `${list.total} properties${base.city ? ` in ${base.city}` : ''}`
      }
      right={
        <Press
          onPress={() => nav.go('mapView', { filters })}
          style={styles.mapBtn}
          accessibilityLabel="Map view"
        >
          <Icon name="map" size={16} />
        </Press>
      }
      sticky={
        <View style={styles.stickyCol}>
          <View style={styles.filterRow}>
            <Press
              onPress={() => nav.go('filters', { filters: base })}
              style={styles.filterBtn}
            >
              <Icon
                name="sliders-horizontal"
                size={14}
                color={palette.ink[700]}
              />
              <T style={styles.filterText}>Filters</T>
              {count > 0 && (
                <View style={styles.countBadge}>
                  <T style={styles.countText}>{count}</T>
                </View>
              )}
            </Press>
            <Press
              onPress={() => nav.go('advancedFilters', { filters: base })}
              style={styles.advBtn}
            >
              <Icon name="settings-2" size={14} color="#1A6FFF" />
              <T style={styles.advText}>Advanced</T>
            </Press>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {QUICK.map(([c]) => (
              <Chip
                key={c}
                active={chip === c}
                onPress={() => setChip(chip === c ? '' : c)}
              >
                {c}
              </Chip>
            ))}
          </ScrollView>
        </View>
      }
      dock={[
        <Btn
          key="map"
          variant="outline"
          icon="map"
          onPress={() => nav.go('mapView', { filters })}
          style={styles.full}
        >
          Map
        </Btn>,
        <Btn
          key="save"
          icon="bell"
          onPress={() => nav.go('filters', { filters: base })}
          style={styles.full}
        >
          Save search
        </Btn>,
      ]}
      refreshing={list.refreshing}
      onRefresh={list.refresh}
      onEndReached={list.loadMore}
    >
      {list.loading ? (
        <View style={styles.list}>
          {[1, 2, 3].map(i => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : list.error && !list.items.length ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : list.items.length === 0 ? (
        <EmptyState
          icon="search-x"
          title="No properties found"
          body="Try adjusting your filters or search a different area."
          action={
            <Btn
              variant="outline"
              onPress={() => nav.go('filters', { filters: base })}
            >
              Change filters
            </Btn>
          }
        />
      ) : (
        <View style={styles.list}>
          {list.items.map((p, i) => (
            <Rise
              key={p.id}
              delay={Math.min(i * 50, 300)}
              duration={550}
              distance={16}
            >
              <PropertyCard
                p={p}
                onPress={() =>
                  nav.go('propertyDetail', { id: p.id, property: p })
                }
              />
            </Rise>
          ))}
          {list.loadingMore && <LoadingState style={styles.more} />}
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  full: { alignSelf: 'stretch' },
  mapBtn: tw('w-9 h-9 rounded-full bg-ink-100 items-center justify-center'),
  stickyCol: { gap: 8 },
  filterRow: tw('flex gap-2'),
  filterBtn: tw(
    'flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border border-ink-200 bg-white',
  ),
  filterText: tw('text-[13px] font-semibold text-ink-700'),
  countBadge: tw(
    'w-[18px] h-[18px] rounded-full bg-brand-600 items-center justify-center',
  ),
  countText: {
    fontSize: 10,
    lineHeight: 12,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  advBtn: {
    ...tw('px-3.5 h-10 rounded-xl bg-brand-50 flex items-center gap-1.5'),
    borderWidth: 1,
    borderColor: palette.brand[100],
  },
  advText: tw('text-[13px] font-bold text-brand-700'),
  chips: tw('flex gap-2'),
  list: { ...tw('px-4 mt-3'), gap: 14 },
  more: tw('py-6'),
});
