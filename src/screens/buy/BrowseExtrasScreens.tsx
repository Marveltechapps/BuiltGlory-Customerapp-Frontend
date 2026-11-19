import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { mapProperties } from '../../api/mappers';
import { StatusHero } from '../../components/hero/StatusHero';
import { Icon } from '../../components/icons/Icon';
import { MapGrid } from '../../components/journey/BuyParts';
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
import { colors, elev, gradients } from '../../theme';
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
  const [pins, setPins] = useState<Array<{ id: string; x: number; y: number; p: Property }>>([]);
  const [active, setActive] = useState<string | null>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    properties
      .listProperties({ limit: 20, page: 1 }, ac.signal)
      .then(res => {
        if (ac.signal.aborted) return;
        const mapped = mapProperties(res.items);
        cacheProperties(mapped);
        const next = mapped.map((p, i) => ({
          id: p.id,
          x: 25 + ((i * 17) % 55),
          y: 30 + ((i * 23) % 45),
          p,
        }));
        setPins(next);
        setActive(next[0]?.id || null);
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

  const ap = pins.find(p => p.id === active)?.p || pins[0]?.p;
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
          <View style={styles.map} onLayout={e => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
            <View style={[StyleSheet.absoluteFill, styles.mapBg]} />
            <MapGrid />
            {box.w > 0 && pins.map(pin => {
              const on = active === pin.id;
              return (
                <View key={pin.id} style={[styles.pinAnchor, { left: (pin.x / 100) * box.w, top: (pin.y / 100) * box.h }]}>
                  <View style={styles.pinBox}>
                    <Pressable onPress={() => setActive(pin.id)} style={[styles.pin, { backgroundColor: on ? colors.brand600 : colors.white }]}>
                      <Icon name="map-pin" size={11} color={on ? 'white' : '#0F172A'} />
                      <T s={11} w={700} c={on ? colors.white : colors.ink900}>{formatINR(pin.p.price).replace('₹ ', '')}</T>
                    </Pressable>
                  </View>
                </View>
              );
            })}
            <View style={styles.zoom}>
              {(['plus', 'minus'] as const).map(i => <Pressable key={i} style={styles.zoomBtn} accessibilityLabel={i === 'plus' ? 'Zoom in' : 'Zoom out'}><Icon name={i} size={14} /></Pressable>)}
              <Pressable style={styles.zoomBtn} accessibilityLabel="My location"><Icon name="locate-fixed" size={14} color="#1A6FFF" /></Pressable>
            </View>
          </View>
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
  map: { minHeight: 340 },
  mapBg: { experimental_backgroundImage: gradients.map },
  pinAnchor: { position: 'absolute', width: 0, height: 0 },
  pinBox: { position: 'absolute', bottom: 0, left: -100, width: 200, alignItems: 'center' },
  pin: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999, flexDirection: 'row', alignItems: 'center', gap: 4, boxShadow: elev.md },
  zoom: { position: 'absolute', bottom: 12, right: 12, gap: 6 },
  zoomBtn: { width: 36, height: 36, borderRadius: 14, backgroundColor: colors.white, boxShadow: elev.sm, alignItems: 'center', justifyContent: 'center' },
  cardBar: { padding: 12, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.ink200 },
});
