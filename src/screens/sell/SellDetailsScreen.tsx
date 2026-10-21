import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Checkbox, Field, Input } from '../../components/Form';
import { Icon } from '../../components/Icon';
import { Grid } from '../../components/Layout';
import { Press } from '../../components/Press';
import { Screen, ScreenFooter, SolidButton } from '../../components/Screen';
import { SellHeader } from '../../components/SellHeader';
import { T } from '../../components/T';
import { propertyTypeById } from '../../config/catalog';
import { useSellFlow, type SellForm } from '../../context/SellFlowContext';
import { useNav } from '../../navigation/NavContext';
import { tw } from '../../theme';
import {
  PillChoice,
  TileChoice,
  TypeBanner,
  useBackgroundDraftSave,
} from './sellShared';

type FieldKey =
  | 'title'
  | 'ownership'
  | 'bhk'
  | 'builtUp'
  | 'carpetArea'
  | 'floor'
  | 'totalFloors'
  | 'facing'
  | 'age'
  | 'furnish'
  | 'parking'
  | 'area'
  | 'zoning'
  | 'roadAccess'
  | 'water'
  | 'electricity'
  | 'fencing'
  | 'landArea'
  | 'garden'
  | 'terrace'
  | 'borewell';

const CONFIGS: Record<string, { label: string; fields: FieldKey[] }> = {
  apartment: {
    label: 'Apartment',
    fields: [
      'title',
      'ownership',
      'bhk',
      'builtUp',
      'carpetArea',
      'floor',
      'totalFloors',
      'facing',
      'age',
      'furnish',
      'parking',
    ],
  },
  plot: {
    label: 'Plot',
    fields: [
      'title',
      'ownership',
      'area',
      'facing',
      'roadAccess',
      'zoning',
      'water',
      'electricity',
      'fencing',
    ],
  },
  villa: {
    label: 'Villa',
    fields: [
      'title',
      'ownership',
      'bhk',
      'landArea',
      'builtUp',
      'floor',
      'facing',
      'age',
      'furnish',
      'parking',
      'garden',
      'terrace',
      'borewell',
    ],
  },
  land: {
    label: 'Land',
    fields: [
      'title',
      'ownership',
      'area',
      'facing',
      'roadAccess',
      'water',
      'electricity',
      'zoning',
    ],
  },
  commercial: {
    label: 'Commercial',
    fields: [
      'title',
      'ownership',
      'builtUp',
      'floor',
      'parking',
      'facing',
      'age',
    ],
  },
};

// SL-04 shows short age chips; the form keeps SL-01's canonical labels.
const AGE_CHIPS: Array<[string, string]> = [
  ['New', '0–1 year'],
  ['1-5y', '1–5 years'],
  ['5-10y', '5–10 years'],
  ['10+y', '10+ years'],
];
const ROADS = ['Via main road', 'Via internal road', 'Via approach road'];
const digits = (v: string) => v.replace(/[^\d]/g, '');

