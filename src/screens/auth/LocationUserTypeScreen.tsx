import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ApiError } from '../../api';
import type { UserType } from '../../api/types';
import { StatusMark } from '../../components/hero/StatusMark';
import { Icon } from '../../components/icons/Icon';
import { Screen, TopBar } from '../../components/layout/Screen';
import { Input } from '../../components/ui/Field';
import { FadeIn } from '../../components/ui/Motion';
import { SolidBtn } from '../../components/ui/SolidBtn';
import { T } from '../../components/ui/T';
import { updateUser } from '../../lib/session';
import type { ScreenProps } from '../../navigation/types';
import * as geoService from '../../services/geo.service';
import { readCurrentPosition } from '../../utils/geolocation';
import * as meService from '../../services/me.service';
import { colors, elev } from '../../theme';

const CITIES = ['Ahmedabad', 'Bangalore', 'Chennai', 'Coimbatore', 'Delhi', 'Hyderabad', 'Jaipur', 'Kolkata', 'Mumbai', 'Pune', 'Surat', 'Thiruvananthapuram'];
const TYPES: { id: UserType; label: string; sub: string; icon: string }[] = [
  { id: 'resident', label: 'Resident', sub: 'Living in India', icon: 'home' },
  { id: 'nri', label: 'NRI', sub: 'Non-Resident Indian', icon: 'plane' },
  { id: 'pio', label: 'PIO', sub: 'Person of Indian Origin', icon: 'globe' },
];

function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.details?.[0]?.message || error.message || 'Could not save details.';
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Could not save details.';
}

