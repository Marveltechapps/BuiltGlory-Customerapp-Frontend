import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Field, Input } from '../../components/Form';
import { Icon } from '../../components/Icon';
import { Grid } from '../../components/Layout';
import { MapCanvas } from '../../components/MapCanvas';
import { Press } from '../../components/Press';
import { Screen, ScreenFooter, SolidButton } from '../../components/Screen';
import { SellHeader } from '../../components/SellHeader';
import { T } from '../../components/T';
import { useAuth } from '../../context/AuthContext';
import { useSellFlow } from '../../context/SellFlowContext';
import { useNav } from '../../navigation/NavContext';
import { reverseGeocode } from '../../services/geo.service';
import { readGeolocation } from '../../utils/geolocation';
import { tw } from '../../theme';
import { useBackgroundDraftSave } from './sellShared';

/** SL-02 Location & address (step 2/7). */
export function SellAddressScreen() {
  const nav = useNav();
  const { user } = useAuth();
  const { form, set, patch } = useSellFlow();
  const saveInBackground = useBackgroundDraftSave();
  const [filled, setFilled] = useState<string | null>(null);
  const valid = Boolean(form.building.trim() && form.pin.length === 6);

  const useCurrent = () => {
    const geo = readGeolocation();
    const applyCity = (city: string) => {
      patch({ city });
      setFilled(city);
    };
    if (!geo) {
      if (user?.city) applyCity(user.city);
      return;
    }
    geo.getCurrentPosition(
      async position => {
        try {
          const place = await reverseGeocode(position.coords.latitude, position.coords.longitude);
          applyCity(place.city);
        } catch {
          if (user?.city) applyCity(user.city);
        }
      },
      () => { if (user?.city) applyCity(user.city); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <Screen
      footer={
        <ScreenFooter>
          <SolidButton
            label="Continue to Details"
            disabled={!valid}
            onPress={() => {
              saveInBackground(2);
              nav.go('sellDetails');
            }}
          />
        </ScreenFooter>
      }
    >
      <SellHeader step={2} title="Location & Address" />
      <View style={styles.body}>
        <MapCanvas style={styles.map}>
          <View style={styles.pinWrap} pointerEvents="none">
            <View style={styles.pin}>
              <Icon name="map-pin" size={16} color="#FFFFFF" />
            </View>
          </View>
          <Press
            onPress={useCurrent}
            style={styles.current}
            accessibilityLabel="Use my profile city"
          >
            <Icon name="locate-fixed" size={10} color="#1A6FFF" />
            <T style={styles.currentText}>
              {filled || 'Use current'}
            </T>
          </Press>
        </MapCanvas>
        <View style={styles.fields}>
          <Field label="Building / Society" required>
            <Input
              icon="building-2"
              placeholder="e.g. Sunrise Heights"
              value={form.building}
              onChangeText={v => set('building', v)}
              maxLength={120}
            />
          </Field>
          <Field label="Area / Locality">
            <Input
              icon="map"
              placeholder="e.g. Adyar"
              value={form.locality}
              onChangeText={v => set('locality', v)}
              maxLength={80}
            />
          </Field>
          <Grid cols={2} gap={12}>
            <Field label="City">
              <Input
                icon="map-pin"
                value={form.city}
                onChangeText={v => set('city', v)}
                maxLength={80}
              />
            </Field>
            <Field label="Pincode" required>
              <Input
                maxLength={6}
                keyboardType="number-pad"
                placeholder="6-digit"
                value={form.pin}
                onChangeText={v => set('pin', v.replace(/\D/g, ''))}
              />
            </Field>
          </Grid>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: tw('px-4 mt-4 pb-20'),
  map: {
    ...tw('h-36 rounded-card border border-ink-200 mb-4'),
    overflow: 'hidden',
  },
  pinWrap: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [{ translateX: -18 }, { translateY: -36 }],
  },
  pin: {
    ...tw('w-9 h-9 rounded-full bg-brand-600 items-center justify-center'),
    boxShadow: '0 1px 3px rgba(0,0,0,.1), 0 1px 2px -1px rgba(0,0,0,.1)',
  },
  current: {
    ...tw(
      'absolute bottom-2 right-2 bg-white px-2 py-1 rounded flex items-center gap-1',
    ),
    boxShadow: '0 1px 3px rgba(0,0,0,.1), 0 1px 2px -1px rgba(0,0,0,.1)',
  },
  currentText: tw('text-[10.5px] font-semibold'),
  fields: { gap: 16 },
});