/** SL-04 Property details, fields depend on the property type (step 4/7). */
export function SellDetailsScreen() {
  const nav = useNav();
  const { form, set } = useSellFlow();
  const saveInBackground = useBackgroundDraftSave();
  const config = CONFIGS[form.typeId] ?? CONFIGS.apartment;
  const typeLabel = CONFIGS[form.typeId]
    ? config.label
    : propertyTypeById(form.typeId)?.label ?? config.label;
  const has = (f: FieldKey) => config.fields.includes(f);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});

  const value = (k: FieldKey): string => {
    if (k === 'area') return form.plotArea;
    if (k === 'carpetArea') return form.carpet;
    return String(form[k as keyof SellForm] ?? '');
  };
  const required = (): FieldKey[] => {
    const req: FieldKey[] = ['title', 'ownership'];
    if (has('bhk')) req.push('bhk');
    if (has('builtUp')) req.push('builtUp');
    else if (has('area')) req.push('area');
    return req;
  };
  const update = <K extends keyof SellForm>(
    k: K,
    v: SellForm[K],
    field?: FieldKey,
  ) => {
    set(k, v);
    if (field) setErrors(e => ({ ...e, [field]: '' }));
  };
  const handleContinue = () => {
    const missing = required().filter(k => !value(k).trim());
    if (missing.length) {
      setErrors(Object.fromEntries(missing.map(k => [k, 'Required'])));
      return;
    }
    saveInBackground(4);
    nav.go('sellAmenities');
  };

  const err = (k: FieldKey) =>
    errors[k] ? <T style={styles.error}>{errors[k]}</T> : null;
  const check = (
    k: 'water' | 'electricity' | 'fencing' | 'garden' | 'terrace' | 'borewell',
    label: string,
  ) => (
    <Press
      key={k}
      pressScale={1}
      onPress={() => set(k, !form[k])}
      style={styles.checkRow}
    >
      <Checkbox checked={form[k]} />
      <T style={styles.checkLabel}>{label}</T>
    </Press>
  );

  return (
    <Screen
      footer={
        <ScreenFooter>
          <SolidButton label="Continue to Amenities" onPress={handleContinue} />
        </ScreenFooter>
      }
    >
      <SellHeader step={4} title="Property Details" />
      <View style={styles.body}>
        <TypeBanner label={typeLabel} onEdit={nav.back} />
        <T style={styles.h2}>Property Details</T>
        <View>
          <Field label="Property Title" required>
            <Input
              placeholder="e.g. Bright 3 BHK in Adyar"
              value={form.title}
              maxLength={100}
              invalid={!!errors.title}
              onChangeText={v => update('title', v, 'title')}
            />
          </Field>
          {err('title')}
        </View>
        {has('bhk') && (
          <View>
            <Field label="BHK" required>
              <View style={styles.wrap}>
                {['1', '2', '3', '4', '5+'].map(b => (
                  <PillChoice
                    key={b}
                    label={b}
                    on={form.bhk === b}
                    onPress={() => update('bhk', b, 'bhk')}
                  />
                ))}
              </View>
            </Field>
            {err('bhk')}
          </View>
        )}
        {has('builtUp') && (
          <View>
            <Field label="Built-up Area (sqft)" required>
              <Input
                keyboardType="number-pad"
                placeholder="e.g. 1200"
                value={form.builtUp}
                invalid={!!errors.builtUp}
                onChangeText={v => update('builtUp', digits(v), 'builtUp')}
              />
            </Field>
            {err('builtUp')}
          </View>
        )}
        {(has('carpetArea') || has('floor')) && (
          <>
            <Field label="Carpet Area (sqft)">
              <Input
                keyboardType="number-pad"
                placeholder="Usable floor area (optional)"
                value={form.carpet}
                onChangeText={v => set('carpet', digits(v))}
              />
            </Field>
            <Grid cols={2} gap={12}>
              <Field label="Your Floor">
                <Input
                  keyboardType="number-pad"
                  placeholder="e.g. 5"
                  value={form.floor}
                  onChangeText={v => set('floor', digits(v))}
                />
              </Field>
              <Field label="Total Floors">
                <Input
                  keyboardType="number-pad"
                  placeholder="e.g. 10"
                  value={form.totalFloors}
                  onChangeText={v => set('totalFloors', digits(v))}
                />
              </Field>
            </Grid>
          </>
        )}
        {has('area') && (
          <View>
            <Field label="Plot Area (sqft)" required>
              <Input
                keyboardType="number-pad"
                placeholder="e.g. 2400"
                value={form.plotArea}
                invalid={!!errors.area}
                onChangeText={v => update('plotArea', digits(v), 'area')}
              />
            </Field>
            {err('area')}
          </View>
        )}
        {has('landArea') && (
          <Field label="Land Area (sqft)">
            <Input
              keyboardType="number-pad"
              placeholder="Total land area"
              value={form.landArea}
              onChangeText={v => set('landArea', digits(v))}
            />
          </Field>
        )}
        <Field label="Facing Direction" required>
          <Grid cols={4} gap={8}>
            {['North', 'South', 'East', 'West'].map(f => (
              <TileChoice
                key={f}
                label={f}
                on={form.facing === f}
                onPress={() => set('facing', f)}
              />
            ))}
          </Grid>
        </Field>
        <View>
          <Field label="Ownership Type" required>
            <Grid cols={2} gap={8}>
              {['Freehold', 'Leasehold', 'Co-op', 'Power of Attorney'].map(
                o => (
                  <TileChoice
                    key={o}
                    bold
                    label={o}
                    on={form.ownership === o}
                    onPress={() => update('ownership', o, 'ownership')}
                  />
                ),
              )}
            </Grid>
          </Field>
          {err('ownership')}
        </View>
        {(has('age') || has('furnish')) && (
          <>
            <Field label="Property Age">
              <View style={styles.wrap}>
                {AGE_CHIPS.map(([label, canonical]) => (
                  <PillChoice
                    key={label}
                    compact
                    label={label}
                    on={form.age === canonical}
                    onPress={() => set('age', canonical)}
                  />
                ))}
              </View>
            </Field>
            <Field label="Furnishing Status">
              <Grid cols={3} gap={8}>
                {['Unfurnished', 'Semi-Furnished', 'Furnished'].map(f => (
                  <TileChoice
                    key={f}
                    small
                    label={f}
                    on={form.furnish === f}
                    onPress={() => set('furnish', f)}
                  />
                ))}
              </Grid>
            </Field>
            <Field label="Parking Spaces">
              <View style={styles.stepper}>
                <Press
                  onPress={() => set('parking', Math.max(0, form.parking - 1))}
                  style={styles.stepBtn}
                  accessibilityLabel="Fewer parking spaces"
                >
                  <Icon name="minus" size={14} />
                </Press>
                <T style={styles.stepValue}>{form.parking}</T>
                <Press
                  onPress={() => set('parking', Math.min(50, form.parking + 1))}
                  style={styles.stepBtn}
                  accessibilityLabel="More parking spaces"
                >
                  <Icon name="plus" size={14} />
                </Press>
              </View>
            </Field>
          </>
        )}
        {has('roadAccess') && (
          <>
            <Field label="Road Access">
              <View style={styles.stack}>
                {ROADS.map(r => (
                  <Press
                    key={r}
                    onPress={() => set('roadAccess', r)}
                    pressScale={0.99}
                    style={[
                      styles.road,
                      form.roadAccess === r ? styles.roadOn : styles.roadOff,
                    ]}
                  >
                    <T style={styles.roadText}>{r}</T>
                  </Press>
                ))}
              </View>
            </Field>
            <Field label="Zoning Type">
              <Input
                placeholder="e.g. Residential, Commercial, Mixed"
                value={form.zoning}
                onChangeText={v => set('zoning', v)}
                maxLength={60}
              />
            </Field>
            <View style={styles.stack}>
              {check('water', 'Water source available')}
              {check('electricity', 'Electricity connection')}
              {check('fencing', 'Compound wall/fencing')}
            </View>
          </>
        )}
        {has('garden') && (
          <View style={styles.stack}>
            {check('garden', 'Garden')}
            {check('terrace', 'Terrace')}
            {check('borewell', 'Borewell')}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { ...tw('px-4 mt-4 pb-24'), gap: 16 },
  h2: tw('text-[16px] font-semibold text-ink-900'),
  wrap: tw('flex flex-wrap gap-2'),
  error: tw('text-[11px] text-rose-600 mt-1'),
  stepper: tw('flex items-center gap-3 p-3 bg-ink-50 rounded-card'),
  stepBtn: tw(
    'w-8 h-8 rounded bg-white border border-ink-200 items-center justify-center',
  ),
  stepValue: tw('text-[16px] font-bold w-8 text-center'),
  stack: { gap: 8 },
  road: tw('w-full px-3 py-2 rounded-card border'),
  roadOn: tw('border-brand-600 bg-brand-50'),
  roadOff: tw('border-ink-200'),
  roadText: tw('text-[16px]'),
  checkRow: tw('flex items-center gap-3 p-3 bg-ink-50 rounded-card'),
  checkLabel: tw('text-[13px] font-medium'),
});
