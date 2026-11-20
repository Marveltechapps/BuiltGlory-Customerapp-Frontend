import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Icon } from '../../components/icons/Icon';
import { TileMap } from '../../components/TileMap';
import { readCurrentPosition } from '../../utils/geolocation';
import { SellHeader, TextIn } from '../../components/journey/SellParts';
import { DockBar } from '../../components/layout/AppScreen';
import { Grid } from '../../components/layout/Grid';
import { Screen } from '../../components/layout/Screen';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { PropertyTypeGrid } from '../../components/PropertyTypeGrid';
import { Btn } from '../../components/ui/Btn';
import { Field, Input } from '../../components/ui/Field';
import { PopIn } from '../../components/ui/Motion';
import { buzz, Press } from '../../components/ui/Press';
import { T } from '../../components/ui/T';
import { PROPERTY_TYPES } from '../../config/sampleData';
import { useAuth } from '../../context/AuthContext';
import { getSD, sdSet } from '../../context/sellStore';
import type { ScreenProps } from '../../navigation/types';
import { colors, elev, ring } from '../../theme';
import * as geoService from '../../services/geo.service';
import { errorMessage } from '../../utils/errorMessage';

/** SL-03 What would you like to sell? */
export function SellTypeScreen({ go, back }: ScreenProps) {
  return (
    <Screen>
      <View style={styles.head}>
        <Pressable onPress={back} style={({ pressed }) => [styles.back, pressed && { backgroundColor: colors.ink100 }]} accessibilityLabel="Back"><Icon name="arrow-left" size={22} /></Pressable>
        <T display s={18} w={600}>Sell Property</T>
        <Press onPress={() => go('helpFaqs')} style={styles.help} accessibilityLabel="Help"><Icon name="help-circle" size={17} color="#64748B" /></Press>
      </View>
      <View style={styles.intro}>
        <T display s={22} w={700}>What Would You Like to Sell?</T>
        <T s={14} c={colors.ink500} style={styles.mt4}>Select property type to get started</T>
      </View>
      <PropertyTypeGrid onSelect={type => { sdSet({ type }); go('sellIntent', { type }); }} accentColor="#059669" hover={{ border: colors.emerald300, bg: colors.emerald50 }} />
      <View style={styles.section}>
        <T display s={14} w={600} style={styles.mb8}>Need Help?</T>
        <View style={styles.helpCard}>
          <Icon name="info" size={16} color="#1A6FFF" style={styles.mt2} />
          <View style={styles.flex1}>
            <T s={13} w={500} style={styles.mb2}>Not sure which category?</T>
            <T s={12} c={colors.ink600} style={styles.mb12}>Get free consultation from our property experts</T>
            <Pressable onPress={() => go('customerSupport')} style={({ pressed }) => [styles.call, { backgroundColor: pressed ? colors.brand700 : colors.brand600 }]}>
              <Icon name="phone" size={14} color="white" />
              <T s={12} w={500} c="#FFFFFF">Call Us</T>
            </Pressable>
          </View>
        </View>
      </View>
      <View style={styles.section}>
        <T display s={14} w={600} style={styles.mb12}>Recently Sold on Builtglory</T>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.soldRail}>
          {([['₹45L', 12], ['₹85L', 8], ['₹55L', 15]] as [string, number][]).map(([price, days], i) => (
            <View key={i} style={styles.sold}>
              <PhotoPlaceholder tag={'sold-' + i} height={72} />
              <View style={styles.p8}>
                <T s={13} w={700} c={colors.brand600}>{price}</T>
                <T s={10.5} c={colors.ink600}>Sold in {days} days</T>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
      <View style={[styles.section, styles.mb24]}>
        <T display s={14} w={600} style={styles.mb12}>Why Sell with Builtglory?</T>
        <View style={styles.wrap}>
          {([['✓ No Commission', colors.emerald500], ['✓ Verified Buyers', colors.brand600], ['✓ Quick Sale', colors.amber500]] as [string, string][]).map(([l, c]) => (
            <View key={l} style={[styles.why, { backgroundColor: c }]}><T s={11} w={600} c="#FFFFFF">{l}</T></View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

/** SL-01 Seller details */
export function SellIntentScreen({ go, back, ctx }: ScreenProps) {
  const { user } = useAuth();
  const SD = getSD();
  const phone = user?.phone || (user?.mobileNumber ? `+91 ${user.mobileNumber}` : '');
  const [d, setD] = useState(SD.intent || {
    name: user?.name || '',
    phone,
    email: user?.email || '',
    sellerType: 'owner',
    confirm: false,
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const up = (k: string, v: unknown) => setD((x: Record<string, unknown>) => ({ ...x, [k]: v }));
  const emailBad = d.email && !/^\S+@\S+\.\S+$/.test(d.email);
  const errs = { name: d.name.trim().length < 2 ? 'Enter your full name' : '', email: emailBad ? 'Enter a valid email' : '' };
  const valid = !errs.name && !errs.email && d.confirm;
  const type: string = ctx?.type || SD.type || 'apartment';
  const next = () => { setTouched({ name: true, email: true }); if (!valid) return; sdSet({ intent: { ...d, phone }, type }); go('sellAddress', { ...ctx, type }); };
  const t = (PROPERTY_TYPES.find(x => x.id === type) || { label: '' }).label || 'property';
  return (
    <Screen footer={<DockBar legacy><Btn full disabled={!valid} onPress={next}>Continue</Btn></DockBar>}>
      <SellHeader step={1} back={back} title="Seller details" sub={`Selling ${/^[aeiou]/i.test(t) ? 'an' : 'a'} ${t}`} />
      <View style={styles.form}>
        <TextIn label="Seller name" required placeholder="As on ownership documents" value={d.name} onChangeText={v => up('name', v)} onBlur={() => setTouched(x => ({ ...x, name: true }))} error={touched.name && errs.name} />
        <Field label="Phone" hint="From your account">
          <Input icon="phone" value={phone || d.phone || '—'} editable={false} containerStyle={{ backgroundColor: colors.ink50 }} />
        </Field>
        <TextIn label="Email" hint="Optional" icon="mail" keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" value={d.email} onChangeText={v => up('email', v)} onBlur={() => setTouched(x => ({ ...x, email: true }))} error={touched.email && errs.email} />
        <Field label="Seller type" required>
          <Grid cols={2} gap={8}>
            {([['owner', 'Owner', 'user'], ['developer', 'Developer', 'building-2']] as [string, string, string][]).map(([id, l, ic]) => {
              const on = d.sellerType === id;
              return (
                <Press key={id} onPress={() => up('sellerType', id)} style={[styles.type, on ? styles.typeOn : styles.typeOff]}>
                  <View style={[styles.radio, { borderColor: on ? colors.brand600 : colors.ink300 }]}>{on && <View style={styles.radioDot} />}</View>
                  <Icon name={ic} size={15} color={on ? colors.brand700 : colors.ink900} />
                  <T s={13.5} w={600} c={on ? colors.brand700 : colors.ink900}>{l}</T>
                </Press>
              );
            })}
          </Grid>
        </Field>
        <Pressable onPress={() => up('confirm', !d.confirm)} style={[styles.confirm, d.confirm ? styles.confirmOn : styles.confirmOff]} accessibilityRole="checkbox" accessibilityState={{ checked: d.confirm }}>
          <View style={[styles.check, d.confirm ? styles.checkOn : styles.checkOff]}>{d.confirm && <Icon name="check" size={11} color="white" strokeWidth={3} />}</View>
          <T s={12.5} style={styles.flex1}>I confirm I am the legal owner, or authorised to sell this property. <T c={colors.rose500}>*</T></T>
        </Pressable>
      </View>
    </Screen>
  );
}

const STATES = ['Tamil Nadu', 'Karnataka', 'Kerala', 'Andhra Pradesh', 'Telangana', 'Maharashtra', 'Delhi', 'Other'];

/** Simple dropdown standing in for the design's native <select>. */
export function SelectField({ value, options, onChange, placeholder }: { value: string; options: string[]; onChange: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable onPress={() => setOpen(o => !o)} style={[styles.select, open && { borderColor: colors.brand600 }]} accessibilityRole="combobox">
        <T s={14} truncate style={styles.flex1}>{value || placeholder || ''}</T>
        <Icon name="chevron-down" size={16} color="#94A3B8" />
      </Pressable>
      {open && (
        <View style={styles.options}>
          {options.map(o => (
            <Pressable key={o} onPress={() => { onChange(o); setOpen(false); }} style={({ pressed }) => [styles.option, (pressed || value === o) && { backgroundColor: colors.brand50 }]}>
              <T s={14}>{o}</T>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

/** SL-02 Property address */
export function SellAddressScreen({ go, back, ctx }: ScreenProps) {
  const SD = getSD();
  const [d, setD] = useState(SD.address || { door: '', street: '', area: '', city: 'Chennai', state: 'Tamil Nadu', pin: '', landmark: '', pinned: false, latitude: undefined as number | undefined, longitude: undefined as number | undefined });
  const [tried, setTried] = useState(false);
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoErr, setGeoErr] = useState('');
  const up = (k: string, v: unknown) => setD((x: Record<string, unknown>) => ({ ...x, [k]: v }));
  const errs: Record<string, string> = {
    door: !d.door.trim() ? 'Required' : '', street: !d.street.trim() ? 'Required' : '', area: !d.area.trim() ? 'Required' : '',
    city: !d.city.trim() ? 'Required' : '', pin: !/^[1-9]\d{5}$/.test(d.pin) ? 'Enter a valid 6-digit pincode' : '',
  };
  const missing = Object.values(errs).filter(Boolean).length;
  const next = () => { setTried(true); if (missing) { buzz(20); return; } sdSet({ address: d }); go('sellDetails', { ...ctx, type: ctx?.type || SD.type, address: d }); };
  const e = (k: string) => (tried ? errs[k] : '');
  const pinLocation = async () => {
    if (d.pinned) {
      up('pinned', false);
      up('latitude', undefined);
      up('longitude', undefined);
      buzz();
      return;
    }
    setGeoBusy(true);
    setGeoErr('');
    try {
      const position = await readCurrentPosition();
      if (position) {
        const geo = await geoService.reverseGeocode(position.coords.latitude, position.coords.longitude);
        setD((x: Record<string, unknown>) => ({
          ...x,
          pinned: true,
          latitude: geo.latitude ?? position.coords.latitude,
          longitude: geo.longitude ?? position.coords.longitude,
          city: geo.city || x.city,
          state: geo.state || x.state,
          area: geo.locality || x.area,
          pin: geo.pincode || x.pin,
          street: geo.street || x.street,
        }));
      } else {
        const query = [d.door, d.street, d.area, d.city, d.state, d.pin, 'India'].filter(Boolean).join(', ');
        const geo = await geoService.forwardGeocode(query);
        if (!geo) throw new Error('Enter the area and city, then tap the map again.');
        setD((x: Record<string, unknown>) => ({
          ...x,
          pinned: true,
          latitude: geo.latitude,
          longitude: geo.longitude,
          city: geo.city || x.city,
          state: geo.state || x.state,
          area: geo.locality || x.area,
          pin: geo.pincode || x.pin,
        }));
      }
      buzz();
    } catch (err) {
      setGeoErr(errorMessage(err));
    } finally {
      setGeoBusy(false);
    }
  };
  return (
    <Screen footer={<DockBar legacy><Btn full onPress={next}>{missing ? `Continue · ${missing} left` : 'Continue'}</Btn></DockBar>}>
      <SellHeader step={2} back={back} title="Property address" sub="Where is the property?" />
      <View style={[styles.form, styles.gap14]}>
        <Pressable onPress={pinLocation} style={styles.map}>
          <TileMap latitude={typeof d.latitude === 'number' ? d.latitude : null} longitude={typeof d.longitude === 'number' ? d.longitude : null} zoom={15} style={StyleSheet.absoluteFill} />
          <View style={styles.pinCenter} pointerEvents="none">
            {d.pinned
              ? <PopIn key="on" style={[styles.pin, { backgroundColor: colors.emerald500 }]}><Icon name="check" size={17} color="white" /></PopIn>
              : <View style={[styles.pin, { backgroundColor: colors.brand600 }]}><Icon name="map-pin" size={17} color="white" /></View>}
          </View>
          <View style={styles.mapLabel}><T s={11} w={700}>{geoBusy ? 'Looking up address…' : d.pinned ? 'Location pinned · tap to remove' : 'Optional · tap to drop a pin'}</T></View>
        </Pressable>
        {geoErr ? <T s={12} c={colors.rose600}>{geoErr}</T> : null}
        <Grid cols={2} gap={12}>
          <TextIn label="Door no." required placeholder="12A" value={d.door} onChangeText={v => up('door', v)} error={e('door')} />
          <TextIn label="Pincode" required keyboardType="number-pad" maxLength={6} placeholder="600020" value={d.pin} onChangeText={v => up('pin', v.replace(/\D/g, ''))} error={e('pin')} />
        </Grid>
        <TextIn label="Street" required placeholder="2nd Main Road" value={d.street} onChangeText={v => up('street', v)} error={e('street')} />
        <TextIn label="Area / locality" required icon="map" placeholder="Adyar" value={d.area} onChangeText={v => up('area', v)} error={e('area')} />
        <Grid cols={2} gap={12}>
          <TextIn label="City" required value={d.city} onChangeText={v => up('city', v)} error={e('city')} />
          <Field label="State" required>
            <SelectField value={d.state} options={STATES} onChange={v => up('state', v)} />
          </Field>
        </Grid>
        <TextIn label="Landmark" hint="Optional" placeholder="Near Adyar bus depot" value={d.landmark} onChangeText={v => up('landmark', v)} />
        {tried && missing > 0 && (
          <View style={styles.missing}><T s={12} w={500} c={colors.rose700}>Fill the {missing} highlighted {missing === 1 ? 'field' : 'fields'} to continue.</T></View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  mt2: { marginTop: 2 },
  mt4: { marginTop: 4 },
  mb2: { marginBottom: 2 },
  mb8: { marginBottom: 8 },
  mb12: { marginBottom: 12 },
  mb24: { marginBottom: 24 },
  p8: { padding: 8 },
  gap14: { gap: 14 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  head: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { marginLeft: -4, padding: 8, borderRadius: 9999 },
  help: { width: 36, height: 36, borderRadius: 9999, backgroundColor: colors.ink100, alignItems: 'center', justifyContent: 'center' },
  intro: { paddingHorizontal: 16, marginBottom: 16 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  helpCard: { backgroundColor: colors.brand50, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  call: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  soldRail: { gap: 12, paddingBottom: 4 },
  sold: { width: 130, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.ink200, borderRadius: 8, overflow: 'hidden' },
  why: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 },
  form: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 112, gap: 16 },
  type: { height: 48, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  typeOn: { borderColor: colors.brand600, backgroundColor: colors.brand50 },
  typeOff: { borderColor: colors.ink200 },
  radio: { width: 16, height: 16, borderRadius: 9999, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 8, height: 8, borderRadius: 9999, backgroundColor: colors.brand600 },
  confirm: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 16 },
  confirmOn: { boxShadow: ring(colors.emerald200), backgroundColor: 'rgba(236,253,245,0.6)' },
  confirmOff: { boxShadow: ring(colors.ink200) },
  check: { marginTop: 2, width: 16, height: 16, borderRadius: 3, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: '#1A6FFF', borderColor: '#1A6FFF' },
  checkOff: { borderColor: '#767676', backgroundColor: colors.white },
  select: { width: '100%', height: 48, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.ink200, borderRadius: 14, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', gap: 6 },
  options: { marginTop: 4, borderWidth: 1, borderColor: colors.ink200, borderRadius: 14, backgroundColor: colors.white, overflow: 'hidden', boxShadow: elev.e2 },
  option: { paddingHorizontal: 12, paddingVertical: 10 },
  map: { width: '100%', height: 128, borderRadius: 16, overflow: 'hidden', boxShadow: ring(colors.ink200) },
  pinCenter: { position: 'absolute', left: 0, right: 0, top: '50%', marginTop: -36, alignItems: 'center' },
  pin: { width: 36, height: 36, borderRadius: 9999, alignItems: 'center', justifyContent: 'center', boxShadow: elev.brand },
  mapLabel: { position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(255,255,255,0.72)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 },
  missing: { borderRadius: 12, backgroundColor: colors.rose50, boxShadow: ring(colors.rose200), paddingHorizontal: 12, paddingVertical: 8 },
});
