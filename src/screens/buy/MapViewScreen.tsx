import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from '../../components/Icon';
import { MapCanvas, projectPins } from '../../components/MapCanvas';
import { PropertyCard } from '../../components/PropertyCard';
import { Press } from '../../components/Press';
import { Screen } from '../../components/Screen';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { T } from '../../components/T';
import type { PropertyView } from '../../interfaces/PropertyView';
import { useResource } from '../../lib/useResource';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { listProperties } from '../../services/property.service';
import { palette, tw } from '../../theme';
import { toPropertyQuery } from '../../utils/filters';
import { formatINR } from '../../utils/format';
import { toPropertyView } from '../../utils/property';

const ZOOMS = [1, 1.5, 2.25, 3.4];

/** B-17 Map view of the current results (GET /properties; pins from each listing's coordinates). */
export function MapViewScreen({ params }: ScreenProps<'mapView'>) {
  const nav = useNav();
  const focus = params?.property;
  const filters =
    params?.filters ?? (focus ? { city: focus.city || undefined } : {});
  const key = JSON.stringify(filters);
  const res = useResource(
    signal =>
      listProperties(toPropertyQuery(filters, 1, 50), signal).then(r => {
        const list = r.data.map(toPropertyView);
        return focus && !list.some(p => p.id === focus.id)
          ? [focus, ...list]
          : list;
      }),
    [key, focus?.id],
  );
  const pins = useMemo(
    () =>
      projectPins<PropertyView>(res.data ?? [], p => ({
        lat: p.latitude,
        lng: p.longitude,
      })),
    [res.data],
  );
  const [active, setActive] = useState<string | null>(focus?.id ?? null);
  const [zoom, setZoom] = useState(0);
  const [center, setCenter] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (!pins.length) return;
    if (!active || !pins.some(p => p.item.id === active))
      setActive(pins[0].item.id);
  }, [pins, active]);

  const activePin = pins.find(p => p.item.id === active);
  const ap = activePin?.item;
  const scale = ZOOMS[zoom];
  const place = (x: number, y: number) => ({
    left: `${50 + (x - center.x) * scale}%` as const,
    top: `${50 + (y - center.y) * scale}%` as const,
  });
  const locate = () =>
    activePin && setCenter({ x: activePin.x, y: activePin.y });

  return (
    <Screen
      scroll={false}
      contentStyle={styles.fill}
      topBar={{
        title: 'Map view',
        back: true,
        right: (
          <Press
            onPress={() => nav.back()}
            style={styles.listBtn}
            accessibilityLabel="List view"
          >
            <Icon name="list" size={16} />
          </Press>
        ),
      }}
    >
      <View style={styles.fill}>
        <MapCanvas style={styles.map}>
          {res.loading ? (
            <LoadingState style={styles.fill} />
          ) : res.error ? (
            <View style={styles.state}>
              <ErrorState compact message={res.error} onRetry={res.reload} />
            </View>
          ) : pins.length === 0 ? (
            <View style={styles.state}>
              <EmptyState
                icon="map-pin-off"
                title="No locations to show"
                body="These listings don't have map coordinates yet."
              />
            </View>
          ) : (
            pins.map(pin => {
              const on = pin.item.id === active;
              return (
                <View
                  key={pin.item.id}
                  style={[
                    styles.pinWrap,
                    place(pin.x, pin.y),
                    on && styles.pinTop,
                  ]}
                >
                  <Press
                    onPress={() => setActive(pin.item.id)}
                    style={[styles.pin, on ? styles.pinOn : styles.pinOff]}
                    accessibilityLabel={pin.item.title}
                  >
                    <Icon
                      name="map-pin"
                      size={11}
                      color={on ? '#FFFFFF' : '#0F172A'}
                    />
                    <T style={[styles.pinText, on && styles.pinTextOn]}>
                      {formatINR(pin.item.price).replace('₹ ', '')}
                    </T>
                  </Press>
                </View>
              );
            })
          )}
          <View style={styles.controls}>
            <Press
              onPress={() => setZoom(z => Math.min(ZOOMS.length - 1, z + 1))}
              style={styles.ctrl}
              accessibilityLabel="Zoom in"
            >
              <Icon name="plus" size={14} />
            </Press>
            <Press
              onPress={() => {
                setZoom(z => Math.max(0, z - 1));
                if (zoom <= 1) setCenter({ x: 50, y: 50 });
              }}
              style={styles.ctrl}
              accessibilityLabel="Zoom out"
            >
              <Icon name="minus" size={14} />
            </Press>
            <Press
              onPress={locate}
              style={styles.ctrl}
              accessibilityLabel="Center on selected property"
            >
              <Icon name="locate-fixed" size={14} color="#1A6FFF" />
            </Press>
          </View>
        </MapCanvas>
        {ap ? (
          <View style={styles.cardBar}>
            <PropertyCard
              p={ap}
              variant="compact"
              onPress={() =>
                nav.go('propertyDetail', { id: ap.id, property: ap })
              }
            />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  listBtn: tw('w-9 h-9 rounded-full bg-ink-100 items-center justify-center'),
  map: { flex: 1, minHeight: 340 },
  state: tw('flex-1 items-center justify-center px-6'),
  pinWrap: {
    position: 'absolute',
    transform: [{ translateX: '-50%' }, { translateY: '-100%' }],
  },
  pinTop: { zIndex: 2 },
  pin: {
    ...tw('px-2.5 py-1 rounded-full flex items-center gap-1'),
    boxShadow: '0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -2px rgba(0,0,0,.1)',
  },
  pinOn: tw('bg-brand-600'),
  pinOff: tw('bg-white'),
  pinText: tw('text-[11px] font-bold text-ink-900'),
  pinTextOn: { color: '#FFFFFF' },
  controls: { position: 'absolute', right: 12, bottom: 12, gap: 6 },
  ctrl: {
    ...tw('w-9 h-9 rounded-card bg-white items-center justify-center'),
    boxShadow: '0 1px 3px rgba(0,0,0,.1), 0 1px 2px -1px rgba(0,0,0,.1)',
  },
  cardBar: {
    ...tw('p-3 bg-white border-t border-ink-200'),
    borderTopColor: palette.ink[200],
  },
});