/** S-06 Location + user type */
export function LocationUserTypeScreen({ onNext }: ScreenProps) {
  const [locState, setLocState] = useState<'idle' | 'locating' | 'granted' | 'failed'>('idle');
  const [manualCity, setManualCity] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [type, setType] = useState<UserType>('resident');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue = locState === 'granted' || (locState === 'failed' && manualCity.trim().length >= 2);

  const handleCityInput = (v: string) => {
    setManualCity(v);
    setCity(v);
    setSuggestions(v.length >= 1 ? CITIES.filter(c => c.toLowerCase().startsWith(v.toLowerCase())) : []);
  };

  const applyReverse = async (latitude: number, longitude: number) => {
    const geo = await geoService.reverseGeocode(latitude, longitude);
    setCity(geo.city || '');
    setStateName(geo.state || '');
    setCoords({ latitude: geo.latitude ?? latitude, longitude: geo.longitude ?? longitude });
    setLocState('granted');
  };

  const requestLocation = async () => {
    setError(null);
    setLocState('locating');
    try {
      const position = await readCurrentPosition();
      if (!position) {
        setLocState('failed');
        return;
      }
      await applyReverse(position.coords.latitude, position.coords.longitude);
    } catch {
      setLocState('failed');
    }
  };

  const handleContinue = async () => {
    if (!canContinue || saving) return;
    setSaving(true);
    setError(null);
    try {
      const resolvedCity = (locState === 'granted' ? city : manualCity).trim();
      const body: Record<string, unknown> = {
        city: resolvedCity,
        state: stateName || undefined,
        role: 'buyer',
        userType: type,
      };
      if (coords) {
        body.latitude = coords.latitude;
        body.longitude = coords.longitude;
      }
      const me = await meService.patchMe(body);
      await updateUser(me);
      onNext();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const granted = locState === 'granted';
  const locationLabel = granted
    ? [city, stateName].filter(Boolean).join(', ') || 'Location detected'
    : locState === 'locating'
      ? 'Detecting location…'
      : 'Use my current location';

  return (
    <Screen>
      <TopBar title="A few more details" />
      <View style={styles.body}>
        <View style={styles.z2}>
          <T display s={14} w={600} style={styles.mb8}>Your location</T>
          {locState !== 'failed' && (
            <Pressable
              onPress={() => { void requestLocation(); }}
              disabled={locState === 'locating'}
              style={[styles.locBtn, granted ? styles.locOn : styles.locIdle]}>
              <View style={[styles.locIcon, { backgroundColor: granted ? colors.brand600 : colors.ink100 }]}>
                <Icon name={granted ? 'check' : 'map-pin'} size={18} color={granted ? 'white' : '#64748B'} />
              </View>
              <View style={styles.flex1}>
                <T s={14} w={600}>{locationLabel}</T>
                <T s={12} c={colors.ink500}>{granted ? 'Detected via GPS' : 'Show nearby listings'}</T>
              </View>
            </Pressable>
          )}
          {locState === 'idle' && (
            <Pressable onPress={() => setLocState('failed')} style={styles.mt8}>
              <T s={12} w={500} c={colors.brand600}>Enter city manually instead</T>
            </Pressable>
          )}
          {locState === 'failed' && (
            <FadeIn style={styles.gap8}>
              <View style={styles.warn}>
                <StatusMark kind="warn" size={16} />
                <T s={12} c={colors.amber800} style={styles.flex1}>Couldn't detect location. Enter your city manually.</T>
              </View>
              <View style={styles.z2}>
                <Input icon="map-pin" placeholder="Type your city…" value={manualCity} onChangeText={handleCityInput} />
                {suggestions.length > 0 && (
                  <View style={styles.suggest}>
                    {suggestions.map(c => (
                      <Pressable key={c} onPress={() => { setManualCity(c); setCity(c); setSuggestions([]); }} style={({ pressed }) => [styles.suggestRow, pressed && styles.suggestPressed]}>
                        <Icon name="map-pin" size={13} color="#64748B" />
                        <T s={14}>{c}</T>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
              <Pressable onPress={() => { setLocState('idle'); setManualCity(''); setCity(''); setStateName(''); setCoords(null); setSuggestions([]); }} style={styles.retry}>
                <Icon name="arrow-left" size={12} color="#1A6FFF" />
                <T s={12} w={500} c={colors.brand600}>Try GPS again</T>
              </Pressable>
            </FadeIn>
          )}
        </View>
        <View>
          <T display s={14} w={600} style={styles.mb8}>I am a</T>
          <View style={styles.gap8}>
            {TYPES.map(t => {
              const on = type === t.id;
              return (
                <Pressable key={t.id} onPress={() => setType(t.id)} style={[styles.typeBtn, on ? styles.typeOn : styles.typeOff]} accessibilityRole="radio" accessibilityState={{ checked: on }}>
                  <View style={[styles.typeIcon, { backgroundColor: on ? colors.brand600 : colors.ink100 }]}>
                    <Icon name={t.icon} size={18} color={on ? 'white' : '#334155'} />
                  </View>
                  <View style={styles.flex1}>
                    <T s={14} w={600}>{t.label}</T>
                    <T s={11.5} c={colors.ink500}>{t.sub}</T>
                  </View>
                  <View style={[styles.radio, on ? styles.radioOn : styles.radioOff]}>
                    {on && <View style={styles.radioDot} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
        {error && (
          <FadeIn style={styles.error}>
            <StatusMark kind="error" size={16} />
            <T s={12} c={colors.rose700} style={styles.flex1}>{error}</T>
          </FadeIn>
        )}
        <SolidBtn onPress={() => { void handleContinue(); }} disabled={!canContinue || saving}>
          {saving ? 'Saving…' : 'Continue'}
        </SolidBtn>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 24, gap: 20 },
  z2: { zIndex: 2 },
  flex1: { flex: 1 },
  mb8: { marginBottom: 8 },
  mt8: { marginTop: 8 },
  gap8: { gap: 8 },
  locBtn: { width: '100%', padding: 16, borderRadius: 14, borderWidth: 2, flexDirection: 'row', alignItems: 'center', gap: 12 },
  locOn: { borderColor: colors.brand600, backgroundColor: colors.brand50 },
  locIdle: { borderStyle: 'dashed', borderColor: colors.ink200 },
  locIcon: { width: 44, height: 44, borderRadius: 9999, alignItems: 'center', justifyContent: 'center' },
  warn: { padding: 12, backgroundColor: colors.amber50, borderWidth: 1, borderColor: colors.amber200, borderRadius: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  suggest: { position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.ink200, borderRadius: 14, marginTop: 4, boxShadow: elev.lg, overflow: 'hidden' },
  suggestRow: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  suggestPressed: { backgroundColor: colors.brand50 },
  retry: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  typeBtn: { width: '100%', padding: 12, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  typeOn: { borderColor: colors.brand600, backgroundColor: colors.brand50 },
  typeOff: { borderColor: colors.ink200 },
  typeIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  radio: { width: 20, height: 20, borderRadius: 9999, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.brand600, backgroundColor: colors.brand600 },
  radioOff: { borderColor: colors.ink300 },
  radioDot: { width: 6, height: 6, borderRadius: 9999, backgroundColor: colors.white },
  error: { padding: 12, backgroundColor: colors.rose50, borderWidth: 1, borderColor: colors.rose200, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
});
