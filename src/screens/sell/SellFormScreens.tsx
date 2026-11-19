import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusHero } from '../../components/hero/StatusHero';
import { Icon } from '../../components/icons/Icon';
import { SellHeader } from '../../components/journey/SellParts';
import { Grid } from '../../components/layout/Grid';
import { BottomBar, Screen } from '../../components/layout/Screen';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { Btn } from '../../components/ui/Btn';
import { Field, Input } from '../../components/ui/Field';
import { Press } from '../../components/ui/Press';
import { SolidBtn } from '../../components/ui/SolidBtn';
import { T } from '../../components/ui/T';
import { Toggle } from '../../components/ui/Toggle';
import { SPECS } from '../../config/sampleData';
import { useAuth } from '../../context/AuthContext';
import { jUpsertListing } from '../../context/journeyStore';
import { getSD, sdReset, sdSet } from '../../context/sellStore';
import type { Ctx, ScreenName, ScreenProps } from '../../navigation/types';
import * as documents from '../../services/documents.service';
import * as meService from '../../services/me.service';
import * as sellRequests from '../../services/sellRequests.service';
import { colors, elev } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { formatINR } from '../../utils/format';
import { pickSingleImage } from '../../utils/pickImage';
import { buildSellWizardPayload, listingRecordFromSellRequest } from '../../utils/sellApi';

/** Native-looking checkbox (the design's unstyled <input type="checkbox">). */
function CheckBox({ on, size = 20 }: { on: boolean; size?: number }) {
  return (
    <View style={[styles.cb, { width: size, height: size }, on ? styles.cbOn : styles.cbOff]}>
      {on && <Icon name="check" size={size - 6} color="white" strokeWidth={3} />}
    </View>
  );
}

/** Carry sell-flow data through SL-04 → SL-07 (the design's carry()). */
function useCarry(props: ScreenProps, saveKey?: string): ScreenProps {
  const go = (k: ScreenName, c: Ctx = {}) => {
    if (saveKey && c[saveKey] !== undefined) sdSet({ [saveKey]: c[saveKey] });
    props.go(k, { ...props.ctx, ...c });
  };
  return { ...props, ctx: { ...getSD(), ...props.ctx }, go };
}

const TYPE_CONFIGS: Record<string, { label: string; fields: string[] }> = {
  apartment: { label: 'Apartment', fields: ['title', 'ownership', 'bhk', 'builtUp', 'carpetArea', 'floor', 'totalFloors', 'facing', 'age', 'furnish', 'parking'] },
  plot: { label: 'Plot', fields: ['title', 'ownership', 'area', 'facing', 'roadAccess', 'zoning', 'water', 'electricity', 'fencing'] },
  villa: { label: 'Villa', fields: ['title', 'ownership', 'bhk', 'landArea', 'builtUp', 'floor', 'facing', 'age', 'furnish', 'parking', 'garden', 'terrace', 'borewell'] },
  land: { label: 'Land', fields: ['title', 'ownership', 'area', 'facing', 'roadAccess', 'water', 'electricity', 'zoning'] },
  commercial: { label: 'Commercial', fields: ['title', 'ownership', 'builtUp', 'floor', 'parking', 'facing', 'age'] },
};

function Opt({ on, label, onPress, size = 12, bold, style }: { on: boolean; label: string; onPress: () => void; size?: number; bold?: boolean; style?: object }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.opt, on ? styles.optOn : pressed ? styles.optHover : styles.optOff, style]}>
      <T s={size} w={on && bold ? 600 : 500} c={on ? colors.brand700 : colors.ink900} align="center">{label}</T>
    </Pressable>
  );
}

function Pill({ on, label, onPress }: { on: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.pill, { backgroundColor: on ? colors.brand600 : pressed ? colors.ink200 : colors.ink100 }]}>
      <T s={12} w={500} c={on ? colors.white : colors.ink700}>{label}</T>
    </Pressable>
  );
}

