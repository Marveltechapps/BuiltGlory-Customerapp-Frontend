import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { mapProperties } from '../../api/mappers';
import { EmptyGlyph } from '../../components/hero/StatusHero';
import { Icon } from '../../components/icons/Icon';
import { Screen, TopBar } from '../../components/layout/Screen';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { Badge } from '../../components/ui/Badge';
import { Heart } from '../../components/ui/Heart';
import { T } from '../../components/ui/T';
import { Toast } from '../../components/ui/Toast';
import { Toggle } from '../../components/ui/Toggle';
import type { ScreenProps } from '../../navigation/types';
import * as properties from '../../services/properties.service';
import { colors } from '../../theme';
import type { Property } from '../../types/property';
import { errorMessage } from '../../utils/errorMessage';
import { formatINR, pad2 } from '../../utils/format';
import { cacheProperties } from '../../utils/propertyCache';
import { useToast } from '../../utils/useToast';

function Countdown({ date }: { date?: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const diff = Math.max(0, new Date(date ?? 0).getTime() - now);
  const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000),
    m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
  return (
    <View style={styles.count}>
      {([[d, 'days'], [h, 'hrs'], [m, 'min'], [s, 'sec']] as [number, string][]).map(([v, l]) => (
        <View key={l} style={styles.countBox}>
          <T s={15} w={700} c="#FFFFFF" lh={1} align="center">{pad2(v)}</T>
          <T s={9} c="rgba(255,255,255,0.7)" align="center" style={styles.mt2}>{l}</T>
        </View>
      ))}
    </View>
  );
}

/** H-04 Upcoming launches */
export function UpcomingListScreen({ go, back, fav, toggleFav }: ScreenProps) {
  const [list, setList] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notify, setNotify] = useState<Record<string, boolean>>({});
  const [toast, showToast] = useToast(3000);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    properties
      .listProperties({ upcoming: true, limit: 50, page: 1 }, ac.signal)
      .then(res => {
        if (ac.signal.aborted) return;
        const mapped = mapProperties(res.items);
        cacheProperties(mapped);
        setList(mapped);
      })
      .catch(err => {
        if (ac.signal.aborted) return;
        setList([]);
        setError(errorMessage(err));
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, []);

  return (
    <Screen footer={<Toast message={toast} />}>
      <TopBar onBack={back} title="Upcoming launches" sub="Be first to book" />
      {loading ? (
        <View style={styles.empty}><ActivityIndicator color={colors.brand600} /></View>
      ) : error ? (
        <View style={styles.empty}>
          <EmptyGlyph name="wifi-off" />
          <T s={15} w={600} c={colors.ink700} align="center" style={styles.mt12}>{error}</T>
        </View>
      ) : list.length === 0 ? (
        <View style={styles.empty}>
          <EmptyGlyph name="clock" />
          <T s={15} w={600} c={colors.ink700} align="center" style={styles.mt12}>No upcoming properties right now</T>
          <T s={12} c={colors.ink500} align="center" style={styles.mt4}>Check back soon for new launches</T>
        </View>
      ) : (
        <View style={styles.list}>
          {list.map(p => (
            <View key={p.id} style={styles.card}>
              <Pressable onPress={() => go('propertyDetail', { p })}>
                <PhotoPlaceholder tag={p.id} height={150}>
                  <View style={styles.tl12}><Badge color="amber">Coming soon</Badge></View>
                  <View style={styles.tr12}><Heart active={fav.has(p.id)} onPress={() => toggleFav(p.id)} /></View>
                </PhotoPlaceholder>
              </Pressable>
              <View style={styles.p12}>
                <View style={styles.titleRow}>
                  <T display s={15} w={600} style={styles.flex1}>{p.title}</T>
                  <T s={14} w={700} c={colors.brand600}>{formatINR(p.price)}</T>
                </View>
                <View style={styles.loc}>
                  <Icon name="map-pin" size={12} color={colors.ink500} />
                  <T s={12} c={colors.ink500}>{p.location}, {p.city}</T>
                </View>
                <Countdown date={p.launchDate} />
                <View style={styles.notify}>
                  <View style={styles.bell}><Icon name="bell" size={14} color="#1A6FFF" /></View>
                  <View style={styles.flex1}>
                    <T s={12} w={700}>Notify me when this launches</T>
                    <T s={10.5} c={colors.ink500}>SMS + push alerts</T>
                  </View>
                  <Toggle on={!!notify[p.id]} onChange={v => {
                    setNotify({ ...notify, [p.id]: v });
                    if (v) showToast("You'll be notified when this property launches");
                  }} accessibilityLabel="Notify me" />
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  mt2: { marginTop: 2 },
  mt4: { marginTop: 4 },
  mt12: { marginTop: 12 },
  p12: { padding: 12 },
  empty: { paddingVertical: 64, paddingHorizontal: 16, alignItems: 'center' },
  list: { paddingHorizontal: 16, gap: 16 },
  card: { borderRadius: 14, borderWidth: 1, borderColor: colors.ink200, overflow: 'hidden', backgroundColor: colors.white },
  tl12: { position: 'absolute', top: 12, left: 12 },
  tr12: { position: 'absolute', top: 12, right: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  loc: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  count: { flexDirection: 'row', gap: 8, marginTop: 8 },
  countBox: { backgroundColor: colors.ink900, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6, minWidth: 44 },
  notify: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 6, backgroundColor: colors.ink50 },
  bell: { width: 36, height: 36, borderRadius: 9999, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
});
