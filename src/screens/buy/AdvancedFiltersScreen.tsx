import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Btn } from '../../components/Btn';
import { Chip } from '../../components/Form';
import { Press } from '../../components/Press';
import { Screen, ScreenFooter } from '../../components/Screen';
import { T } from '../../components/T';
import { PROPERTY_TYPES, SPECS } from '../../config/catalog';
import { useToast } from '../../context/ToastContext';
import type { BuyFilters } from '../../interfaces/BuyFilters';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import type { PropertyType } from '../../types/property';
import { tw } from '../../theme';
import { buzz } from '../../utils/haptics';
import { readJson, STORAGE_KEYS, writeJson } from '../../utils/storage';

type SectionKey =
  | 'type'
  | 'furnishing'
  | 'facing'
  | 'constructionStatus'
  | 'propertyAge'
  | 'postedBy'
  | 'amenities';
type Selection = Record<SectionKey, string[]>;

const SECTIONS: Array<{
  key: Exclude<SectionKey, 'amenities'>;
  title: string;
  options: string[];
  single?: boolean;
}> = [
  {
    key: 'type',
    title: 'Property type',
    options: ['Apartment', 'Villa', 'Plot', 'Commercial', 'Studio'],
    single: true,
  },
  {
    key: 'furnishing',
    title: 'Furnishing',
    options: ['Unfurnished', 'Semi-furnished', 'Fully furnished'],
  },
  {
    key: 'facing',
    title: 'Facing',
    options: ['East', 'West', 'North', 'South', 'NE', 'NW', 'SE', 'SW'],
  },
  {
    key: 'constructionStatus',
    title: 'Construction status',
    options: ['Ready to move', 'Under construction', 'New launch'],
  },
  {
    key: 'propertyAge',
    title: 'Age of property',
    options: ['< 1 yr', '1–5 yr', '5–10 yr', '10+ yr'],
  },
  {
    key: 'postedBy',
    title: 'Posted by',
    options: ['Owner', 'Builder', 'Dealer'],
    single: true,
  },
];
const AMENITIES = SPECS.slice(0, 12);
const TYPE_API: Record<string, PropertyType> = {
  Apartment: 'apartment',
  Villa: 'villa',
  Plot: 'plot',
  Commercial: 'commercial',
};
const STUDIO_SEARCH = 'studio';

const EMPTY: Selection = {
  type: [],
  furnishing: [],
  facing: [],
  constructionStatus: [],
  propertyAge: [],
  postedBy: [],
  amenities: [],
};

function fromFilters(f: BuyFilters): Selection {
  const typeLabel = Object.keys(TYPE_API).find(k => TYPE_API[k] === f.apiType);
  return {
    type: typeLabel
      ? [typeLabel]
      : f.search?.toLowerCase() === STUDIO_SEARCH
      ? ['Studio']
      : [],
    furnishing: f.furnishing ?? [],
    facing: f.facing ?? [],
    constructionStatus: f.constructionStatus ?? [],
    propertyAge: f.propertyAge ?? [],
    postedBy: f.postedBy
      ? [f.postedBy.charAt(0).toUpperCase() + f.postedBy.slice(1)]
      : [],
    amenities: f.amenities ?? [],
  };
}

function toFilters(base: BuyFilters, sel: Selection): BuyFilters {
  const type = sel.type[0];
  const apiType = type ? TYPE_API[type] : undefined;
  const typeOption = apiType
    ? PROPERTY_TYPES.find(t => t.apiType === apiType)
    : undefined;
  // A type picked on B-01 that has no chip here (e.g. 3D Print) stays applied.
  const keepType =
    !type && !Object.values(TYPE_API).includes(base.apiType as PropertyType);
  const next: BuyFilters = {
    ...base,
    apiType: apiType ?? (keepType ? base.apiType : undefined),
    typeId: typeOption?.id ?? (keepType ? base.typeId : undefined),
    furnishing: sel.furnishing,
    facing: sel.facing,
    constructionStatus: sel.constructionStatus,
    propertyAge: sel.propertyAge,
    postedBy: sel.postedBy[0]
      ? (sel.postedBy[0].toLowerCase() as BuyFilters['postedBy'])
      : undefined,
    amenities: sel.amenities,
  };
  if (type === 'Studio') next.search = STUDIO_SEARCH;
  else if (base.search?.toLowerCase() === STUDIO_SEARCH)
    next.search = undefined;
  return next;
}

