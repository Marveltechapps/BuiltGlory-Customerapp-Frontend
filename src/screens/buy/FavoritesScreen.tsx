import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomNav } from '../../components/BottomNav';
import { Btn } from '../../components/Btn';
import { StatusHero } from '../../components/Hero';
import { PropertyCard } from '../../components/PropertyCard';
import { Screen } from '../../components/Screen';
import { ErrorState, SkeletonCard } from '../../components/States';
import { T } from '../../components/T';
import { useFavorites } from '../../context/FavoritesContext';
import { useNav, useRefocus } from '../../navigation/NavContext';
import { tw } from '../../theme';
import { toPropertyView } from '../../utils/property';

/** B-14 Saved properties (GET /me/favorites; heart toggles DELETE /properties/:id/save). */
export function FavoritesScreen() {
  const nav = useNav();
  const fav = useFavorites();
  const list = useMemo(
    () => fav.items.filter(p => fav.ids.has(p._id)).map(toPropertyView),
    [fav.items, fav.ids],
  );
  useRefocus(() => {
    fav.reload();
  });

  return (
    <Screen
      padBottom
      topBar={{ title: 'Favorites', sub: `${list.length} saved`, back: true }}
      refreshing={fav.loading && list.length > 0}
      onRefresh={fav.reload}
      overlay={<BottomNav active="buy" />}
    >
      <View style={styles.body}>
        {fav.loading && list.length === 0 ? (
          <View style={styles.list}>
            {[1, 2, 3].map(i => (
              <SkeletonCard key={i} />
            ))}
          </View>
        ) : fav.error && list.length === 0 ? (
          <ErrorState message={fav.error} onRetry={fav.reload} />
        ) : list.length === 0 ? (
          <View style={styles.empty}>
            <StatusHero icon="heart" tone="empty" />
            <T style={styles.emptyTitle}>No favorites yet</T>
            <T style={styles.emptyBody}>
              Tap ♡ on any listing to save it here.
            </T>
            <Btn style={styles.mt4} onPress={() => nav.go('buyTypes')}>
              Browse properties
            </Btn>
          </View>
        ) : (
          <View style={styles.list}>
            {list.map(p => (
              <PropertyCard
                key={p.id}
                p={p}
                variant="compact"
                onPress={() =>
                  nav.go('propertyDetail', { id: p.id, property: p })
                }
              />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: tw('px-4'),
  list: { gap: 12 },
  empty: tw('items-center py-16'),
  emptyTitle: tw('text-[15px] font-semibold text-center'),
  emptyBody: tw('text-[12px] text-ink-500 mt-1 text-center'),
  mt4: tw('mt-4 self-center'),
});
