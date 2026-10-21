import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Btn } from '../../components/Btn';
import { Badge, Heart } from '../../components/Form';
import { EmptyGlyph } from '../../components/Hero';
import { Icon } from '../../components/Icon';
import { Grid } from '../../components/Layout';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { PropertyCard, useFavToggle } from '../../components/PropertyCard';
import { Press } from '../../components/Press';
import { Screen } from '../../components/Screen';
import { Sheet } from '../../components/Sheet';
import {
  ErrorState,
  LoadingState,
  SkeletonCard,
} from '../../components/States';
import { T } from '../../components/T';
import type { PropertyView } from '../../interfaces/PropertyView';
import { usePaged } from '../../lib/useResource';
import { useNav } from '../../navigation/NavContext';
import { listProperties } from '../../services/property.service';
import { tw } from '../../theme';
import { formatINR } from '../../utils/format';
import { toPropertyView } from '../../utils/property';

type Sort = 'newest' | 'price_asc' | 'price_desc';
const SORT_LABELS: Record<Sort, string> = {
  newest: 'Newest First',
  price_asc: 'Price: Low → High',
  price_desc: 'Price: High → Low',
};

function GridCard({ p, onPress }: { p: PropertyView; onPress: () => void }) {
  const { onToggle, isSaved } = useFavToggle();
  return (
    <Press onPress={onPress} style={styles.gridCard}>
      <PhotoPlaceholder tag={p.id} src={p.images[0]} height={110}>
        <View style={styles.gridBadge}>
          <Badge color="brand">{p.typeTag}</Badge>
        </View>
        <View style={styles.gridHeart}>
          <Heart active={isSaved(p.id)} onPress={() => onToggle(p.id)} />
        </View>
      </PhotoPlaceholder>
      <View style={styles.gridBody}>
        <T style={styles.gridTitle} numberOfLines={1}>
          {p.title}
        </T>
        <T style={styles.gridLoc} numberOfLines={1}>
          {p.location}
        </T>
        <T style={styles.gridPrice}>{formatINR(p.price)}</T>
      </View>
    </Press>
  );
}

/** H-03 Featured properties. */
export function FeaturedListScreen() {
  const nav = useNav();
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [sort, setSort] = useState<Sort>('newest');
  const [showSort, setShowSort] = useState(false);
  const list = usePaged(
    (page, signal) =>
      listProperties({ featured: true, sort, page, limit: 20 }, signal).then(
        r => ({ data: r.data.map(toPropertyView), meta: r.meta }),
      ),
    [sort],
  );
  const open = (p: PropertyView) =>
    nav.go('propertyDetail', { id: p.id, property: p });

  const right = (
    <View style={styles.right}>
      <Press
        onPress={() => nav.go('filters', { filters: {} })}
        style={styles.roundBtn}
        accessibilityLabel="Filters"
      >
        <Icon name="sliders-horizontal" size={14} color="#334155" />
      </Press>
      <Press onPress={() => setShowSort(true)} style={styles.sortBtn}>
        <Icon name="arrow-up-down" size={11} color="#334155" />
        <T style={styles.sortText}>Sort</T>
      </Press>
      <View style={styles.toggle}>
        <Press
          pressScale={1}
          onPress={() => setView('list')}
          style={[styles.toggleBtn, view === 'list' && styles.toggleOn]}
          accessibilityLabel="List view"
        >
          <Icon name="list" size={14} />
        </Press>
        <Press
          pressScale={1}
          onPress={() => setView('grid')}
          style={[styles.toggleBtn, view === 'grid' && styles.toggleOn]}
          accessibilityLabel="Grid view"
        >
          <Icon name="grid-3x3" size={14} />
        </Press>
      </View>
    </View>
  );

  return (
    <Screen
      topBar={{
        title: 'Featured Properties',
        sub: list.loading ? 'Loading…' : `${list.total} hand-picked listings`,
        back: true,
        right,
      }}
      refreshing={list.refreshing}
      onRefresh={list.refresh}
      onEndReached={list.loadMore}
    >
      <View style={styles.body}>
        {list.loading ? (
          <View style={styles.stack}>
            {[0, 1, 2].map(i => (
              <SkeletonCard key={i} />
            ))}
          </View>
        ) : list.error && !list.items.length ? (
          <ErrorState message={list.error} onRetry={list.reload} />
        ) : list.items.length === 0 ? (
          <View style={styles.empty}>
            <EmptyGlyph name="search-x" />
            <T style={styles.emptyTitle}>No properties found</T>
            <T style={styles.emptySub}>Try adjusting your filters</T>
            <Btn
              variant="outline"
              size="sm"
              style={styles.emptyBtn}
              onPress={() => setSort('newest')}
            >
              Clear Filters
            </Btn>
          </View>
        ) : view === 'list' ? (
          <View style={styles.stack}>
            {list.items.map(p => (
              <PropertyCard key={p.id} p={p} onPress={() => open(p)} />
            ))}
          </View>
        ) : (
          <Grid cols={2} gap={12}>
            {list.items.map(p => (
              <GridCard key={p.id} p={p} onPress={() => open(p)} />
            ))}
          </Grid>
        )}
        {list.loadingMore && <LoadingState style={styles.more} />}
      </View>
      <Sheet
        visible={showSort}
        onClose={() => setShowSort(false)}
        title="Sort by"
      >
        <View style={styles.sortList}>
          {(Object.keys(SORT_LABELS) as Sort[]).map(k => (
            <Press
              key={k}
              pressScale={0.98}
              onPress={() => {
                setSort(k);
                setShowSort(false);
              }}
              style={[
                styles.sortRow,
                sort === k ? styles.sortOn : styles.sortOff,
              ]}
            >
              <T style={styles.sortLabel}>{SORT_LABELS[k]}</T>
              {sort === k && <Icon name="check" size={16} color="#1A6FFF" />}
            </Press>
          ))}
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  right: tw('flex items-center gap-1.5'),
  roundBtn: tw('w-8 h-8 rounded-full bg-ink-100 items-center justify-center'),
  sortBtn: tw('h-8 px-2 rounded-full bg-ink-100 flex items-center gap-1'),
  sortText: tw('text-[11px] font-medium text-ink-700'),
  toggle: tw('flex bg-ink-100 rounded-full p-0.5'),
  toggleBtn: tw('px-2 py-1 rounded-full'),
  toggleOn: {
    backgroundColor: '#FFFFFF',
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
  },
  body: tw('px-4 pb-6'),
  stack: { gap: 12 },
  empty: tw('py-16 items-center'),
  emptyTitle: tw('mt-3 text-[15px] font-semibold text-ink-700'),
  emptySub: tw('text-[12px] text-ink-500 mt-1'),
  emptyBtn: tw('mt-4 self-center'),
  more: tw('py-6'),
  gridCard: tw('bg-white border border-ink-200 rounded-card overflow-hidden'),
  gridBadge: tw('absolute top-2 left-2'),
  gridHeart: tw('absolute top-2 right-2'),
  gridBody: tw('p-2.5'),
  gridTitle: tw('text-[12px] font-semibold'),
  gridLoc: tw('text-[10px] text-ink-500'),
  gridPrice: tw('text-[13px] font-bold text-brand-600 mt-1'),
  sortList: { gap: 8 },
  sortRow: tw(
    'w-full flex items-center justify-between p-3 rounded-card border',
  ),
  sortOn: tw('border-brand-600 bg-brand-50'),
  sortOff: tw('border-ink-200'),
  sortLabel: tw('text-[14px] font-medium'),
});
