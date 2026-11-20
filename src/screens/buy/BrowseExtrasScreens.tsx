import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { mapProperties } from '../../api/mappers';
import { StatusHero } from '../../components/hero/StatusHero';
import { Icon } from '../../components/icons/Icon';
import { TileMap, fitZoom, pinStyle } from '../../components/TileMap';
import { BottomNav } from '../../components/layout/BottomNav';
import { BottomBar, Screen, TopBar } from '../../components/layout/Screen';
import { PropertyCard } from '../../components/PropertyCard';
import { Btn } from '../../components/ui/Btn';
import { Chip } from '../../components/ui/Chip';
import { buzz, Press } from '../../components/ui/Press';
import { T } from '../../components/ui/T';
import { Toast } from '../../components/ui/Toast';
import { SPECS } from '../../config/sampleData';
import { useAuth } from '../../context/AuthContext';
import type { ScreenProps } from '../../navigation/types';
import * as properties from '../../services/properties.service';
import { colors, elev } from '../../theme';
import * as geoService from '../../services/geo.service';
import type { Property } from '../../types/property';
import { errorMessage } from '../../utils/errorMessage';
import { formatINR } from '../../utils/format';
import { cacheProperties } from '../../utils/propertyCache';

/** Favorites (saved properties) */
export function FavoritesScreen({ go, back, fav, toggleFav, onNav }: ScreenProps) {
  const { isAuthenticated } = useAuth();
  const [list, setList] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setList([]);
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    properties
      .listFavorites({ limit: 50 }, ac.signal)
      .then(res => {
        if (ac.signal.aborted) return;
        const mapped = mapProperties(res.items);
        cacheProperties(mapped);
        setList(mapped);
      })
      .catch(err => {
        if (ac.signal.aborted) return;
        // Fall back to locally hearted ids if favorites endpoint fails and cache has them
        setError(errorMessage(err));
        setList([]);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, [isAuthenticated, fav]);

  return (
    <Screen padBottom footer={<BottomNav legacy active="buy" onNav={onNav} />}>
      <TopBar onBack={back} title="Favorites" sub={loading ? 'Loading…' : `${list.length} saved`} />
      <View style={styles.px4}>
        {loading ? (
          <View style={styles.empty}><ActivityIndicator color={colors.brand600} /></View>
        ) : error && list.length === 0 ? (
          <View style={styles.empty}>
            <StatusHero icon="wifi-off" tone="empty" />
            <T display s={15} w={600} align="center">Couldn’t load favorites</T>
            <T s={12} c={colors.ink500} align="center" style={styles.mt4}>{error}</T>
          </View>
        ) : list.length === 0 ? (
          <View style={styles.empty}>
            <StatusHero icon="heart" tone="empty" />
            <T display s={15} w={600} align="center">No favorites yet</T>
            <T s={12} c={colors.ink500} align="center" style={styles.mt4}>Tap ♡ on any listing to save it here.</T>
            <Btn style={styles.emptyBtn} onPress={() => go('buyTypes')}>Browse properties</Btn>
          </View>
        ) : (
          <View style={styles.gap12}>
            {list.map(p => <PropertyCard key={p.id} p={p} variant="compact" fav onFav={() => toggleFav(p.id)} onPress={() => go('propertyDetail', { p })} />)}
          </View>
        )}
      </View>
    </Screen>
  );
}

const SECTIONS = [
  { title: 'Property type', options: ['Apartment', 'Villa', 'Plot', 'Commercial', 'Studio'] },
  { title: 'Furnishing', options: ['Unfurnished', 'Semi-furnished', 'Fully furnished'] },
  { title: 'Facing', options: ['East', 'West', 'North', 'South', 'NE', 'NW', 'SE', 'SW'] },
  { title: 'Construction status', options: ['Ready to move', 'Under construction', 'New launch'] },
  { title: 'Age of property', options: ['< 1 yr', '1–5 yr', '5–10 yr', '10+ yr'] },
  { title: 'Posted by', options: ['Owner', 'Builder', 'Dealer'] },
];

/** Advanced filters */
export function AdvancedFiltersScreen({ back }: ScreenProps) {
  const [sel, setSel] = useState<Record<string, Set<string>>>({ Furnishing: new Set(['Semi-furnished']), Facing: new Set(['East']) });
  const [preset, setPreset] = useState('');
  useEffect(() => { if (!preset) return; const t = setTimeout(() => setPreset(''), 1600); return () => clearTimeout(t); }, [preset]);
  const toggle = (t: string, o: string) => {
    const s = new Set(sel[t] || []);
    if (s.has(o)) s.delete(o); else s.add(o);
    setSel({ ...sel, [t]: s });
    buzz();
  };
  return (
    <Screen
      footer={
        <>
          <Toast message={preset} />
          <BottomBar style={styles.row8}>
            <Btn variant="outline" flex onPress={() => setPreset('Preset saved')}>Save preset</Btn>
            <Btn flex onPress={back}>Apply (3)</Btn>
          </BottomBar>
        </>
      }>
      <TopBar onBack={back} title="Advanced filters" right={
        <Press onPress={() => { setSel({}); buzz(); setPreset('Filters cleared'); }}><T s={14} w={700} c={colors.brand600}>Reset</T></Press>
      } />
      <View style={styles.sections}>
        {SECTIONS.map(sec => (
          <View key={sec.title}>
            <T display s={13} w={600} style={styles.mb8}>{sec.title}</T>
            <View style={styles.wrap}>
              {sec.options.map(o => <Chip key={o} active={!!sel[sec.title]?.has(o)} onPress={() => toggle(sec.title, o)}>{o}</Chip>)}
            </View>
          </View>
        ))}
        <View>
          <T display s={13} w={600} style={styles.mb8}>Amenities</T>
          <View style={styles.wrap}>
            {SPECS.slice(0, 12).map(s => <Chip key={s.label} active={['Lift', 'Pool', 'Parking'].includes(s.label)} icon={s.icon}>{s.label}</Chip>)}
          </View>
        </View>
      </View>
    </Screen>
  );
}

/** Map view of listings */
export function MapViewScreen({ go, back, fav, toggleFav }: ScreenProps) {
  const [pins, setPins] = useState<Property[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [zoom, setZoom] = useState(13);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    properties
      .listProperties({ limit: 20, page: 1 }, ac.signal)
      .then(async res => {
        if (ac.signal.aborted) return;
        const mapped = mapProperties(res.items);
        cacheProperties(mapped);
        const placed: Property[] = [];
        for (const property of mapped) {
          if (ac.signal.aborted) return;
          if (typeof property.latitude === 'number' && typeof property.longitude === 'number') {
            placed.push(property);
            continue;
          }
          const query = [property.location, property.city, 'India'].filter(Boolean).join(', ');
          try {
            const geo = await geoService.forwardGeocode(query, ac.signal);
            placed.push(geo ? { ...property, latitude: geo.latitude, longitude: geo.longitude } : property);
          } catch {
            placed.push(property);
          }
        }
        if (ac.signal.aborted) return;
        const located = placed.filter(p => typeof p.latitude === 'number' && typeof p.longitude === 'number');
        setPins(placed);
        setActive(located[0]?.id || placed[0]?.id || null);
        if (located.length) setZoom(fitZoom(located.map(p => ({ latitude: p.latitude as number, longitude: p.longitude as number }))));
      })
      .catch(err => {
        if (ac.signal.aborted) return;
        setError(errorMessage(err));
        setPins([]);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, []);

  const located = pins.filter((p): p is Property & { latitude: number; longitude: number } => typeof p.latitude === 'number' && typeof p.longitude === 'number');
  const ap = pins.find(p => p.id === active) || located[0] || pins[0];
  const focus = located.find(p => p.id === active) || located[0];
  const center = focus
    ? { latitude: focus.latitude, longitude: focus.longitude }
    : located.length
      ? {
          latitude: located.reduce((sum, p) => sum + p.latitude, 0) / located.length,
          longitude: located.reduce((sum, p) => sum + p.longitude, 0) / located.length,
        }
      : { latitude: 13.0827, longitude: 80.2707 };
  return (
    <Screen>
      <TopBar onBack={back} title="Map view" right={
        <Press onPress={back} accessibilityLabel="List view" style={styles.listBtn}><Icon name="list" size={16} /></Press>
      } />
      {loading ? (
        <View style={styles.empty}><ActivityIndicator color={colors.brand600} /></View>
      ) : error || !ap ? (
        <View style={styles.empty}>
          <T s={13} c={colors.ink500} align="center">{error || 'No properties to show on the map'}</T>
        </View>
      ) : (
        <>
          <TileMap latitude={center.latitude} longitude={center.longitude} zoom={zoom} style={styles.map}>
            {located.map(pin => {
              const on = active === pin.id;
              return (
                <View key={pin.id} style={[styles.pinAnchor, pinStyle(center, pin.latitude, pin.longitude, zoom)]}>
                  <View style={styles.pinBox}>
                    <Pressable onPress={() => setActive(pin.id)} style={[styles.pin, { backgroundColor: on ? colors.brand600 : colors.white }]}>
                      <Icon name="map-pin" size={11} color={on ? 'white' : '#0F172A'} />
                      <T s={11} w={700} c={on ? colors.white : colors.ink900}>{formatINR(pin.price).replace('₹ ', '')}</T>
                    </Pressable>
                  </View>
                </View>
              );
            })}
            <View style={styles.zoom}>
              <Pressable onPress={() => setZoom(z => Math.min(18, z + 1))} style={styles.zoomBtn} accessibilityLabel="Zoom in"><Icon name="plus" size={14} /></Pressable>
              <Pressable onPress={() => setZoom(z => Math.max(11, z - 1))} style={styles.zoomBtn} accessibilityLabel="Zoom out"><Icon name="minus" size={14} /></Pressable>
              <Pressable onPress={() => focus && setActive(focus.id)} style={styles.zoomBtn} accessibilityLabel="Center on selected property"><Icon name="locate-fixed" size={14} color="#1A6FFF" /></Pressable>
            </View>
          </TileMap>
          <View style={styles.cardBar}>
            <PropertyCard p={ap} variant="compact" fav={fav.has(ap.id)} onFav={() => toggleFav(ap.id)} onPress={() => go('propertyDetail', { p: ap })} />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  px4: { paddingHorizontal: 16 },
  mt4: { marginTop: 4 },
  mb8: { marginBottom: 8 },
  gap12: { gap: 12 },
  row8: { flexDirection: 'row', gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  empty: { paddingVertical: 64, alignItems: 'center' },
  emptyBtn: { marginTop: 16, alignSelf: 'center' },
  sections: { paddingHorizontal: 16, paddingBottom: 80, gap: 20 },
  listBtn: { width: 36, height: 36, borderRadius: 9999, backgroundColor: colors.ink100, alignItems: 'center', justifyContent: 'center' },
  map: { flex: 1, minHeight: 340 },
  pinAnchor: { position: 'absolute', width: 0, height: 0 },
  pinBox: { position: 'absolute', bottom: 0, left: -100, width: 200, alignItems: 'center' },
  pin: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999, flexDirection: 'row', alignItems: 'center', gap: 4, boxShadow: elev.md },
  zoom: { position: 'absolute', bottom: 12, right: 12, gap: 6 },
  zoomBtn: { width: 36, height: 36, borderRadius: 14, backgroundColor: colors.white, boxShadow: elev.sm, alignItems: 'center', justifyContent: 'center' },
  cardBar: { padding: 12, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.ink200 },
});
