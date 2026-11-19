import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';
import { mapProperties } from '../../api/mappers';
import { Icon } from '../../components/icons/Icon';
import { MapGrid } from '../../components/journey/BuyParts';
import { Card } from '../../components/layout/Groups';
import { Grid } from '../../components/layout/Grid';
import { Screen, TopBar } from '../../components/layout/Screen';
import { Btn } from '../../components/ui/Btn';
import { EmptyState } from '../../components/ui/EmptyState';
import { PopIn, Stagger } from '../../components/ui/Motion';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { T } from '../../components/ui/T';
import { SPECS } from '../../config/sampleData';
import type { ScreenProps } from '../../navigation/types';
import * as properties from '../../services/properties.service';
import { colors, elev, gradients, ring } from '../../theme';
import type { Property } from '../../types/property';
import { advantagesFor, nearbyFor } from '../../utils/propertyInsights';
import { cacheProperties } from '../../utils/propertyCache';
import { useResolvedProperty } from '../../utils/useResolvedProperty';

const HIGHLIGHTS = ['East-facing entrance', 'Vaastu compliant', '24/7 water + power', 'Earthquake-resistant Zone-II'];

function PropertyGate({ back, ctx, children }: ScreenProps & { children: (p: Property) => React.ReactNode }) {
  const { property: p, loading, error } = useResolvedProperty(ctx);
  if (loading) {
    return (
      <Screen>
        <TopBar onBack={back} title="Property" />
        <View style={styles.load}><ActivityIndicator color={colors.brand600} /></View>
      </Screen>
    );
  }
  if (!p) {
    return (
      <Screen>
        <TopBar onBack={back} title="Property" />
        <EmptyState icon="building-2" title="Property not found" body={error || 'This listing may have been removed.'} action={<Btn onPress={back}>Go back</Btn>} />
      </Screen>
    );
  }
  return <>{children(p)}</>;
}

/** B-05 Specifications & amenities */
export function SpecsScreen(props: ScreenProps) {
  return (
    <PropertyGate {...props}>
      {p => (
        <Screen>
          <TopBar onBack={props.back} title="Specifications & Amenities" />
          <View style={styles.px4}>
            <T s={12} c={colors.ink500} style={styles.mb12}>Everything {p.title} offers across 20 categories.</T>
            <Grid cols={4} gap={8}>
              {SPECS.map(s => {
                const has = p.amenities.some(a => a.toLowerCase().includes(s.label.toLowerCase().split(' ')[0]));
                return (
                  <View key={s.label} style={[styles.spec, has ? styles.specOn : styles.specOff]}>
                    <Icon name={s.icon} size={20} color={has ? '#1A6FFF' : '#94A3B8'} />
                    <T s={9.5} w={500} lh={1.25} align="center">{s.label}</T>
                  </View>
                );
              })}
            </Grid>
            <View style={styles.highlights}>
              <T display s={14} w={600} style={styles.mb8}>Property highlights</T>
              {HIGHLIGHTS.map(h => (
                <View key={h} style={styles.hl}>
                  <Icon name="check-circle-2" size={14} color="#10B981" />
                  <T s={13} c={colors.ink700}>{h}</T>
                </View>
              ))}
            </View>
          </View>
        </Screen>
      )}
    </PropertyGate>
  );
}

