import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from '../../components/Icon';
import { Grid } from '../../components/Layout';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { Press } from '../../components/Press';
import { Screen } from '../../components/Screen';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { T } from '../../components/T';
import type { PropertyView } from '../../interfaces/PropertyView';
import { useResource } from '../../lib/useResource';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { listProperties } from '../../services/property.service';
import { palette, tw } from '../../theme';
import { formatINR, groupIN } from '../../utils/format';
import { toPropertyView } from '../../utils/property';

/** Closest alternative: same type first, any other listing otherwise (GET /properties). */
async function findAlternative(
  a: PropertyView,
  signal: AbortSignal,
): Promise<PropertyView | null> {
  const same = await listProperties(
    { type: a.type, limit: 10, sort: 'newest' },
    signal,
  );
  const pick = same.data.find(x => x._id !== a.id);
  if (pick) return toPropertyView(pick);
  const any = await listProperties({ limit: 10, sort: 'newest' }, signal);
  const other = any.data.find(x => x._id !== a.id);
  return other ? toPropertyView(other) : null;
}

type CellValue = string | boolean;

/** B-15 Side-by-side comparison. */
export function CompareScreen({ params }: ScreenProps<'compare'>) {
  const nav = useNav();
  const a = params.property;
  const alt = useResource(signal => findAlternative(a, signal), [a.id]);
  const b = alt.data;

  const rows: Array<[string, CellValue, CellValue]> = b
    ? [
        ['Price', formatINR(a.price), formatINR(b.price)],
        ['BHK', a.bhk ? String(a.bhk) : '—', b.bhk ? String(b.bhk) : '—'],
        [
          'Area',
          a.area ? `${a.area} sqft` : '—',
          b.area ? `${b.area} sqft` : '—',
        ],
        ['Floor', a.floor ?? '—', b.floor ?? '—'],
        [
          'Rate',
          a.pricePerSqft ? `₹${groupIN(a.pricePerSqft)}/sqft` : '—',
          b.pricePerSqft ? `₹${groupIN(b.pricePerSqft)}/sqft` : '—',
        ],
        ['Verified', a.verified, b.verified],
        ['Negotiable', a.negotiable, b.negotiable],
        ['Facing', a.facing ?? '—', b.facing ?? '—'],
      ]
    : [];

  const cell = (v: CellValue) =>
    typeof v === 'boolean' ? (
      <Icon
        name={v ? 'check' : 'x'}
        size={14}
        color={v ? '#10B981' : '#94A3B8'}
      />
    ) : (
      <T style={styles.val}>{v}</T>
    );

  return (
    <Screen topBar={{ title: 'Compare properties', back: true }}>
      <View style={styles.body}>
        {alt.loading ? (
          <LoadingState label="Finding a similar property…" />
        ) : alt.error ? (
          <ErrorState message={alt.error} onRetry={alt.reload} />
        ) : !b ? (
          <EmptyState
            icon="git-compare"
            title="Nothing to compare yet"
            body="There are no other listings to compare this property with right now."
          />
        ) : (
          <>
            <Grid cols={2} gap={8} style={styles.mb4}>
              {[a, b].map(p => (
                <Press
                  key={p.id}
                  pressScale={0.98}
                  onPress={() =>
                    p.id !== a.id &&
                    nav.go('propertyDetail', { id: p.id, property: p })
                  }
                  style={styles.head}
                >
                  <PhotoPlaceholder tag={p.id} src={p.images[0]} height={90} />
                  <View style={styles.headText}>
                    <T style={styles.headTitle} numberOfLines={1}>
                      {p.title}
                    </T>
                    <T style={styles.headPlace} numberOfLines={1}>
                      {p.location}
                    </T>
                  </View>
                </Press>
              ))}
            </Grid>
            <View style={styles.table}>
              {rows.map(([k, va, vb], i) => (
                <View
                  key={k}
                  style={[styles.row, i % 2 === 1 && styles.rowAlt]}
                >
                  <T style={styles.key}>{k}</T>
                  <View style={styles.cell}>{cell(va)}</View>
                  <View style={styles.cell}>{cell(vb)}</View>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: tw('px-4'),
  mb4: tw('mb-4'),
  head: tw('rounded-card border border-ink-200 overflow-hidden bg-white'),
  headText: tw('p-2'),
  headTitle: tw('text-[11px] font-semibold'),
  headPlace: tw('text-[10px] text-ink-500'),
  table: tw('rounded-card border border-ink-200 overflow-hidden'),
  row: { flexDirection: 'row' },
  rowAlt: { backgroundColor: palette.ink[50] },
  key: { ...tw('px-3 py-2.5 text-[11px] text-ink-500 font-medium'), width: 80 },
  cell: tw('flex-1 px-2 py-2.5 border-l border-ink-200 flex items-center'),
  val: tw('text-[12px] font-semibold'),
});
