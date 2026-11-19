import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Icon } from '../../components/icons/Icon';
import { Grid } from '../../components/layout/Grid';
import { Screen, TopBar } from '../../components/layout/Screen';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { Badge } from '../../components/ui/Badge';
import { T } from '../../components/ui/T';
import type { ScreenProps } from '../../navigation/types';
import { colors, ring } from '../../theme';
import { pad2 } from '../../utils/format';

const ROOMS = ['Living', 'Kitchen', 'Master Bed', 'Bed 2', 'Bathroom', 'Balcony'];

/** B-07 360° virtual tour */
export function VRTourScreen({ back, ctx }: ScreenProps) {
  const [room, setRoom] = useState(0);
  const [playing, setPlaying] = useState(false);
  return (
    <Screen dark>
      <TopBar onBack={back} title="360° Virtual Tour" dark right={
        <Pressable style={styles.glassBtn} accessibilityLabel="Full screen"><Icon name="maximize" size={14} color="white" /></Pressable>
      } />
      <View style={styles.px4}>
        <View style={styles.vr}>
          <PhotoPlaceholder tag={'vr-' + (ctx?.p?.id || 'p1') + '-' + ROOMS[room]} style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, styles.dim]} />
          <View style={[StyleSheet.absoluteFill, styles.center]}>
            <View style={styles.ring80}><View style={styles.ring48}><Icon name="rotate-3d" size={24} color="white" /></View></View>
          </View>
          <View style={styles.vrTop}>
            <Badge color="brand">LIVE 360°</Badge>
            <T s={11} c="rgba(255,255,255,0.8)">{ROOMS[room]}</T>
          </View>
          <View style={styles.vrBottom}>
            <Pressable style={styles.round40} accessibilityLabel="Sound"><Icon name="volume-2" size={16} color="white" /></Pressable>
            <Pressable onPress={() => setPlaying(v => !v)} style={styles.play}>
              <Icon name={playing ? 'pause' : 'play'} size={12} />
              <T s={12} w={600}>{playing ? 'Pause' : 'Play tour'}</T>
            </Pressable>
            <Pressable style={styles.round40} accessibilityLabel="Info"><Icon name="info" size={16} color="white" /></Pressable>
          </View>
        </View>
        <View style={styles.mt12}>
          <T s={11} c="rgba(255,255,255,0.6)" upper ls={0.05} style={styles.mb8}>Rooms</T>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rooms}>
            {ROOMS.map((r, i) => (
              <Pressable key={r} onPress={() => setRoom(i)} style={[styles.roomChip, { backgroundColor: room === i ? colors.brand600 : 'rgba(255,255,255,0.1)' }]}>
                <T s={12} w={500} c={room === i ? colors.white : 'rgba(255,255,255,0.7)'}>{r}</T>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Screen>
  );
}

// 2×2 Esri World Imagery tiles over Adyar, Chennai (same tiles as the design).
const TILES: [number, number][] = [[30379, 47379], [30379, 47380], [30380, 47379], [30380, 47380]];

/** B-08 Aerial drone view */
export function AerialScreen({ back }: ScreenProps) {
  const [playing, setPlaying] = useState(true);
  const [time, setTime] = useState(28);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setTime(s => (s + 1) % 90), 100);
    return () => clearInterval(t);
  }, [playing]);
  return (
    <Screen dark>
      <TopBar onBack={back} title="Aerial Drone View" dark />
      <View style={styles.px4}>
        <View style={styles.aerial}>
          <View style={[StyleSheet.absoluteFill, styles.tiles, { transform: [{ scale: 1 + (time % 90) / 900 }] }]}>
            {[0, 1].map(r => (
              <View key={r} style={styles.tileRow}>
                {TILES.slice(r * 2, r * 2 + 2).map(([ty, tx]) => (
                  <Image key={ty + '-' + tx} source={{ uri: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/16/${ty}/${tx}` }} style={styles.tile} resizeMode="cover" />
                ))}
              </View>
            ))}
          </View>
          <View style={styles.target} pointerEvents="none">
            <View style={styles.targetLabel}><T s={9} w={700} c={colors.amber300}>PROPERTY</T></View>
          </View>
          <View style={styles.aerialBadges}><Badge color="rose">● REC</Badge><Badge color="brand">4K · 60fps</Badge></View>
          <View style={styles.alt}><T s={11} c="#FFFFFF">ALT 120m</T></View>
          <Pressable onPress={() => setPlaying(!playing)} style={[StyleSheet.absoluteFill, styles.center]} accessibilityLabel={playing ? 'Pause' : 'Play'}>
            <View style={styles.playCircle}><Icon name={playing ? 'pause' : 'play'} size={22} color="white" /></View>
          </Pressable>
        </View>
        <View style={styles.progress}>
          <T s={11} c="rgba(255,255,255,0.7)">0:{pad2(time)}</T>
          <View style={styles.track}><View style={[styles.fill, { width: `${time / 0.9}%` }]} /></View>
          <T s={11} c="rgba(255,255,255,0.7)">1:30</T>
        </View>
        <Grid cols={4} gap={8} style={styles.mt16}>
          {([['compass', 'N orient'], ['zoom-in', 'Zoom'], ['layers', 'Layers'], ['download', 'Save']] as [string, string][]).map(([i, l]) => (
            <Pressable key={l} style={styles.tool} accessibilityRole="button">
              <Icon name={i} size={18} color="white" style={styles.mb4} />
              <T s={10.5} c="#FFFFFF" align="center">{l}</T>
            </Pressable>
          ))}
        </Grid>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  px4: { paddingHorizontal: 16 },
  mb4: { marginBottom: 4 },
  mb8: { marginBottom: 8 },
  mt12: { marginTop: 12 },
  mt16: { marginTop: 16 },
  center: { alignItems: 'center', justifyContent: 'center' },
  glassBtn: { width: 36, height: 36, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  vr: { aspectRatio: 4 / 5, borderRadius: 14, overflow: 'hidden' },
  dim: { backgroundColor: 'rgba(0,0,0,0.25)' },
  ring80: { width: 80, height: 80, borderRadius: 9999, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center' },
  ring48: { width: 48, height: 48, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  vrTop: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  vrBottom: { position: 'absolute', bottom: 12, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  round40: { width: 40, height: 40, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  play: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', gap: 6 },
  rooms: { gap: 8, paddingBottom: 4 },
  roomChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 },
  aerial: { aspectRatio: 16 / 9, borderRadius: 14, overflow: 'hidden' },
  tiles: { backgroundColor: '#12212b' },
  tileRow: { flex: 1, flexDirection: 'row' },
  tile: { flex: 1, height: '100%' },
  target: { position: 'absolute', left: '50%', top: '50%', width: 56, height: 56, marginLeft: -28, marginTop: -28, borderRadius: 8, boxShadow: `${ring(colors.amber300, 2)}, 0 0 0 9999px rgba(0,0,0,0.3)` },
  targetLabel: { position: 'absolute', top: -24, left: -40, right: -40, alignItems: 'center' },
  aerialBadges: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', gap: 8 },
  alt: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  playCircle: { width: 56, height: 56, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  progress: { marginTop: 12, marginBottom: 4, flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 9999 },
  fill: { height: '100%', backgroundColor: colors.brand600, borderRadius: 9999 },
  tool: { padding: 12, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
});