/** SL-04 Property details (fields depend on the property type) */
export function SellDetailsScreen(raw: ScreenProps) {
  const { go, back, ctx } = useCarry(raw, 'details');
  const type = String(ctx?.type || 'apartment').toLowerCase().trim();
  const [data, setData] = useState<Record<string, string | number | boolean>>({
    title: '', ownership: 'Freehold', facing: 'East', age: '', furnish: 'Unfurnished',
    bhk: '', builtUp: '', carpetArea: '', floor: '', totalFloors: '', parking: 1,
    area: '', zoning: '', roadAccess: '', water: false, electricity: false, fencing: false,
    landArea: '', garden: false, terrace: false, borewell: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const config = TYPE_CONFIGS[type] || TYPE_CONFIGS.apartment;
  const has = (f: string) => config.fields.includes(f);
  const set = (k: string, v: string | number | boolean) => { setData(d => ({ ...d, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };
  const requiredKeys = () => {
    const req = ['title', 'ownership'];
    if (has('bhk')) req.push('bhk');
    if (has('builtUp')) req.push('builtUp');
    else if (has('area')) req.push('area');
    if (has('age')) req.push('age');
    return req;
  };
  const handleContinue = () => {
    const missing: Record<string, string> = {};
    requiredKeys().forEach(k => { if (!String(data[k] ?? '').trim()) missing[k] = 'Required'; });
    if (Object.keys(missing).length) { setErrors(missing); return; }
    go('sellAmenities', { details: data, type });
  };
  const err = (k: string) => (errors[k] ? <T s={11} c={colors.rose600} style={styles.mt4}>{errors[k]}</T> : null);
  const s = (k: string) => String(data[k] ?? '');
  return (
    <Screen footer={<BottomBar><SolidBtn onPress={handleContinue}>Continue to Amenities</SolidBtn></BottomBar>}>
      <SellHeader step={4} totalSteps={7} back={back} title="Property Details" />
      <View style={styles.form}>
        <View style={styles.typeChip}>
          <T s={13} w={500} c={colors.brand600}>{config.label}</T>
          <Pressable onPress={back} style={styles.p4} accessibilityLabel="Change type"><Icon name="edit-2" size={14} color="#1A6FFF" /></Pressable>
        </View>
        <T display s={16} w={600}>Property Details</T>
        <View>
          <Field label="Property Title" required><Input placeholder="e.g. Bright 3 BHK in Adyar" value={s('title')} onChangeText={v => set('title', v)} /></Field>
          {err('title')}
        </View>
        {has('bhk') && (
          <View>
            <Field label="BHK" required>
              <View style={styles.wrap}>{['1', '2', '3', '4', '5+'].map(b => <Pill key={b} on={data.bhk === b} label={b} onPress={() => set('bhk', b)} />)}</View>
            </Field>
            {err('bhk')}
          </View>
        )}
        {has('builtUp') && (
          <View>
            <Field label="Built-up Area (sqft)" required><Input keyboardType="number-pad" placeholder="e.g. 1200" value={s('builtUp')} onChangeText={v => set('builtUp', v)} /></Field>
            {err('builtUp')}
          </View>
        )}
        {(has('carpetArea') || has('floor')) && (
          <>
            <Field label="Carpet Area (sqft)"><Input keyboardType="number-pad" placeholder="Usable floor area (optional)" value={s('carpetArea')} onChangeText={v => set('carpetArea', v)} /></Field>
            <Grid cols={2} gap={12}>
              <Field label="Your Floor"><Input keyboardType="number-pad" placeholder="e.g. 5" value={s('floor')} onChangeText={v => set('floor', v)} /></Field>
              <Field label="Total Floors"><Input keyboardType="number-pad" placeholder="e.g. 10" value={s('totalFloors')} onChangeText={v => set('totalFloors', v)} /></Field>
            </Grid>
          </>
        )}
        {has('area') && (
          <View>
            <Field label="Plot Area (sqft)" required><Input keyboardType="number-pad" placeholder="e.g. 2400" value={s('area')} onChangeText={v => set('area', v)} /></Field>
            {err('area')}
          </View>
        )}
        {has('landArea') && (
          <Field label="Land Area (sqft)"><Input keyboardType="number-pad" placeholder="Total land area" value={s('landArea')} onChangeText={v => set('landArea', v)} /></Field>
        )}
        <Field label="Facing Direction" required>
          <Grid cols={4} gap={8}>{['North', 'South', 'East', 'West'].map(f => <Opt key={f} on={data.facing === f} label={f} onPress={() => set('facing', f)} />)}</Grid>
        </Field>
        <Field label="Ownership Type" required>
          <Grid cols={2} gap={8}>{['Freehold', 'Leasehold', 'Co-op', 'Power of Attorney'].map(o => <Opt key={o} on={data.ownership === o} label={o} bold onPress={() => set('ownership', o)} />)}</Grid>
        </Field>
        {(has('age') || has('furnish')) && (
          <>
            <Field label="Property Age" required hint="Years since construction was completed (occupancy certificate date)">
              <Grid cols={3} gap={8}>
                {['Under construction', 'Less than 1 year', '1 – 5 years', '5 – 10 years', '10 – 20 years', 'Above 20 years'].map(a => (
                  <Press key={a} onPress={() => set('age', a)} accessibilityState={{ selected: data.age === a }} style={[styles.age, data.age === a ? styles.optOn : styles.ageOff]}>
                    <T s={12} w={600} lh={1.25} align="center" c={data.age === a ? colors.brand700 : colors.ink700}>{a}</T>
                  </Press>
                ))}
              </Grid>
            </Field>
            {err('age')}
            <Field label="Furnishing Status">
              <Grid cols={3} gap={8}>{['Unfurnished', 'Semi-Furnished', 'Furnished'].map(f => <Opt key={f} on={data.furnish === f} label={f} size={11} onPress={() => set('furnish', f)} />)}</Grid>
            </Field>
            <Field label="Parking Spaces">
              <View style={styles.stepper}>
                <Pressable onPress={() => set('parking', Math.max(0, Number(data.parking) - 1))} style={styles.stepBtn} accessibilityLabel="Fewer"><Icon name="minus" size={14} /></Pressable>
                <T s={16} w={700} align="center" style={styles.w32}>{String(data.parking)}</T>
                <Pressable onPress={() => set('parking', Number(data.parking) + 1)} style={styles.stepBtn} accessibilityLabel="More"><Icon name="plus" size={14} /></Pressable>
              </View>
            </Field>
          </>
        )}
        {has('roadAccess') && (
          <>
            <Field label="Road Access">
              <View style={styles.gap8}>
                {['Via main road', 'Via internal road', 'Via approach road'].map(r => (
                  <Pressable key={r} onPress={() => set('roadAccess', r)} style={[styles.road, data.roadAccess === r ? styles.optOn : styles.optOff]}>
                    <T s={16}>{r}</T>
                  </Pressable>
                ))}
              </View>
            </Field>
            <Field label="Zoning Type"><Input placeholder="e.g. Residential, Commercial, Mixed" value={s('zoning')} onChangeText={v => set('zoning', v)} /></Field>
            <View style={styles.gap8}>
              {([['water', 'Water source available'], ['electricity', 'Electricity connection'], ['fencing', 'Compound wall/fencing']] as [string, string][]).map(([k, l]) => (
                <Pressable key={k} onPress={() => set(k, !data[k])} style={styles.checkRow} accessibilityRole="checkbox" accessibilityState={{ checked: !!data[k] }}>
                  <CheckBox on={!!data[k]} />
                  <T s={13} w={500}>{l}</T>
                </Pressable>
              ))}
            </View>
          </>
        )}
        {has('garden') && (
          <View style={styles.gap8}>
            {([['garden', 'Garden'], ['terrace', 'Terrace'], ['borewell', 'Borewell']] as [string, string][]).map(([k, l]) => (
              <Pressable key={k} onPress={() => set(k, !data[k])} style={styles.checkRow} accessibilityRole="checkbox" accessibilityState={{ checked: !!data[k] }}>
                <CheckBox on={!!data[k]} />
                <T s={13} w={500}>{l}</T>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

const EXTRA = ['Modular Kitchen', 'Marble flooring', 'Wooden flooring', 'AC', 'RO water', 'Geyser', 'Wardrobes', 'Balcony'];

/** SL-05 Amenities */
export function SellAmenitiesScreen(raw: ScreenProps) {
  const { go, back } = useCarry(raw, 'amenities');
  const SD = getSD();
  const initial = Array.isArray(SD.amenities) ? SD.amenities as string[] : ['Lift', 'Parking', 'Power Backup', 'Security'];
  const [sel, setSel] = useState<Set<string>>(new Set(initial));
  const toggle = (l: string) => { const s = new Set(sel); if (s.has(l)) s.delete(l); else s.add(l); setSel(s); };
  const all = [...SPECS, ...EXTRA.map(l => ({ label: l, icon: 'sparkles' }))];
  return (
    <Screen footer={<BottomBar><SolidBtn onPress={() => go('sellPhotos', { amenities: [...sel] })}>Continue to Photos</SolidBtn></BottomBar>}>
      <SellHeader step={5} back={back} title="Amenities" />
      <View style={styles.list}>
        <T s={12} c={colors.ink500} style={styles.mb12}>Selected <T w={700} c={colors.emerald700}>{sel.size}</T> of {all.length}</T>
        <Grid cols={3} gap={8}>
          {all.map(a => {
            const on = sel.has(a.label);
            return (
              <Pressable key={a.label} onPress={() => toggle(a.label)} style={({ pressed }) => [styles.amenity, on ? styles.amenityOn : pressed ? { borderColor: colors.emerald200 } : styles.optOff]}>
                <Icon name={a.icon} size={18} color={on ? '#059669' : '#94A3B8'} />
                <T s={10} w={500} lh={1.25} align="center">{a.label}</T>
                {on && <View style={styles.amenityCheck}><Icon name="check-circle" size={12} color="#059669" /></View>}
              </Pressable>
            );
          })}
        </Grid>
      </View>
    </Screen>
  );
}

const TIPS = ['Shoot in daylight with windows open', 'Wide-angle covers more of each room', 'Tidy clutter before each shot'];

/** SL-06 Photo upload — real URLs only (documents.upload). No fake photo URLs. */
export function SellPhotosScreen(raw: ScreenProps) {
  const { go, back } = useCarry(raw, 'photos');
  const { user } = useAuth();
  const SD = getSD();
  const [photos, setPhotos] = useState<string[]>(Array.isArray(SD.photos) ? SD.photos as string[] : []);
  const [hint, setHint] = useState('');
  const [uploading, setUploading] = useState(false);
  const MIN = 5;

  const uploadUri = async (uri: string, name?: string, type?: string) => {
    const sellRequestId = String(SD.sellRequestId || SD.draftId || '');
    if (!sellRequestId) {
      setHint('Save a draft first so photos can be attached to your listing.');
      return;
    }
    setUploading(true);
    setHint('');
    try {
      const doc = await documents.uploadDocument(
        { uri, name: name || uri.split('/').pop() || `photo-${Date.now()}.jpg`, type: type || 'image/jpeg' },
        {
          ownerType: 'sell_request',
          ownerId: sellRequestId,
          purpose: 'property_media',
          documentType: 'property_photo',
        },
      );
      if (!doc.url) {
        setHint('Upload succeeded but no public URL was returned.');
        return;
      }
      const next = [...photos, doc.url];
      setPhotos(next);
      sdSet({ photos: next });
    } catch (err) {
      setHint(errorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const onAdd = async () => {
    void user;
    try {
      const picked = await pickSingleImage();
      if (!picked) return;
      await uploadUri(picked.uri, picked.name, picked.type);
    } catch (err) {
      setHint(errorMessage(err));
    }
  };

  const tiles = [...photos.map((url, i) => ({ kind: 'photo' as const, i, url })), { kind: 'add' as const, i: -1, url: '' }];
  return (
    <Screen footer={<BottomBar><SolidBtn onPress={() => { sdSet({ photos }); go('sellPrice', { photos }); }}>{photos.length >= MIN ? `Continue (${photos.length} photos)` : `Continue · ${photos.length}/${MIN} photos`}</SolidBtn></BottomBar>}>
      <SellHeader step={6} back={back} title="Add Photos" />
      <View style={styles.list}>
        <T s={12} c={colors.ink500} style={styles.mb12}>Add at least {MIN} photos. The first one is your cover. Only uploaded URLs are stored.</T>
        <Grid cols={3} gap={8} style={styles.mb16}>
          {tiles.map((t, idx) => t.kind === 'photo' ? (
            <View key={'p' + idx} style={styles.square}>
              <PhotoPlaceholder tag={t.url || ('sell-' + idx)} src={t.url} style={[StyleSheet.absoluteFill, styles.r14]} />
              {idx === 0 && <View style={styles.cover}><T s={9} w={700} c="#FFFFFF">COVER</T></View>}
              <Pressable onPress={() => { const next = photos.filter((_, j) => j !== idx); setPhotos(next); sdSet({ photos: next }); }} style={styles.remove} accessibilityLabel="Remove photo"><Icon name="x" size={12} color="white" /></Pressable>
            </View>
          ) : (
            <Pressable key="add" onPress={onAdd} disabled={uploading} style={({ pressed }) => [styles.square, styles.add, pressed && { borderColor: colors.emerald400, backgroundColor: colors.emerald50 }]} accessibilityLabel="Add photo">
              <Icon name="plus" size={22} color="#94A3B8" />
              <T s={10} c={colors.ink500} style={styles.mt2}>{uploading ? 'Uploading…' : 'Add'}</T>
            </Pressable>
          ))}
        </Grid>
        <View style={styles.info}>
          <Icon name="info" size={14} color="#64748B" />
          <T s={12} c={colors.ink700}>{photos.length}/{MIN} required photos</T>
        </View>
        {hint ? <T s={12} c={colors.amber800} style={styles.mb12}>{hint}</T> : null}
        <T display s={13} w={600} style={styles.mb8}>Tips for great photos</T>
        {TIPS.map(t => (
          <View key={t} style={styles.tip}>
            <Icon name="check" size={14} color="#10B981" />
            <T s={12} c={colors.ink700} style={styles.flex1}>{t}</T>
          </View>
        ))}
      </View>
    </Screen>
  );
}

/** SL-07 Expected price; submitting creates / submits the listing via API. */
export function SellPriceScreen(props: ScreenProps) {
  const { back } = props;
  const { user, refreshProfile } = useAuth();
  const SD = getSD();
  const [price, setPrice] = useState(SD.price?.price ? String(SD.price.price) : '');
  const [negotiable, setNegotiable] = useState(SD.price?.negotiable !== false);
  const [estimate, setEstimate] = useState<{ low: number; high: number; pricePerSqft?: number; basis?: string; area?: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    const amount = Number(price);
    if (!amount || Number.isNaN(amount)) {
      setEstimate(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        let sellRequestId = String(getSD().sellRequestId || getSD().draftId || '');
        const payload = buildSellWizardPayload(getSD(), {
          askingPrice: amount,
          negotiable,
          draftStep: 7,
          photos: Array.isArray(getSD().photos) ? getSD().photos as string[] : [],
        });
        if (!sellRequestId) {
          const draft = await sellRequests.createDraft(payload);
          sellRequestId = draft._id;
          sdSet({ sellRequestId, draftId: sellRequestId });
        } else {
          await sellRequests.patchSellRequest(sellRequestId, payload);
        }
        const val = await sellRequests.valuationEstimate(sellRequestId, payload);
        if (!cancelled) {
          setEstimate({
            low: val.low,
            high: val.high,
            pricePerSqft: val.pricePerSqft,
            basis: val.basis,
            area: val.area,
          });
        }
      } catch {
        if (!cancelled) setEstimate(null);
      }
    })();
    return () => { cancelled = true; };
  }, [price, negotiable]);

  const submit = async () => {
    if (!price || busy) return;
    setBusy(true);
    setErr('');
    try {
      sdSet({ price: { price: Number(price), negotiable } });
      const payload = buildSellWizardPayload(getSD(), {
        askingPrice: Number(price),
        negotiable,
        draftStep: 7,
        photos: Array.isArray(getSD().photos) ? (getSD().photos as string[]) : [],
      });
      let sellRequestId = String(getSD().sellRequestId || getSD().draftId || '');
      if (!sellRequestId) {
        const created = await sellRequests.createDraft(payload);
        sellRequestId = created._id;
      } else {
        await sellRequests.patchSellRequest(sellRequestId, payload);
      }
      const submitted = await sellRequests.submitSellRequest(sellRequestId);
      if (user?.role === 'buyer') {
        try {
          await meService.patchMe({ role: 'both' });
          await refreshProfile();
        } catch {
          // Non-blocking — listing already submitted.
        }
      }
      const rec = listingRecordFromSellRequest(submitted);
      jUpsertListing(rec);
      sdReset();
      props.go('sellSuccess', { lid: rec.id, sellRequestId: rec.id, referenceId: submitted.referenceId });
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const area = estimate?.area || Number(getSD().details?.builtUp || getSD().details?.area || 0) || 0;
  return (
    <Screen footer={<BottomBar><SolidBtn onPress={submit} disabled={!price || busy}>{busy ? 'Submitting…' : 'Submit Listing'}</SolidBtn></BottomBar>}>
      <SellHeader step={7} totalSteps={7} back={back} title="Expected Price" />
      <View style={styles.form}>
        <T display s={16} w={600}>Set your asking price</T>
        <Field label="Expected Price (₹)" required>
          <Input prefix="₹" keyboardType="number-pad" placeholder="e.g. 8500000" value={price} onChangeText={setPrice} />
        </Field>
        {err ? <T s={12} c={colors.rose600}>{err}</T> : null}
        {estimate && (
          <>
            <View style={styles.perSqft}>
              <T s={12} c={colors.brand700} style={styles.mb4}>Price per sqft</T>
              <T s={20} w={700} c={colors.brand600}>₹ {estimate.pricePerSqft || (area ? Math.round(Number(price) / area) : '—')}</T>
            </View>
            <View style={styles.estimate}>
              <View style={styles.estHead}>
                <Icon name="trending-up" size={16} color="#1A6FFF" />
                <T s={13} w={600}>Market estimate</T>
              </View>
              <T s={12} c={colors.ink600} lh={1.625}>{estimate.basis || 'Based on comparable listings near this locality.'}</T>
              <View style={styles.range}>
                <View style={styles.flex1}><T s={10} c={colors.ink500} align="center">Low</T><T s={16} w={700} align="center">₹ {formatINR(estimate.low)}</T></View>
                <T s={12} c={colors.ink400}>—</T>
                <View style={styles.flex1}><T s={10} c={colors.ink500} align="center">High</T><T s={16} w={700} align="center">₹ {formatINR(estimate.high)}</T></View>
              </View>
              <T s={11} c={colors.ink500} align="center" style={styles.italic}>Informational only · final offer from Builtglory based on verification</T>
            </View>
          </>
        )}
        <View style={styles.negotiable}>
          <View>
            <T s={14} w={600}>Price negotiable?</T>
            <T s={11} c={colors.ink500}>Buyers can request a quote</T>
          </View>
          <Toggle on={negotiable} onChange={setNegotiable} accessibilityLabel="Price negotiable" />
        </View>
      </View>
    </Screen>
  );
}

const NEXT = [
  { num: '1', title: 'Document Review', desc: '12-24 hours' },
  { num: '2', title: 'Site Inspection', desc: '2-3 days' },
  { num: '3', title: 'Legal Verification', desc: '3-5 days' },
  { num: '4', title: 'Offer from Builtglory', desc: 'After verification' },
];

/** SL-08 Listing submitted */
export function SellSuccessScreen({ go, ctx }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={StyleSheet.absoluteFill}>
      <Screen fill>
        <View style={styles.center}>
          <View style={styles.inner}>
            <StatusHero icon="party-popper" tone="success" />
            <T display s={22} w={700} align="center">Your property has been submitted</T>
            <T s={13} c={colors.ink500} lh={1.625} align="center" style={styles.sub}>Builtglory team will review within 48 hours. You'll receive updates on your progress.</T>
            <View style={styles.steps}>
              <T s={12} w={600} upper ls={0.05} c={colors.ink500}>4 next steps</T>
              {NEXT.map(s => (
                <View key={s.num} style={styles.stepRow}>
                  <View style={styles.stepNum}><T s={12} w={700} c={colors.brand600}>{s.num}</T></View>
                  <View>
                    <T s={13} w={600}>{s.title}</T>
                    <T s={11} c={colors.ink500}>{s.desc}</T>
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.actions}>
              <Btn variant="outline" flex onPress={() => go('home')}>Home</Btn>
              <Btn flex onPress={() => go('myListings', { tab: 'active' })}>My Listings</Btn>
            </View>
          </View>
        </View>
      </Screen>
      {ctx?.lid ? (
        <Press onPress={() => go('listingDetail', { lid: ctx.lid })} style={[styles.track, { top: insets.top + 12 }]}>
          <Icon name="list-checks" size={14} color="#1A6FFF" />
          <T s={12} w={700} c={colors.brand700}>Track listing</T>
        </Press>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  mt2: { marginTop: 2 },
  mt4: { marginTop: 4 },
  mb4: { marginBottom: 4 },
  mb8: { marginBottom: 8 },
  mb12: { marginBottom: 12 },
  mb16: { marginBottom: 16 },
  p4: { padding: 4 },
  gap8: { gap: 8 },
  w32: { width: 32 },
  r14: { borderRadius: 14 },
  italic: { marginTop: 8, fontStyle: 'italic' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  form: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 96, gap: 16 },
  list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 96 },
  typeChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.brand50, borderRadius: 9999, paddingHorizontal: 16, paddingVertical: 10 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999 },
  opt: { paddingVertical: 8, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  optOn: { borderColor: colors.brand600, backgroundColor: colors.brand50 },
  optOff: { borderColor: colors.ink200 },
  optHover: { borderColor: colors.brand300 },
  age: { minHeight: 44, paddingHorizontal: 8, paddingVertical: 8, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  ageOff: { borderColor: colors.ink200, backgroundColor: colors.white },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: colors.ink50, borderRadius: 14 },
  stepBtn: { width: 32, height: 32, borderRadius: 4, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.ink200, alignItems: 'center', justifyContent: 'center' },
  road: { width: '100%', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: colors.ink50, borderRadius: 14 },
  cb: { borderRadius: 3, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cbOn: { backgroundColor: '#0075FF', borderColor: '#0075FF' },
  cbOff: { borderColor: '#767676', backgroundColor: colors.white },
  amenity: { padding: 10, borderRadius: 14, borderWidth: 1, alignItems: 'center', gap: 6 },
  amenityOn: { borderColor: colors.emerald500, backgroundColor: colors.emerald50 },
  amenityCheck: { position: 'absolute', top: 6, right: 6 },
  square: { aspectRatio: 1, borderRadius: 14 },
  cover: { position: 'absolute', top: 4, left: 4, backgroundColor: colors.emerald600, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  remove: { position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: 9999, backgroundColor: colors.rose500, alignItems: 'center', justifyContent: 'center' },
  add: { borderWidth: 2, borderStyle: 'dashed', borderColor: colors.ink300, alignItems: 'center', justifyContent: 'center' },
  info: { padding: 12, backgroundColor: colors.ink50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  tip: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  perSqft: { padding: 12, backgroundColor: colors.brand50, borderRadius: 14 },
  estimate: { borderRadius: 14, borderWidth: 1, borderColor: colors.ink200, padding: 16 },
  estHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  range: { marginTop: 8, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'space-between' },
  negotiable: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.ink200 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  inner: { width: '100%', alignItems: 'center' },
  sub: { marginTop: 8, maxWidth: 280 },
  steps: { marginTop: 24, alignSelf: 'stretch', borderRadius: 14, borderWidth: 1, borderColor: colors.ink200, padding: 16, gap: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNum: { width: 28, height: 28, borderRadius: 9999, backgroundColor: colors.brand100, alignItems: 'center', justifyContent: 'center' },
  actions: { marginTop: 24, flexDirection: 'row', gap: 8, alignSelf: 'stretch' },
  track: { position: 'absolute', right: 16, zIndex: 30, height: 36, paddingHorizontal: 14, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.72)', boxShadow: elev.e2, flexDirection: 'row', alignItems: 'center', gap: 6 },
});
