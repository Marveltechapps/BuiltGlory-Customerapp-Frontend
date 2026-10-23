import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Field, Input } from '../../components/Form';
import { Icon } from '../../components/Icon';
import { SelectField } from '../../components/Interactive';
import { Press } from '../../components/Press';
import { Screen, ScreenFooter, SolidButton } from '../../components/Screen';
import { SellHeader } from '../../components/SellHeader';
import { T } from '../../components/T';
import { propertyTypeById } from '../../config/catalog';
import { useSellFlow } from '../../context/SellFlowContext';
import { useToast } from '../../context/ToastContext';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { palette, tw } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { PillChoice, TypeBanner, useBackgroundDraftSave } from './sellShared';
import { AREA_MIN, PRICE_MIN, TITLE_MIN, sellKind } from './sellCategory';

const BHK: Array<[string, string]> = [
  ['1 BHK', '1'],
  ['2 BHK', '2'],
  ['3 BHK', '3'],
  ['4 BHK', '4'],
  ['5+ BHK', '5+'],
  ['Studio', 'Studio'],
];
const AGES = [
  'Under Construction',
  '0–1 year',
  '1–5 years',
  '5–10 years',
  '10+ years',
];
const SUB_TYPES: Record<string, string[]> = {
  apartment: ['Residential Apartment', 'Builder Floor', 'Penthouse', 'Studio Apartment', 'Service Apartment'],
  villa: ['Independent Villa', 'Row House', 'Twin Villa'],
  commercial: ['Office Space', 'Shop / Showroom', 'Warehouse', 'Co-working'],
  plot: ['Residential Plot', 'Commercial Plot', 'Agricultural'],
  land: ['Agricultural', 'Residential Zone', 'Industrial'],
  fractional: ['Apartment Share', 'Villa Share', 'Commercial Share'],
  interior: ['Full Home', 'Kitchen', 'Living', 'Bedroom', 'Office'],
  nri: ['Apartment', 'Villa', 'Plot'],
  farmhouse: ['Farmhouse', 'Weekend Home'],
  holiday: ['Beach Home', 'Hill Home', 'City Home'],
  'ceo-mansion': ['Mansion', 'Estate'],
  organic: ['Organic Home', 'Eco Villa'],
  '3d-print': ['Printed Home', 'Modular Print'],
};
const SCOPES = ['Full Home', 'Kitchen', 'Living', 'Bedroom', 'Office'];
const digits = (v: string) => v.replace(/[^\d]/g, '');

