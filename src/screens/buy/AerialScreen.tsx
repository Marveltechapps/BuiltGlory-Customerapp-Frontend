import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Badge } from '../../components/Form';
import { Icon, type IconName } from '../../components/Icon';
import { Grid } from '../../components/Layout';
import { satelliteTiles } from '../../components/MapCanvas';
import { Press } from '../../components/Press';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import type { ScreenProps } from '../../navigation/types';
import { tw } from '../../theme';
import { openUrl } from '../../utils/links';

/**
 * B-08 Aerial view. Shows the listing's drone image when one is published, otherwise Esri World
 * Imagery tiles around the property's coordinates (the provider the reference uses).
 */
export function AerialScreen({ params }: ScreenProps<'aerial'>) {
  const p = params.property;
  const [playing, setPlaying] = useState(true);
  const [time, setTime] = useState(28);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setTime(s => (s + 1) % 90), 100);
    return () => clearInterval(t);
  }, [playing]);
  const tiles =
    p.latitude !== null && p.longitude !== null
      ? satelliteTiles(p.latitude, p.longitude)
      : null;
  const scale = 1 + (time % 90) / 900;
  const tools: Array<[IconName, string, (() => void) | undefined]> = [
    ['compass', 'N orient', undefined],
    ['zoom-in', 'Zoom', undefined],
    ['layers', 'Layers', undefined],
    [
      'download',
      'Save',
      p.droneImageUrl ? () => openUrl(p.droneImageUrl as string) : undefined,
    ],
  ];
  return (
    <Screen dark topBar={{ title: 'Aerial Drone View', back: true }}>
      <View style={styles.body}>
        <View style={styles.frame}>
          {p.droneImageUrl ? (
            <Image
              source={{ uri: p.droneImageUrl }}
              style={[StyleSheet.absoluteFill, { transform: [{ scale }] }]}
              resizeMode="cover"
            />
          ) : tiles ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                styles.tiles,
                { transform: [{ scale }] },
              ]}
            >
              {tiles.map(u => (
                <Image
                  key={u}
                  source={{ uri: u }}
                  style={styles.tile}
                  resizeMode="cover"
                />
              ))}
            </View>
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.none]}>
              <Icon name="map-pin" size={22} color="rgba(255,255,255,0.6)" />
              <T style={styles.noneText}>
                Aerial view isn't available for this property yet.
              </T>
            </View>
          )}
          {(p.droneImageUrl || tiles) && (
            <View style={styles.targetWrap} pointerEvents="none">
              <View style={styles.target}>
                <T style={styles.targetLabel}>PROPERTY</T>
              </View>
            </View>
          )}
          <View style={styles.badges}>
            <Badge color="rose">● REC</Badge>
            <Badge color="brand">4K · 60fps</Badge>
          </View>
          <View style={styles.alt}>
            <T style={styles.altText}>ALT 120m</T>
          </View>
          <Press
            onPress={() => setPlaying(!playing)}
            pressScale={1}
            style={[StyleSheet.absoluteFill, styles.center]}
            accessibilityLabel={playing ? 'Pause' : 'Play'}
          >
            <View style={styles.play}>
              <Icon
                name={playing ? 'pause' : 'play'}
                size={22}
                color="#FFFFFF"
              />
            </View>
          </Press>
        </View>
        <View style={styles.progress}>
          <T style={styles.time}>0:{String(time).padStart(2, '0')}</T>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${time / 0.9}%` }]} />
          </View>
          <T style={styles.time}>1:30</T>
        </View>
        <Grid cols={4} gap={8} style={styles.tools}>
          {tools.map(([icon, label, onPress]) => (
            <Press
              key={label}
              onPress={onPress}
              disabled={!onPress}
              style={styles.tool}
            >
              <Icon name={icon} size={18} color="#FFFFFF" />
              <T style={styles.toolText}>{label}</T>
            </Press>
          ))}
        </Grid>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: tw('px-4'),
  frame: tw('relative aspect-video rounded-card overflow-hidden bg-[#12212b]'),
  tiles: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: { width: '50%', height: '50%' },
  none: tw('items-center justify-center gap-2 px-6'),
  noneText: tw('text-white/60 text-[12px] text-center'),
  targetWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  target: {
    ...tw('w-14 h-14 rounded-lg border-2 border-amber-300'),
    boxShadow: '0 0 0 9999px rgba(0,0,0,.3)',
  },
  targetLabel: {
    ...tw('absolute text-[9px] font-bold text-amber-300'),
    top: -22,
    left: -8,
    width: 72,
    textAlign: 'center',
  },
  badges: tw('absolute top-3 left-3 flex gap-2'),
  alt: {
    ...tw('absolute top-3 right-3 px-2 py-0.5 rounded'),
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  altText: tw('text-white text-[11px]'),
  center: tw('items-center justify-center'),
  play: {
    ...tw('w-14 h-14 rounded-full items-center justify-center'),
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progress: tw('mt-3 flex items-center gap-2 mb-1'),
  time: tw('text-white/70 text-[11px]'),
  track: {
    ...tw('flex-1 h-1 rounded-full'),
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  fill: tw('h-full bg-brand-600 rounded-full'),
  tools: tw('mt-4'),
  tool: {
    ...tw('p-3 rounded-card items-center'),
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  toolText: tw('text-white text-[10.5px] mt-1'),
});
