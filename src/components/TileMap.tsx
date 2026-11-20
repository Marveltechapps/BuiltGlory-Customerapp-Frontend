import React from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

const TILE = 256;

export function lonLatToWorld(latitude: number, longitude: number, zoom: number) {
  const scale = 2 ** zoom * TILE;
  const x = ((longitude + 180) / 360) * scale;
  const rad = (latitude * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * scale;
  return { x, y };
}

/** Zoom that keeps every pin inside the visible 3×3 tile mosaic. */
export function fitZoom(points: Array<{ latitude: number; longitude: number }>, preferred = 15) {
  if (points.length < 2) return preferred;
  let zoom = preferred;
  while (zoom > 11) {
    const worlds = points.map((p) => lonLatToWorld(p.latitude, p.longitude, zoom));
    const xs = worlds.map((p) => p.x);
    const ys = worlds.map((p) => p.y);
    if (Math.max(...xs) - Math.min(...xs) < TILE * 2.2 && Math.max(...ys) - Math.min(...ys) < TILE * 2.2) return zoom;
    zoom -= 1;
  }
  return zoom;
}

/**
 * OpenStreetMap tiles centered on a coordinate. Children are drawn on top, in the view's own box.
 * Pin a child at a coordinate with `pinStyle`.
 */
export function TileMap({
  latitude,
  longitude,
  zoom = 14,
  style,
  children,
}: {
  latitude?: number | null;
  longitude?: number | null;
  zoom?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const ready = typeof latitude === 'number' && typeof longitude === 'number' && Number.isFinite(latitude) && Number.isFinite(longitude);
  if (!ready) {
    return <View style={[styles.frame, styles.empty, style]}>{children}</View>;
  }
  const world = lonLatToWorld(latitude, longitude, zoom);
  const tileX = Math.floor(world.x / TILE);
  const tileY = Math.floor(world.y / TILE);
  const originX = (tileX - 1) * TILE;
  const originY = (tileY - 1) * TILE;
  const tiles = [];
  for (let row = -1; row <= 1; row += 1) {
    for (let col = -1; col <= 1; col += 1) {
      const x = tileX + col;
      const y = tileY + row;
      tiles.push({ x, y, left: (col + 1) * TILE, top: (row + 1) * TILE });
    }
  }
  return (
    <View style={[styles.frame, style]}>
      <View style={[styles.mosaic, { marginLeft: -(world.x - originX), marginTop: -(world.y - originY) }]}>
        {tiles.map((tile) => (
          <Image
            key={`${zoom}-${tile.x}-${tile.y}`}
            source={{ uri: `https://tile.openstreetmap.org/${zoom}/${tile.x}/${tile.y}.png`, headers: { 'User-Agent': 'Builtglory/1.0' } }}
            style={{ position: 'absolute', left: tile.left, top: tile.top, width: TILE, height: TILE }}
          />
        ))}
      </View>
      {children}
    </View>
  );
}

/** Place a pin on a TileMap so it sits on `latitude, longitude` while the map is centered on `center`. */
export function pinStyle(center: { latitude: number; longitude: number }, latitude: number, longitude: number, zoom: number) {
  const from = lonLatToWorld(center.latitude, center.longitude, zoom);
  const to = lonLatToWorld(latitude, longitude, zoom);
  return {
    position: 'absolute' as const,
    left: '50%' as const,
    top: '50%' as const,
    marginLeft: to.x - from.x,
    marginTop: to.y - from.y,
  };
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', position: 'relative', backgroundColor: '#e8eef4' },
  empty: { backgroundColor: '#dbe7f3' },
  mosaic: { position: 'absolute', left: '50%', top: '50%', width: TILE * 3, height: TILE * 3 },
});
