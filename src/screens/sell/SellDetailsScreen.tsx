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
import { AREA_MIN, PRICE_MIN, TITLE_MIN } from './sellCategory';

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
  | 'borewell'
  | 'share'
  | 'totalValue'
  | 'scope'
  | 'suitable'
  | 'parkingType';

const HOME: FieldKey[] = ['title', 'ownership', 'bhk', 'builtUp', 'carpetArea', 'floor', 'totalFloors', 'facing', 'age', 'furnish', 'parking', 'parkingType'];
const CONFIGS: Record<string, { label: string; fields: FieldKey[] }> = {
  apartment: { label: 'Apartment', fields: HOME },
  villa: { label: 'Villa', fields: [...HOME, 'landArea', 'garden', 'terrace', 'borewell'] },
  nri: { label: 'NRI', fields: HOME },
  farmhouse: { label: 'Farmhouse', fields: [...HOME, 'landArea', 'garden', 'borewell'] },
  'ceo-mansion': { label: 'CEO Mansion', fields: HOME },
  organic: { label: 'Organic Home', fields: HOME },
  holiday: { label: 'Holiday Home', fields: HOME },
  '3d-print': { label: '3D Print Home', fields: HOME },
  plot: { label: 'Plot', fields: ['title', 'ownership', 'area', 'facing', 'roadAccess', 'zoning', 'water', 'electricity', 'fencing'] },
  land: { label: 'Land', fields: ['title', 'ownership', 'area', 'facing', 'roadAccess', 'water', 'electricity', 'zoning'] },
  commercial: { label: 'Commercial', fields: ['title', 'ownership', 'suitable', 'builtUp', 'floor', 'parking', 'parkingType', 'facing'] },
  fractional: { label: 'Fractional', fields: ['title', 'ownership', 'share', 'totalValue'] },
  interior: { label: 'Interior', fields: ['title', 'scope'] },
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
  const config = CONFIGS[form.typeId] ?? CONFIGS.apartment!;
  const typeLabel = CONFIGS[form.typeId]
    ? config.label
    : propertyTypeById(form.typeId)?.label ?? config.label;
  const has = (f: FieldKey) => config.fields.includes(f);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});

  const problems = (): Partial<Record<FieldKey, string>> => {
    const next: Partial<Record<FieldKey, string>> = {};
    if (has('title') && form.title.trim().length < TITLE_MIN) next.title = `At least ${TITLE_MIN} characters`;
    if (has('ownership') && !form.ownership.trim()) next.ownership = 'Required';
    if (has('bhk') && !form.bhk.trim()) next.bhk = 'Required';
    if (has('builtUp') && !(Number(form.builtUp) >= AREA_MIN) && !(has('suitable') && Number(form.plotArea) >= AREA_MIN)) next.builtUp = `At least ${AREA_MIN} sqft`;
    if (has('area') && !(Number(form.plotArea) >= AREA_MIN)) next.area = `At least ${AREA_MIN} sqft`;
    if (has('share') && !(Number(form.share) >= 0.01 && Number(form.share) <= 100)) next.share = 'Enter 0.01 to 100';
    if (has('totalValue') && !(Number(form.totalValue) >= PRICE_MIN)) next.totalValue = `At least ₹${PRICE_MIN.toLocaleString('en-IN')}`;
    if (has('scope') && form.scope.trim().length < 2) next.scope = 'Required';
    if (has('parkingType') && form.parking > 0 && !form.parkingType) next.parkingType = 'Select parking type';
    if (has('furnish') && form.furnish.toLowerCase() !== 'unfurnished' && form.furnishDetails.trim().length < 2) next.furnish = 'Describe the furnishing';
    return next;
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
    const missing = problems();
    if (Object.keys(missing).length) {
      setErrors(missing);
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
        {has('carpetArea') && (
          <Field label="Carpet Area (sqft)">
            <Input
              keyboardType="number-pad"
              placeholder="Usable floor area (optional)"
              value={form.carpet}
              onChangeText={v => set('carpet', digits(v))}
            />
          </Field>
        )}
        {has('floor') && (
          <Grid cols={has('totalFloors') ? 2 : 1} gap={12}>
            <Field label="Your Floor">
              <Input
                keyboardType="number-pad"
                placeholder="e.g. 5"
                value={form.floor}
                onChangeText={v => set('floor', digits(v))}
              />
            </Field>
            {has('totalFloors') && (
              <Field label="Total Floors">
                <Input
                  keyboardType="number-pad"
                  placeholder="e.g. 10"
                  value={form.totalFloors}
                  onChangeText={v => set('totalFloors', digits(v))}
                />
              </Field>
            )}
          </Grid>
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
        {has('facing') && (
          <Field label="Facing Direction">
            <Grid cols={4} gap={8}>
              {['North', 'South', 'East', 'West'].map(f => (
                <TileChoice key={f} label={f} on={form.facing === f} onPress={() => set('facing', f)} />
              ))}
            </Grid>
          </Field>
        )}
        {has('ownership') && (
          <View>
            <Field label="Ownership Type" required>
              <Grid cols={2} gap={8}>
                {['Freehold', 'Leasehold', 'Co-op', 'Power of Attorney'].map(o => (
                  <TileChoice key={o} bold label={o} on={form.ownership === o} onPress={() => update('ownership', o, 'ownership')} />
                ))}
              </Grid>
            </Field>
            {err('ownership')}
          </View>
        )}
        {has('share') && (
          <View>
            <Field label="Share Percentage" required hint="Between 0.01 and 100">
              <Input keyboardType="decimal-pad" placeholder="e.g. 10" value={form.share} invalid={!!errors.share} onChangeText={v => update('share', v.replace(/[^\d.]/g, ''), 'share')} />
            </Field>
            {err('share')}
          </View>
        )}
        {has('totalValue') && (
          <View>
            <Field label="Total Property Value (₹)" required>
              <Input keyboardType="number-pad" placeholder="e.g. 8500000" value={form.totalValue} invalid={!!errors.totalValue} onChangeText={v => update('totalValue', digits(v), 'totalValue')} />
            </Field>
            {err('totalValue')}
          </View>
        )}
        {has('scope') && (
          <View>
            <Field label="Scope of Work" required>
              <View style={styles.wrap}>
                {['Full Home', 'Kitchen', 'Living', 'Bedroom', 'Office'].map(s => (
                  <PillChoice key={s} label={s} on={form.scope === s} onPress={() => update('scope', s, 'scope')} />
                ))}
              </View>
            </Field>
            {err('scope')}
          </View>
        )}
        {has('suitable') && (
          <Field label="Suitable For">
            <View style={styles.wrap}>
              {['Office Space', 'Shop / Showroom', 'Warehouse', 'Co-working'].map(s => (
                <PillChoice key={s} label={s} on={form.suitableFor === s} onPress={() => set('suitableFor', s)} />
              ))}
            </View>
          </Field>
        )}
        {has('age') && (
          <Field label="Property Age">
            <View style={styles.wrap}>
              {AGE_CHIPS.map(([label, canonical]) => (
                <PillChoice key={label} compact label={label} on={form.age === canonical} onPress={() => set('age', canonical)} />
              ))}
            </View>
          </Field>
        )}
        {has('furnish') && (
          <>
            <Field label="Furnishing Status">
              <Grid cols={3} gap={8}>
                {['Unfurnished', 'Semi-Furnished', 'Furnished'].map(f => (
                  <TileChoice key={f} small label={f} on={form.furnish === f} onPress={() => update('furnish', f, 'furnish')} />
                ))}
              </Grid>
            </Field>
            {form.furnish.toLowerCase() !== 'unfurnished' && (
              <View>
                <Field label="Furnishing Details" required>
                  <Input placeholder="e.g. Modular kitchen, wardrobes, ACs" value={form.furnishDetails} invalid={!!errors.furnish} onChangeText={v => update('furnishDetails', v, 'furnish')} />
                </Field>
                {err('furnish')}
              </View>
            )}
          </>
        )}
        {has('parking') && (
          <>
            <Field label="Parking Spaces">
              <View style={styles.stepper}>
                <Press onPress={() => set('parking', Math.max(0, form.parking - 1))} style={styles.stepBtn} accessibilityLabel="Fewer parking spaces">
                  <Icon name="minus" size={14} />
                </Press>
                <T style={styles.stepValue}>{form.parking}</T>
                <Press onPress={() => set('parking', Math.min(50, form.parking + 1))} style={styles.stepBtn} accessibilityLabel="More parking spaces">
                  <Icon name="plus" size={14} />
                </Press>
              </View>
            </Field>
            {form.parking > 0 && (
              <View>
                <Field label="Parking Type" required>
                  <View style={styles.wrap}>
                    {['Covered', 'Open', 'Stilt'].map(p => (
                      <PillChoice key={p} label={p} on={form.parkingType === p} onPress={() => update('parkingType', p, 'parkingType')} />
                    ))}
                  </View>
                </Field>
                {err('parkingType')}
              </View>
            )}
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
            {has('zoning') && (
              <Field label="Zoning Type">
                <Input
                  placeholder="e.g. Residential, Commercial, Mixed"
                  value={form.zoning}
                  onChangeText={v => set('zoning', v)}
                  maxLength={60}
                />
              </Field>
            )}
            <View style={styles.stack}>
              {has('water') && check('water', 'Water source available')}
              {has('electricity') && check('electricity', 'Electricity connection')}
              {has('fencing') && check('fencing', 'Compound wall/fencing')}
            </View>
          </>
        )}
        {(has('garden') || has('terrace') || has('borewell')) && (
          <View style={styles.stack}>
            {has('garden') && check('garden', 'Garden')}
            {has('terrace') && check('terrace', 'Terrace')}
            {has('borewell') && check('borewell', 'Borewell')}
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
