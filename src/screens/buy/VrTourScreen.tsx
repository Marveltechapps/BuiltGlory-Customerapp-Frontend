import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Badge } from '../../components/Form';
import { Icon } from '../../components/Icon';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { Press } from '../../components/Press';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { useToast } from '../../context/ToastContext';
import type { ScreenProps } from '../../navigation/types';
import { tw } from '../../theme';
import { openUrl } from '../../utils/links';

/** B-07 360° virtual tour: views are the listing photos; "Play tour" opens the listing's 3D tour link. */
export function VrTourScreen({ params }: ScreenProps<'vrTour'>) {
  const toast = useToast();
  const p = params.property;
  const views = p.images.length ? p.images : [null];
  const [room, setRoom] = useState(0);
  const [playing, setPlaying] = useState(false);
  const play = async () => {
    if (!p.tour3dUrl) {
      toast.show("A 3D tour isn't available for this property yet.", 'warn');
      return;
    }
    setPlaying(true);
    const ok = await openUrl(p.tour3dUrl);
    if (!ok) toast.show('Could not open the virtual tour.', 'error');
    setPlaying(false);
  };
  return (
    <Screen
      dark
      topBar={{
        title: '360° Virtual Tour',
        back: true,
        right: (
          <Press
            onPress={play}
            style={styles.maxBtn}
            accessibilityLabel="Open full tour"
          >
            <Icon name="maximize" size={14} color="#FFFFFF" />
          </Press>
        ),
      }}
    >
      <View style={styles.body}>
        <View style={styles.stage}>
          <PhotoPlaceholder
            tag={`vr-${p.id}-${room}`}
            src={views[room]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, styles.dim]} />
          <View style={[StyleSheet.absoluteFill, styles.center]}>
            <View style={styles.ringOuter}>
              <View style={styles.ringInner}>
                <Icon name="rotate-3d" size={24} color="#FFFFFF" />
              </View>
            </View>
          </View>
          <View style={styles.topRow}>
            <Badge color="brand">LIVE 360°</Badge>
            <T style={styles.roomName}>View {room + 1}</T>
          </View>
          <View style={styles.bottomRow}>
            <View style={styles.roundBtn}>
              <Icon name="volume-2" size={16} color="#FFFFFF" />
            </View>
            <Press onPress={play} style={styles.playBtn}>
              <Icon name={playing ? 'pause' : 'play'} size={12} />
              <T style={styles.playText}>{playing ? 'Pause' : 'Play tour'}</T>
            </Press>
            <View style={styles.roundBtn}>
              <Icon name="info" size={16} color="#FFFFFF" />
            </View>
          </View>
        </View>
        <View style={styles.rooms}>
          <T style={styles.roomsLabel}>Rooms</T>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {views.map((_, i) => (
              <Press
                key={i}
                onPress={() => setRoom(i)}
                style={[
                  styles.chip,
                  room === i ? styles.chipOn : styles.chipOff,
                ]}
              >
                <T
                  style={[
                    styles.chipText,
                    { color: room === i ? '#FFFFFF' : 'rgba(255,255,255,0.7)' },
                  ]}
                >
                  View {i + 1}
                </T>
              </Press>
            ))}
          </ScrollView>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  maxBtn: {
    ...tw('w-9 h-9 rounded-full items-center justify-center'),
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  body: tw('px-4'),
  stage: tw('relative aspect-[4/5] rounded-card overflow-hidden'),
  dim: { backgroundColor: 'rgba(0,0,0,0.25)' },
  center: tw('items-center justify-center'),
  ringOuter: {
    ...tw('w-20 h-20 rounded-full border-2 items-center justify-center'),
    borderColor: 'rgba(255,255,255,0.4)',
  },
  ringInner: {
    ...tw('w-12 h-12 rounded-full items-center justify-center'),
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  topRow: tw('absolute top-3 left-3 right-3 flex items-center justify-between'),
  roomName: tw('text-white/80 text-[11px]'),
  bottomRow: tw(
    'absolute bottom-3 left-3 right-3 flex items-center justify-between',
  ),
  roundBtn: {
    ...tw('w-10 h-10 rounded-full items-center justify-center'),
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  playBtn: tw('px-4 py-2 rounded-full bg-white flex items-center gap-1.5'),
  playText: tw('text-ink-900 text-[12px] font-semibold'),
  rooms: tw('mt-3'),
  roomsLabel: tw('text-[11px] text-white/60 uppercase tracking-wider mb-2'),
  chips: { gap: 8, paddingBottom: 4 },
  chip: tw('px-3 py-1.5 rounded-full'),
  chipOn: tw('bg-brand-600'),
  chipOff: { backgroundColor: 'rgba(255,255,255,0.1)' },
  chipText: tw('text-[12px] font-medium'),
});