const isEmpty = (s: Selection) => Object.values(s).every(v => v.length === 0);

/** B-16 Advanced filters. Presets are a device-local convenience (no saved-search endpoint exists). */
export function AdvancedFiltersScreen({
  params,
}: ScreenProps<'advancedFilters'>) {
  const nav = useNav();
  const toast = useToast();
  const [sel, setSel] = useState<Selection>(() => fromFilters(params.filters));
  const touched = useRef(false);

  // Start from the saved preset when the current search has no advanced filters yet.
  useEffect(() => {
    if (!isEmpty(fromFilters(params.filters))) return;
    readJson<Selection | null>(STORAGE_KEYS.filterPreset, null).then(preset => {
      if (preset && !touched.current) setSel({ ...EMPTY, ...preset });
    });
  }, [params.filters]);

  const toggle = (key: SectionKey, option: string, single?: boolean) => {
    touched.current = true;
    buzz();
    setSel(prev => {
      const has = prev[key].includes(option);
      const values = single
        ? has
          ? []
          : [option]
        : has
        ? prev[key].filter(v => v !== option)
        : [...prev[key], option];
      return { ...prev, [key]: values };
    });
  };
  const reset = () => {
    touched.current = true;
    buzz();
    setSel(EMPTY);
    toast.show('Filters cleared');
  };
  const savePreset = async () => {
    try {
      await writeJson(STORAGE_KEYS.filterPreset, sel);
      toast.show('Preset saved');
    } catch {
      toast.show('Could not save the preset', 'error');
    }
  };
  const count = useMemo(
    () => Object.values(sel).reduce((n, v) => n + v.length, 0),
    [sel],
  );
  const apply = () =>
    nav.popTo('buyList', { filters: toFilters(params.filters, sel) });

  return (
    <Screen
      topBar={{
        title: 'Advanced filters',
        back: true,
        right: (
          <Press onPress={reset}>
            <T style={styles.reset}>Reset</T>
          </Press>
        ),
      }}
      footer={
        <ScreenFooter style={styles.footer}>
          <Btn variant="outline" style={styles.flex} onPress={savePreset}>
            Save preset
          </Btn>
          <Btn style={styles.flex} onPress={apply}>
            {`Apply (${count})`}
          </Btn>
        </ScreenFooter>
      }
    >
      <View style={styles.body}>
        {SECTIONS.map(sec => (
          <View key={sec.key}>
            <T style={styles.h3}>{sec.title}</T>
            <View style={styles.wrap}>
              {sec.options.map(o => (
                <Chip
                  key={o}
                  active={sel[sec.key].includes(o)}
                  onPress={() => toggle(sec.key, o, sec.single)}
                >
                  {o}
                </Chip>
              ))}
            </View>
          </View>
        ))}
        <View>
          <T style={styles.h3}>Amenities</T>
          <View style={styles.wrap}>
            {AMENITIES.map(s => (
              <Chip
                key={s.label}
                icon={s.icon}
                active={sel.amenities.includes(s.label)}
                onPress={() => toggle('amenities', s.label)}
              >
                {s.label}
              </Chip>
            ))}
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  reset: tw('text-brand-600 text-sm font-bold'),
  body: { ...tw('px-4 pb-20'), gap: 20 },
  h3: tw('text-[13px] font-semibold mb-2'),
  wrap: tw('flex flex-wrap gap-2'),
  footer: tw('flex gap-2'),
  flex: tw('flex-1'),
});
