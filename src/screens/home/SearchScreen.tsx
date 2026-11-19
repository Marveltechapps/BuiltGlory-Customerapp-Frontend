import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { mapProperties } from '../../api/mappers';
import { Icon } from '../../components/icons/Icon';
import { Grid } from '../../components/layout/Grid';
import { Screen } from '../../components/layout/Screen';
import { PropertyCard } from '../../components/PropertyCard';
import { Chip } from '../../components/ui/Chip';
import { Input } from '../../components/ui/Field';
import { T } from '../../components/ui/T';
import { PROPERTY_TYPES } from '../../config/sampleData';
import { useAuth } from '../../context/AuthContext';
import type { ScreenProps } from '../../navigation/types';
import * as properties from '../../services/properties.service';
import * as search from '../../services/search.service';
import { colors } from '../../theme';
import type { Property } from '../../types/property';
import { errorMessage } from '../../utils/errorMessage';
import { cacheProperties } from '../../utils/propertyCache';

/** H-02 Search */
export function SearchScreen({ go, back }: ScreenProps) {
  const { isAuthenticated } = useAuth();
  const [q, setQ] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [recents, setRecents] = useState<string[]>([]);
  const [trending, setTrending] = useState<string[]>([]);
  const [results, setResults] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    search
      .getTrendingSearches(8, ac.signal)
      .then(terms => {
        if (!ac.signal.aborted) setTrending(terms || []);
      })
      .catch(() => {
        if (!ac.signal.aborted) setTrending([]);
      });
    return () => ac.abort();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setRecents([]);
      return;
    }
    const ac = new AbortController();
    search
      .listRecentSearches(ac.signal)
      .then(terms => {
        if (!ac.signal.aborted) setRecents(terms || []);
      })
      .catch(() => {
        if (!ac.signal.aborted) setRecents([]);
      });
    return () => ac.abort();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!submitted.trim()) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    properties
      .listProperties({ search: submitted.trim(), limit: 50, page: 1 }, ac.signal)
      .then(res => {
        if (ac.signal.aborted) return;
        const mapped = mapProperties(res.items);
        cacheProperties(mapped);
        setResults(mapped);
      })
      .catch(err => {
        if (ac.signal.aborted) return;
        setResults([]);
        setError(errorMessage(err));
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    if (isAuthenticated) {
      search.recordSearch(submitted.trim()).then(terms => setRecents(terms || [])).catch(() => {});
    }
    return () => ac.abort();
  }, [submitted, isAuthenticated]);

  const runSearch = (term: string) => {
    const t = term.trim();
    setQ(t);
    setSubmitted(t);
  };

  const clearRecents = () => {
    setRecents([]);
    if (isAuthenticated) search.clearRecentSearches().catch(() => {});
  };

  return (
    <Screen>
      <View style={styles.head}>
        <Pressable onPress={back} style={({ pressed }) => [styles.back, pressed && styles.pressedBg]} accessibilityLabel="Back">
          <Icon name="arrow-left" size={20} />
        </Pressable>
        <Input
          icon="search"
          autoFocus
          placeholder="Search city, area or property"
          value={q}
          onChangeText={setQ}
          containerStyle={styles.flex1}
          returnKeyType="search"
          onSubmitEditing={() => runSearch(q)}
        />
        {q ? (
          <Pressable onPress={() => go('filters')} style={styles.filter} accessibilityLabel="Filters">
            <Icon name="sliders-horizontal" size={16} color="#1A6FFF" />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.px4}>
        {!submitted && (
          <>
            {isAuthenticated && recents.length > 0 ? (
              <View style={styles.mb20}>
                <View style={styles.rowBetween}>
                  <T display s={13} w={600} c={colors.ink700}>Recent searches</T>
                  <Pressable onPress={clearRecents}><T s={11} c={colors.ink500}>Clear</T></Pressable>
                </View>
                <View style={styles.gap4}>
                  {recents.map((r, i) => (
                    <Pressable key={i} onPress={() => runSearch(r)} style={({ pressed }) => [styles.recent, pressed && styles.pressedSoft]}>
                      <Icon name="clock" size={14} color="#94A3B8" />
                      <T s={14} style={styles.flex1}>{r}</T>
                      <Icon name="arrow-up-left" size={14} color="#94A3B8" />
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
            <View style={styles.mb20}>
              <T display s={13} w={600} c={colors.ink700} style={styles.mb8}>Trending in Chennai</T>
              <View style={styles.wrap}>
                {(trending.length ? trending : ['Velachery', 'Adyar', 'OMR']).map(t => (
                  <Chip key={t} icon="trending-up" onPress={() => runSearch(t)}>{t}</Chip>
                ))}
              </View>
            </View>
            <View>
              <T display s={13} w={600} c={colors.ink700} style={styles.mb8}>Browse by type</T>
              <Grid cols={4} gap={8}>
                {PROPERTY_TYPES.slice(0, 8).map(t => (
                  <Pressable key={t.id} onPress={() => go('buyList', { type: t.id })} style={styles.typeCell}>
                    <Icon name={t.icon} size={20} color="#1A6FFF" />
                    <T s={10} w={500} align="center" style={styles.px1}>{t.label}</T>
                  </Pressable>
                ))}
              </Grid>
            </View>
          </>
        )}
        {submitted ? (
          <View style={styles.results}>
            <T s={11} c={colors.ink500}>{loading ? 'Searching…' : `${results.length} results for "${submitted}"`}</T>
            {loading ? (
              <View style={styles.none}><ActivityIndicator color={colors.brand600} /></View>
            ) : error ? (
              <View style={styles.none}>
                <Icon name="wifi-off" size={36} color="#CBD5E1" />
                <T s={13} c={colors.ink400} style={styles.mt8}>{error}</T>
              </View>
            ) : results.length === 0 ? (
              <View style={styles.none}>
                <Icon name="search-x" size={36} color="#CBD5E1" />
                <T s={13} c={colors.ink400} style={styles.mt8}>No results found</T>
              </View>
            ) : results.map(p => <PropertyCard key={p.id} p={p} variant="compact" onPress={() => go('propertyDetail', { p })} />)}
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  px1: { paddingHorizontal: 4 },
  px4: { paddingHorizontal: 16 },
  mb8: { marginBottom: 8 },
  mb20: { marginBottom: 20 },
  mt8: { marginTop: 8 },
  gap4: { gap: 4 },
  head: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  back: { marginLeft: -4, padding: 8, borderRadius: 9999 },
  pressedBg: { backgroundColor: colors.ink100 },
  pressedSoft: { backgroundColor: colors.ink50 },
  filter: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.brand50, alignItems: 'center', justifyContent: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  recent: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeCell: { aspectRatio: 1, borderRadius: 14, borderWidth: 1, borderColor: colors.ink200, alignItems: 'center', justifyContent: 'center', gap: 4 },
  results: { marginTop: 8, gap: 8 },
  none: { paddingVertical: 48, alignItems: 'center' },
});
