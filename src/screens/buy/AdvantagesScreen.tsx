import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Btn } from '../../components/Btn';
import { Icon, type IconName } from '../../components/Icon';
import { Grid } from '../../components/Layout';
import { MapCanvas } from '../../components/MapCanvas';
import { Press } from '../../components/Press';
import { Screen } from '../../components/Screen';
import { EmptyState } from '../../components/States';
import { T } from '../../components/T';
import { NEARBY_ICONS } from '../../config/catalog';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { tw } from '../../theme';

interface AdvRow {
  icon: IconName;
  color: string;
  title: string;
  body: string;
}

/** B-06 Advantages & location (property `advantages` and `nearbyPlaces`). */
export function AdvantagesScreen({ params }: ScreenProps<'advantages'>) {
  const nav = useNav();
  const p = params.property;
  const rows: AdvRow[] = [
    ...p.advantages.investment.map(t => ({
      icon: 'trending-up' as IconName,
      color: '#10B981',
      title: t,
      body: 'Investment potential',
    })),
    ...p.advantages.location.map(t => ({
      icon: 'map-pin' as IconName,
      color: '#1A6FFF',
      title: t,
      body: 'Location advantage',
    })),
    ...p.advantages.connectivity.map(t => ({
      icon: 'train' as IconName,
      color: '#8B5CF6',
      title: t,
      body: 'Connectivity',
    })),
    ...p.nearbyPlaces.map(n => {
      const key = Object.keys(NEARBY_ICONS).find(k =>
        (n.type ?? '').toLowerCase().includes(k),
      );
      const meta = key
        ? NEARBY_ICONS[key]
        : { icon: 'map-pin' as IconName, color: '#F59E0B' };
      return {
        icon: meta.icon,
        color: meta.color,
        title: n.name ?? 'Nearby',
        body: [n.type, n.distance].filter(Boolean).join(' · '),
      };
    }),
  ];
  return (
    <Screen topBar={{ title: 'Advantages & Location', back: true }}>
      <View style={styles.body}>
        {rows.length === 0 ? (
          <EmptyState
            icon="map-pin"
            title="No location details yet"
            body="The Builtglory team hasn't added nearby places or advantages for this listing."
          />
        ) : (
          rows.map((a, i) => (
            <View key={`${a.title}-${i}`} style={styles.card}>
              <View style={[styles.icon, { backgroundColor: `${a.color}20` }]}>
                <Icon name={a.icon} size={20} color={a.color} />
              </View>
              <View style={styles.flex}>
                <T style={styles.title}>{a.title}</T>
                {a.body ? <T style={styles.sub}>{a.body}</T> : null}
              </View>
            </View>
          ))
        )}
        <MapCanvas style={styles.map}>
          <View style={styles.pinWrap}>
            <View style={styles.pin}>
              <Icon name="map-pin" size={20} color="#FFFFFF" />
            </View>
          </View>
          <Press
            onPress={() => nav.go('mapView', { property: p })}
            style={styles.openMap}
          >
            <T style={styles.openMapText}>Open map</T>
          </Press>
        </MapCanvas>
        <Grid cols={2} gap={8}>
          <Btn
            variant="outline"
            icon="glasses"
            onPress={() => nav.go('vrTour', { property: p })}
            style={styles.stretch}
          >
            VR walk
          </Btn>
          <Btn
            variant="outline"
            icon="plane"
            onPress={() => nav.go('aerial', { property: p })}
            style={styles.stretch}
          >
            Aerial view
          </Btn>
        </Grid>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: tw('flex-1'),
  stretch: { alignSelf: 'stretch' },
  body: { ...tw('px-4'), gap: 12 },
  card: tw(
    'p-3 rounded-card border border-ink-200 flex items-center gap-3 bg-white',
  ),
  icon: tw('w-11 h-11 rounded-full items-center justify-center'),
  title: tw('text-[14px] font-semibold'),
  sub: tw('text-[11.5px] text-ink-500'),
  map: tw('h-44 rounded-card border border-ink-200'),
  pinWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  pin: {
    ...tw('w-10 h-10 rounded-full bg-brand-600 items-center justify-center'),
    boxShadow:
      '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
  },
  openMap: {
    ...tw('absolute bottom-2 right-2 bg-white px-2 py-1 rounded'),
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
  },
  openMapText: tw('text-[11px] font-semibold'),
});