/** B-06a Location & nearby */
export function LocationScreen(props: ScreenProps) {
  const { go, back } = props;
  return (
    <PropertyGate {...props}>
      {p => {
        const near = nearbyFor(p);
        return (
          <Screen>
            <TopBar onBack={back} title="Location" sub={`${p.location}, ${p.city}`} />
            <View style={styles.locBody}>
              <Pressable onPress={() => go('mapView', { p })} style={styles.bigMap} accessibilityRole="button">
                <View style={[StyleSheet.absoluteFill, styles.mapBg]} />
                <MapGrid />
                <View style={styles.pinCenter} pointerEvents="none">
                  <PopIn style={styles.pinLift}><View style={styles.pin}><Icon name="map-pin" size={20} color="white" /></View></PopIn>
                </View>
                <View style={styles.openMap}><T s={11} w={700}>Open full map</T></View>
              </Pressable>
              <Card pad={14}>
                <T s={11} w={700} upper ls={0.08} c={colors.ink400}>Address</T>
                <T s={14} w={700} style={styles.mt4}>{p.title}</T>
                <T s={12.5} c={colors.ink600}>{p.location}, {p.city}</T>
                <Pressable onPress={() => Linking.openURL('https://maps.google.com/?q=' + encodeURIComponent(p.location + ', ' + p.city))} style={styles.directions}>
                  <T s={12.5} w={700} c={colors.brand600}>Directions</T>
                  <Icon name="arrow-up-right" size={13} color="#1A6FFF" />
                </Pressable>
              </Card>
              <View>
                <SectionTitle>Nearby</SectionTitle>
                <Grid cols={2} gap={8}>
                  {near.map(n => (
                    <View key={n.label} style={styles.near}>
                      <View style={[styles.nearIcon, { backgroundColor: n.color + '18' }]}><Icon name={n.icon} size={16} color={n.color} /></View>
                      <View style={styles.flex1}>
                        <T s={12.5} w={700} truncate>{n.label}</T>
                        <T num s={11} c={colors.ink500}>{n.km} km</T>
                      </View>
                    </View>
                  ))}
                </Grid>
              </View>
              <Btn variant="outline" icon="sparkles" onPress={() => go('advantages', { p })}>See property advantages</Btn>
            </View>
          </Screen>
        );
      }}
    </PropertyGate>
  );
}

/** B-06 Advantages */
export function AdvantagesScreen(props: ScreenProps) {
  const { go, back, ctx } = props;
  const [peers, setPeers] = useState<Property[]>([]);
  const { property: resolved } = useResolvedProperty(ctx);

  useEffect(() => {
    if (!resolved?.type) return;
    const ac = new AbortController();
    properties
      .listProperties({ type: resolved.type, limit: 50 }, ac.signal)
      .then(res => {
        if (ac.signal.aborted) return;
        const mapped = mapProperties(res.items);
        cacheProperties(mapped);
        setPeers(mapped);
      })
      .catch(() => {});
    return () => ac.abort();
  }, [resolved?.type]);

  return (
    <PropertyGate {...props}>
      {p => {
        const advs = advantagesFor(p, peers);
        return (
          <Screen>
            <TopBar onBack={back} title="Advantages" sub={p.title} />
            <Stagger style={styles.advList} step={50}>
              {advs.map(a => (
                <View key={a.title} style={styles.adv}>
                  <View style={[styles.advIcon, { backgroundColor: a.color + '18' }]}><Icon name={a.icon} size={20} color={a.color} /></View>
                  <View style={styles.flex1}>
                    <T s={14} w={700}>{a.title}</T>
                    <T s={12} c={colors.ink500} lh={1.625} style={styles.mt2}>{a.body}</T>
                  </View>
                </View>
              ))}
              <Btn variant="outline" icon="map-pin" onPress={() => go('locationView', { p })}>View location & nearby</Btn>
            </Stagger>
          </Screen>
        );
      }}
    </PropertyGate>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  load: { paddingVertical: 64, alignItems: 'center' },
  px4: { paddingHorizontal: 16 },
  mb8: { marginBottom: 8 },
  mb12: { marginBottom: 12 },
  mt2: { marginTop: 2 },
  mt4: { marginTop: 4 },
  spec: { aspectRatio: 1, borderRadius: 14, borderWidth: 1, padding: 8, alignItems: 'center', justifyContent: 'center', gap: 6 },
  specOn: { borderColor: colors.brand200, backgroundColor: colors.brand50 },
  specOff: { borderColor: colors.ink200, opacity: 0.4 },
  highlights: { marginTop: 24, gap: 8 },
  hl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locBody: { paddingHorizontal: 16, paddingBottom: 32, gap: 16 },
  bigMap: { width: '100%', height: 176, borderRadius: 16, overflow: 'hidden', boxShadow: ring(colors.ink200) },
  mapBg: { experimental_backgroundImage: gradients.map },
  pinCenter: { position: 'absolute', left: 0, right: 0, top: '50%', alignItems: 'center' },
  pinLift: { marginTop: -40 },
  pin: { width: 40, height: 40, borderRadius: 9999, backgroundColor: colors.brand600, alignItems: 'center', justifyContent: 'center', boxShadow: elev.brand },
  openMap: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.72)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 },
  directions: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  near: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 16, backgroundColor: colors.white, boxShadow: ring('rgba(226,232,240,0.7)') },
  nearIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  advList: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },
  adv: { padding: 14, borderRadius: 16, backgroundColor: colors.white, boxShadow: elev.e1, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  advIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});