/** SL-01 Basic details (step 1/7). */
export function SellIntentScreen({ params }: ScreenProps<'sellIntent'>) {
  const nav = useNav();
  const toast = useToast();
  const sell = useSellFlow();
  const saveInBackground = useBackgroundDraftSave();
  const { form, set } = sell;
  const [draftState, setDraftState] = useState<'idle' | 'saving' | 'saved'>(
    'idle',
  );
  const typeLabel = propertyTypeById(params.type)?.label ?? 'Apartment';
  const kind = sellKind(params.type);
  const subs = SUB_TYPES[params.type] ?? [];
  const areaOk = (v: string) => (Number(v) || 0) >= AREA_MIN;

  useEffect(() => {
    if (form.typeId !== params.type) sell.start(params.type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.type]);
  useEffect(() => {
    if (draftState !== 'saved') return;
    const t = setTimeout(() => setDraftState('idle'), 1500);
    return () => clearTimeout(t);
  }, [draftState]);

  const isValid =
    form.title.trim().length >= TITLE_MIN &&
    (kind === 'home'
      ? Boolean(form.bhk) && areaOk(form.builtUp)
      : kind === 'plot'
        ? areaOk(form.plotArea)
        : kind === 'commercial'
          ? areaOk(form.builtUp) || areaOk(form.plotArea)
          : kind === 'fractional'
            ? Number(form.share) >= 0.01 &&
              Number(form.share) <= 100 &&
              (Number(form.totalValue) || 0) >= PRICE_MIN
            : form.scope.trim().length >= 2);
  const saveDraft = async () => {
    setDraftState('saving');
    try {
      await sell.saveDraft(1);
      setDraftState('saved');
    } catch (e) {
      setDraftState('idle');
      toast.show(errorMessage(e), 'error');
    }
  };
  const next = () => {
    if (!isValid) return;
    saveInBackground(1);
    nav.go('sellAddress');
  };

  return (
    <Screen
      footer={
        <ScreenFooter>
          <Press
            onPress={saveDraft}
            disabled={draftState === 'saving'}
            pressScale={1}
            style={styles.draftBtn}
          >
            {draftState === 'saved' && (
              <Icon name="check" size={12} color="#94A3B8" />
            )}
            <T style={styles.draftText}>
              {draftState === 'saved'
                ? 'Draft saved!'
                : draftState === 'saving'
                ? 'Saving draft…'
                : 'Save as Draft'}
            </T>
          </Press>
          <SolidButton
            label="Continue to Address"
            disabled={!isValid}
            onPress={next}
          />
        </ScreenFooter>
      }
      footerSpace={130}
    >
      <SellHeader step={1} title="Basic Details" />
      <View style={styles.body}>
        <TypeBanner label={`${typeLabel} Selected`} onEdit={nav.back} />
        <T style={styles.h2}>Tell Us About Your Property</T>
        <Field
          label="Property Title"
          required
          hint={`${form.title.length}/100 characters${form.title.trim() && form.title.trim().length < TITLE_MIN ? ` · at least ${TITLE_MIN}` : ''}`}
        >
          <Input
            maxLength={100}
            value={form.title}
            onChangeText={v => set('title', v)}
            placeholder="e.g. Bright 3 BHK in Adyar"
          />
        </Field>
        {subs.length > 0 && (
          <Field label="Property Sub-Type">
            <SelectField
              value={form.subType}
              placeholder="Select sub-type"
              options={subs}
              onChange={v => set('subType', v)}
              title="Property Sub-Type"
            />
          </Field>
        )}
        {kind === 'home' && (
          <>
            <Field label="BHK Configuration" required>
              <View style={styles.wrap}>
                {BHK.map(([label, value]) => (
                  <PillChoice key={value} label={label} on={form.bhk === value} onPress={() => set('bhk', value)} />
                ))}
              </View>
            </Field>
            <Field label="Built-up Area (sqft)" required hint={`At least ${AREA_MIN} sqft`}>
              <Input keyboardType="number-pad" value={form.builtUp} onChangeText={v => set('builtUp', digits(v))} placeholder="e.g. 1200" suffix="sqft" />
            </Field>
            <Field label="Carpet Area (sqft)" hint="Usable floor area (optional)">
              <Input keyboardType="number-pad" value={form.carpet} onChangeText={v => set('carpet', digits(v))} placeholder="Enter carpet area" suffix="sqft" />
            </Field>
            <Field label="Floor Number">
              <View style={styles.row}>
                <Input containerStyle={styles.flex} keyboardType="number-pad" value={form.floor} onChangeText={v => set('floor', digits(v))} placeholder="Your floor" />
                <Input containerStyle={styles.flex} keyboardType="number-pad" value={form.totalFloors} onChangeText={v => set('totalFloors', digits(v))} placeholder="Total floors" />
              </View>
            </Field>
            <Field label="Flat / Unit Number" hint="Optional">
              <Input value={form.unitNo} onChangeText={v => set('unitNo', v)} placeholder="e.g. A-204, Tower B" maxLength={40} />
            </Field>
            <Field label="Property Age">
              <View style={styles.wrap}>
                {AGES.map(a => (
                  <PillChoice key={a} compact label={a} on={form.age === a} onPress={() => set('age', a)} />
                ))}
              </View>
            </Field>
          </>
        )}
        {kind === 'plot' && (
          <Field label="Plot Area (sqft)" required hint={`At least ${AREA_MIN} sqft`}>
            <Input keyboardType="number-pad" value={form.plotArea} onChangeText={v => set('plotArea', digits(v))} placeholder="e.g. 2400" suffix="sqft" />
          </Field>
        )}
        {kind === 'commercial' && (
          <>
            <Field label="Built-up Area (sqft)" required hint={`At least ${AREA_MIN} sqft, or enter a plot area`}>
              <Input keyboardType="number-pad" value={form.builtUp} onChangeText={v => set('builtUp', digits(v))} placeholder="e.g. 2000" suffix="sqft" />
            </Field>
            <Field label="Plot Area (sqft)" hint="Use this when the commercial listing is land-led">
              <Input keyboardType="number-pad" value={form.plotArea} onChangeText={v => set('plotArea', digits(v))} placeholder="Optional" suffix="sqft" />
            </Field>
          </>
        )}
        {kind === 'fractional' && (
          <>
            <Field label="Share Percentage" required hint="Between 0.01 and 100">
              <Input keyboardType="decimal-pad" value={form.share} onChangeText={v => set('share', v.replace(/[^\d.]/g, ''))} placeholder="e.g. 10" suffix="%" />
            </Field>
            <Field label="Total Property Value (₹)" required hint={`At least ₹${PRICE_MIN.toLocaleString('en-IN')}`}>
              <Input keyboardType="number-pad" value={form.totalValue} onChangeText={v => set('totalValue', digits(v))} placeholder="e.g. 8500000" />
            </Field>
          </>
        )}
        {kind === 'interior' && (
          <Field label="Scope of Work" required>
            <View style={styles.wrap}>
              {SCOPES.map(s => (
                <PillChoice key={s} label={s} on={form.scope === s} onPress={() => set('scope', s)} />
              ))}
            </View>
          </Field>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: tw('flex-1'),
  body: { ...tw('px-4 mt-4 pb-24'), gap: 16 },
  h2: tw('text-[16px] font-semibold text-ink-900'),
  wrap: tw('flex flex-wrap gap-2'),
  row: tw('flex gap-2'),
  draftBtn: tw('w-full mb-2 flex items-center justify-center gap-1.5'),
  draftText: { ...tw('text-[13px]'), color: palette.ink[400] },
});
