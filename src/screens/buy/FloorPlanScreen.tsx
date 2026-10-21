import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, ScrollView, StyleSheet, View } from 'react-native';
import { Icon } from '../../components/Icon';
import { Press } from '../../components/Press';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { useToast } from '../../context/ToastContext';
import type { ScreenProps } from '../../navigation/types';
import { tw } from '../../theme';
import { openUrl } from '../../utils/links';

/** B-04a Floor plan viewer for `media.floorPlanUrl`. */
export function FloorPlanScreen({ params }: ScreenProps<'floorPlan'>) {
  const p = params.property;
  const toast = useToast();
  const url = p.floorPlanUrl;
  const label = [
    p.bhkLabel ? `${p.bhkLabel} BHK`.replace(/BHK BHK$/i, 'BHK') : p.typeLabel,
    p.area ? `${p.area} sqft` : null,
  ]
    .filter(Boolean)
    .join(' — ');
  const [zoom, setZoom] = useState(1);
  const [failed, setFailed] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.timing(scale, {
      toValue: zoom,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [scale, zoom]);

  const download = async () => {
    if (!url) return;
    const ok = await openUrl(url);
    toast.show(
      ok
        ? 'Floor plan opened — save it from your browser'
        : 'Could not open the floor plan',
      ok ? 'success' : 'error',
    );
  };

  return (
    <Screen
      dark
      scroll={false}
      contentStyle={styles.fill}
      topBar={{
        title: 'Floor Plans',
        back: true,
        right: url ? (
          <Press
            onPress={download}
            style={styles.dl}
            accessibilityLabel="Download floor plan"
          >
            <Icon name="download" size={16} color="#FFFFFF" />
          </Press>
        ) : undefined,
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        <View style={[styles.tab, styles.tabOn]}>
          <T style={styles.tabText}>{label}</T>
        </View>
      </ScrollView>
      <View style={styles.stage}>
        <Animated.View style={[styles.full, { transform: [{ scale }] }]}>
          <View style={styles.plan}>
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, styles.grid]}
            />
            {url && !failed ? (
              <Image
                source={{ uri: url }}
                resizeMode="contain"
                style={StyleSheet.absoluteFill}
                onError={() => setFailed(true)}
                accessibilityLabel={`Floor plan of ${p.title}`}
              />
            ) : (
              <View style={styles.empty}>
                <Icon name="layout-grid" size={28} color="#24466F" />
                <T style={styles.emptyTitle}>
                  {failed
                    ? 'Floor plan could not be loaded'
                    : 'Floor plan not available'}
                </T>
                <T style={styles.emptyBody}>
                  {failed
                    ? 'Check your connection and try again.'
                    : 'Ask our advisor for the layout of this property.'}
                </T>
              </View>
            )}
            <View style={styles.legend}>
              <T style={styles.legendText}>{label}</T>
              <View style={styles.compass}>
                <Icon name="compass" size={13} color="#24466F" />
                <T style={styles.compassText}>N</T>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
      <View style={styles.zoomRow}>
        <Press
          onPress={() => setZoom(z => Math.max(0.7, +(z - 0.2).toFixed(1)))}
          style={styles.zoomBtn}
          accessibilityLabel="Zoom out"
        >
          <Icon name="zoom-out" size={18} color="#FFFFFF" />
        </Press>
        <T style={styles.zoomText}>{Math.round(zoom * 100)}%</T>
        <Press
          onPress={() => setZoom(z => Math.min(2.5, +(z + 0.2).toFixed(1)))}
          style={styles.zoomBtn}
          accessibilityLabel="Zoom in"
        >
          <Icon name="zoom-in" size={18} color="#FFFFFF" />
        </Press>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  full: { width: '100%' },
  dl: {
    ...tw('w-9 h-9 rounded-full items-center justify-center'),
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabs: tw('flex gap-2 px-4 mb-3'),
  tab: tw('px-3 py-1.5 rounded-full'),
  tabOn: tw('bg-brand-600'),
  tabText: tw('text-[12px] font-semibold text-white'),
  stage: tw('flex-1 flex items-center px-4'),
  plan: {
    ...tw('w-full rounded-card overflow-hidden'),
    height: 320,
    backgroundColor: '#EEF3FA',
    boxShadow: '0 0 0 1px #C3D2E4',
  },
  grid: {
    opacity: 0.7,
    experimental_backgroundImage:
      'linear-gradient(to right, rgba(26,111,255,.09) 1px, transparent 1px), linear-gradient(to bottom, rgba(26,111,255,.09) 1px, transparent 1px)',
    experimental_backgroundSize: '16px 16px',
  },
  empty: tw('flex-1 items-center justify-center px-8 gap-2'),
  emptyTitle: { ...tw('text-[13px] font-bold text-center'), color: '#1B3A5C' },
  emptyBody: { ...tw('text-[11px] text-center'), color: '#5B7B9E' },
  legend: tw(
    'absolute bottom-1.5 left-3 right-3 flex items-center justify-between',
  ),
  legendText: { ...tw('num text-[10px] font-bold'), color: '#5B7B9E' },
  compass: tw('flex items-center gap-1'),
  compassText: { ...tw('text-[9px] font-bold'), color: '#24466F' },
  zoomRow: tw('flex items-center justify-center gap-4 py-4'),
  zoomBtn: {
    ...tw('w-10 h-10 rounded-full items-center justify-center'),
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  zoomText: {
    ...tw('text-[12px] w-12 text-center'),
    color: 'rgba(255,255,255,0.7)',
  },
});
