import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Input, Radio } from '../../components/Form';
import { Icon, type IconName } from '../../components/Icon';
import { Fade } from '../../components/Motion';
import { Press } from '../../components/Press';
import { Screen, SolidButton } from '../../components/Screen';
import { StatusMark } from '../../components/StatusMark';
import { T } from '../../components/T';
import { CITIES } from '../../config/catalog';
import { useAuth } from '../../context/AuthContext';
import { useNav } from '../../navigation/NavContext';
import type { UserType } from '../../types/user';
import { palette, tw } from '../../theme';
import { reverseGeocode } from '../../services/geo.service';
import { errorMessage } from '../../utils/errorMessage';
import { readGeolocation } from '../../utils/geolocation';

const TYPES: Array<{
  id: UserType;
  label: string;
  sub: string;
  icon: IconName;
}> = [
  { id: 'resident', label: 'Resident', sub: 'Living in India', icon: 'home' },
  { id: 'nri', label: 'NRI', sub: 'Non-Resident Indian', icon: 'plane' },
  { id: 'pio', label: 'PIO', sub: 'Person of Indian Origin', icon: 'globe' },
];

/** S-06 Location + user type. */
export function LocationUserTypeScreen() {
  const nav = useNav();
  const { user, saveProfile } = useAuth();
  const [locState, setLocState] = useState<'idle' | 'locating' | 'done' | 'failed'>('idle');
  const [manualCity, setManualCity] = useState(user?.city ?? '');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [type, setType] = useState<UserType>(user?.userType ?? 'resident');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canContinue = manualCity.trim().length >= 2;
  const useCurrentLocation = () => {
    const geo = readGeolocation();
    if (!geo) {
      setLocState('failed');
      setError('Location is not available on this device. Enter your city.');
      return;
    }
    setLocState('locating');
    setError(null);
    geo.getCurrentPosition(
      async position => {
        try {
          const place = await reverseGeocode(position.coords.latitude, position.coords.longitude);
          setManualCity(place.city);
          setLocState('done');
        } catch (e) {
          setLocState('failed');
          setError(errorMessage(e));
        }
      },
      () => {
        setLocState('failed');
        setError('Location access was blocked. Enter your city.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const onCity = (v: string) => {
    setManualCity(v);
    setSuggestions(
      v.length >= 1
        ? CITIES.filter(c => c.toLowerCase().startsWith(v.toLowerCase()))
        : [],
    );
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveProfile({ city: manualCity.trim(), userType: type });
      nav.go('terms');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen topBar={{ title: 'A few more details', back: true }}>
      <View style={styles.body}>
        <View>
          <T style={styles.h3}>Your location</T>
          {locState !== 'failed' && (
            <Press
              onPress={useCurrentLocation}
              disabled={locState === 'locating'}
              style={[styles.locBtn, styles.locIdle]}
            >
              <View
                style={[styles.locIcon, { backgroundColor: palette.ink[100] }]}
              >
                <Icon name="map-pin" size={18} color="#64748B" />
              </View>
              <View style={styles.flex}>
                <T style={styles.locTitle}>
                  {locState === 'done' ? manualCity : locState === 'locating' ? 'Finding your city…' : 'Use my current location'}
                </T>
                <T style={styles.locSub}>
                  {locState === 'done' ? 'Detected from your location' : 'Show nearby listings'}
                </T>
              </View>
            </Press>
          )}
          {locState === 'idle' && (
            <Press
              onPress={() => setLocState('failed')}
              pressScale={1}
              style={styles.link}
            >
              <T style={styles.linkText}>Enter city manually instead</T>
            </Press>
          )}
          {locState === 'failed' && (
            <Fade style={styles.manual}>
              <View style={styles.warn}>
                <StatusMark kind="warn" size={16} />
                <T style={styles.warnText}>
                  Couldn't detect location. Enter your city manually.
                </T>
              </View>
              <View style={styles.cityWrap}>
                <Input
                  icon="map-pin"
                  placeholder="Type your city…"
                  value={manualCity}
                  onChangeText={onCity}
                  autoCapitalize="words"
                />
                {suggestions.length > 0 && (
                  <View style={styles.suggest}>
                    {suggestions.map(c => (
                      <Press
                        key={c}
                        pressScale={1}
                        onPress={() => {
                          setManualCity(c);
                          setSuggestions([]);
                        }}
                        pressedStyle={styles.suggestPressed}
                        style={styles.suggestRow}
                      >
                        <Icon name="map-pin" size={13} color="#64748B" />
                        <T style={styles.suggestText}>{c}</T>
                      </Press>
                    ))}
                  </View>
                )}
              </View>
              <Press
                pressScale={1}
                onPress={() => {
                  setLocState('idle');
                  setSuggestions([]);
                }}
                style={styles.backLink}
              >
                <Icon name="arrow-left" size={12} color="#1A6FFF" />
                <T style={styles.linkText}>Try GPS again</T>
              </Press>
            </Fade>
          )}
        </View>
        <View>
          <T style={styles.h3}>I am a</T>
          <View style={styles.types}>
            {TYPES.map(t => {
              const on = type === t.id;
              return (
                <Press
                  key={t.id}
                  onPress={() => setType(t.id)}
                  style={[styles.typeRow, on ? styles.typeOn : styles.typeOff]}
                >
                  <View
                    style={[
                      styles.typeIcon,
                      {
                        backgroundColor: on
                          ? palette.brand[600]
                          : palette.ink[100],
                      },
                    ]}
                  >
                    <Icon
                      name={t.icon}
                      size={18}
                      color={on ? '#FFFFFF' : '#334155'}
                    />
                  </View>
                  <View style={styles.flex}>
                    <T style={styles.typeLabel}>{t.label}</T>
                    <T style={styles.typeSub}>{t.sub}</T>
                  </View>
                  <Radio selected={on} />
                </Press>
              );
            })}
          </View>
        </View>
        {error && <T style={styles.error}>{error}</T>}
        <SolidButton
          label="Continue"
          onPress={save}
          disabled={!canContinue}
          loading={saving}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: tw('flex-1'),
  body: { ...tw('px-6'), gap: 20 },
  h3: tw('text-[14px] font-semibold mb-2'),
  locBtn: tw('w-full p-4 rounded-card border-2 flex items-center gap-3'),
  locIdle: { borderStyle: 'dashed', borderColor: palette.ink[200] },
  locIcon: tw('w-11 h-11 rounded-full items-center justify-center'),
  locTitle: tw('text-[14px] font-semibold'),
  locSub: tw('text-[12px] text-ink-500'),
  link: tw('mt-2'),
  linkText: tw('text-[12px] text-brand-600 font-medium'),
  manual: { gap: 8 },
  warn: tw(
    'p-3 bg-amber-50 border border-amber-200 rounded-card flex items-start gap-2',
  ),
  warnText: tw('flex-1 text-[12px] text-amber-800'),
  cityWrap: { position: 'relative', zIndex: 20 },
  suggest: {
    ...tw(
      'absolute left-0 right-0 z-20 bg-white border border-ink-200 rounded-card mt-1 overflow-hidden',
    ),
    top: '100%',
    boxShadow:
      '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
  },
  suggestRow: tw('w-full flex items-center gap-2 px-3 py-2.5'),
  suggestPressed: tw('bg-brand-50'),
  suggestText: tw('text-[14px]'),
  backLink: tw('flex items-center gap-1'),
  types: { gap: 8 },
  typeRow: tw('w-full p-3 rounded-card border flex items-center gap-3'),
  typeOn: tw('border-brand-600 bg-brand-50'),
  typeOff: tw('border-ink-200'),
  typeIcon: tw('w-10 h-10 rounded-xl items-center justify-center'),
  typeLabel: tw('text-[14px] font-semibold'),
  typeSub: tw('text-[11.5px] text-ink-500'),
  error: tw('text-[12px] text-rose-600 text-center'),
});
