import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { meshes } from '../theme';

/**
 * Stylised map surface from the reference (`.bg-map` + its 38px white grid). Pins are positioned
 * by the caller in percentages of this box.
 */
export function MapCanvas({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.map, style]}>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.grid]}
      />
      {children}
    </View>
  );
}

/** Project coordinates into 10–90% of the canvas so every pin stays visible. */
export function projectPins<T>(
  items: T[],
  coords: (item: T) => { lat: number | null; lng: number | null },
) {
  const pts = items
    .map(i => ({ item: i, ...coords(i) }))
    .filter(p => p.lat !== null && p.lng !== null) as Array<{
    item: T;
    lat: number;
    lng: number;
  }>;
  if (!pts.length) return [];
  const lats = pts.map(p => p.lat);
  const lngs = pts.map(p => p.lng);
  const [minLat, maxLat, minLng, maxLng] = [
    Math.min(...lats),
    Math.max(...lats),
    Math.min(...lngs),
    Math.max(...lngs),
  ];
  const spanLat = maxLat - minLat || 1;
  const spanLng = maxLng - minLng || 1;
  return pts.map(p => ({
    item: p.item,
    x: pts.length === 1 ? 50 : 10 + ((p.lng - minLng) / spanLng) * 80,
    y: pts.length === 1 ? 50 : 15 + ((maxLat - p.lat) / spanLat) * 70,
  }));
}

/** Esri World Imagery tiles (the provider the reference aerial view uses) around a coordinate. */
export function satelliteTiles(lat: number, lng: number, zoom = 16): string[] {
  const n = 2 ** zoom;
  const x = Math.floor(((lng + 180) / 360) * n);
  const rad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n,
  );
  const url = (ty: number, tx: number) =>
    `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${ty}/${tx}`;
  return [url(y, x), url(y, x + 1), url(y + 1, x), url(y + 1, x + 1)];
}

const styles = StyleSheet.create({
  map: {
    position: 'relative',
    overflow: 'hidden',
    experimental_backgroundImage: meshes.map,
  },
  grid: {
    experimental_backgroundImage:
      'linear-gradient(90deg, rgba(255,255,255,.55) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,.55) 1px, transparent 1px)',
    experimental_backgroundSize: '38px 38px',
  },
});
