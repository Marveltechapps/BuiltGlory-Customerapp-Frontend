import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { palette, tw, twh } from '../theme';
import { Icon, type IconName } from './Icon';
import { Press } from './Press';
import { T } from './T';

/** Equal-width columns (CSS `grid grid-cols-N gap-x`). */
export function Grid({
  cols,
  gap = 8,
  rowGap,
  children,
  style,
}: {
  cols: number;
  gap?: number;
  rowGap?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const items = React.Children.toArray(children).filter(Boolean);
  const rows: React.ReactNode[][] = [];
  for (let i = 0; i < items.length; i += cols)
    rows.push(items.slice(i, i + cols));
  return (
    <View style={[{ gap: rowGap ?? gap }, style]}>
      {rows.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row', gap }}>
          {row.map((cell, c) => (
            <View key={c} style={{ flex: 1, minWidth: 0 }}>
              {cell}
            </View>
          ))}
          {Array.from({ length: cols - row.length }).map((_, k) => (
            <View key={`f${k}`} style={{ flex: 1 }} />
          ))}
        </View>
      ))}
    </View>
  );
}

/** Children separated by hairlines (`divide-y divide-ink-100`). */
export function Divided({
  children,
  color = palette.ink[100],
  style,
  horizontal,
}: {
  children: React.ReactNode;
  color?: string;
  style?: StyleProp<ViewStyle>;
  horizontal?: boolean;
}) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[horizontal && { flexDirection: 'row' }, style]}>
      {items.map((child, i) => (
        <View
          key={i}
          style={[
            horizontal ? { flex: 1 } : null,
            i < items.length - 1 &&
              (horizontal
                ? { borderRightWidth: 1, borderRightColor: color }
                : { borderBottomWidth: 1, borderBottomColor: color }),
          ]}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

/** White grouped card (`Card`). */
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Inset grouped rows (settings / menu pattern). */
export function InsetGroup({
  label,
  children,
  footer,
}: {
  label?: string;
  children: React.ReactNode;
  footer?: string;
}) {
  return (
    <View>
      {label ? <T style={styles.groupLabel}>{label}</T> : null}
      <Divided style={styles.group}>{children}</Divided>
      {footer ? <T style={styles.groupFooter}>{footer}</T> : null}
    </View>
  );
}

const TONES: Record<string, { bg: string; fg: string }> = {
  brand: { bg: palette.brand[50], fg: palette.brand[600] },
  green: { bg: palette.emerald[50], fg: palette.emerald[600] },
  amber: { bg: palette.amber[50], fg: palette.amber[600] },
  rose: { bg: palette.rose[50], fg: palette.rose[600] },
  ink: { bg: palette.ink[100], fg: '#0F172A' },
};

/** Settings-style row (`Row`). */
export function Row({
  icon,
  iconTone = 'brand',
  label,
  sub,
  value,
  onPress,
  chevron = true,
  danger,
  trailing,
}: {
  icon?: IconName;
  iconTone?: 'brand' | 'green' | 'amber' | 'rose' | 'ink';
  label: string;
  sub?: string;
  value?: string;
  onPress?: () => void;
  chevron?: boolean;
  danger?: boolean;
  trailing?: React.ReactNode;
}) {
  const tone = danger ? TONES.rose : TONES[iconTone];
  const content = (
    <>
      {icon && (
        <View style={[styles.rowIcon, { backgroundColor: tone.bg }]}>
          <Icon name={icon} size={17} color={danger ? '#E11D48' : tone.fg} />
        </View>
      )}
      <View style={styles.rowBody}>
        <T
          style={[styles.rowLabel, danger && { color: palette.rose[600] }]}
          numberOfLines={1}
        >
          {label}
        </T>
        {sub ? (
          <T style={styles.rowSub} numberOfLines={1}>
            {sub}
          </T>
        ) : null}
      </View>
      {value ? <T style={styles.rowValue}>{value}</T> : null}
      {trailing}
      {onPress && chevron && !trailing && (
        <Icon name="chevron-right" size={17} color="#CBD5E1" />
      )}
    </>
  );
  return onPress ? (
    <Press
      onPress={onPress}
      pressScale={1}
      style={styles.row}
      pressedStyle={styles.rowPressed}
    >
      {content}
    </Press>
  ) : (
    <View style={styles.row}>{content}</View>
  );
}

/** Key attributes at a glance (`SpecGrid`). */
export function SpecGrid({
  items,
  cols = 4,
}: {
  items: Array<{ icon?: IconName; value: React.ReactNode; label: string }>;
  cols?: number;
}) {
  return (
    <View style={styles.specWrap}>
      <Grid cols={cols} gap={1}>
        {items.map((it, i) => (
          <View key={i} style={styles.specCell}>
            {it.icon && <Icon name={it.icon} size={15} color="#1A6FFF" />}
            <T style={styles.specValue} numberOfLines={1}>
              {it.value}
            </T>
            <T style={styles.specLabel} numberOfLines={1}>
              {it.label}
            </T>
          </View>
        ))}
      </Grid>
    </View>
  );
}

/** Marketplace price hierarchy (`PriceBlock`). */
export function PriceBlock({
  price,
  per,
  note,
}: {
  price: string;
  per?: string | null;
  note?: string | null;
}) {
  return (
    <View>
      <T style={styles.price}>{price}</T>
      {per ? <T style={styles.per}>{per}</T> : null}
      {note ? <T style={styles.note}>{note}</T> : null}
    </View>
  );
}

/** Section heading with gradient accent rule (`SectionTitle`). */
export function SectionTitle({
  children,
  action,
  sub,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  sub?: string;
}) {
  return (
    <View style={styles.sectionRow}>
      <View style={styles.sectionLeft}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.accent} />
          <T style={styles.sectionTitle} numberOfLines={1}>
            {children}
          </T>
        </View>
        {sub ? <T style={styles.sectionSub}>{sub}</T> : null}
      </View>
      {action}
    </View>
  );
}

export type TimelineState = 'done' | 'current' | 'alert' | 'future';
export interface TimelineStep {
  title: string;
  state: TimelineState;
  detail?: string | null;
  date?: string | null;
  action?: React.ReactNode;
}

/** Vertical status stepper (`Timeline`). */
export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <View>
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        const done = s.state === 'done';
        const current = s.state === 'current';
        const alert = s.state === 'alert';
        return (
          <View key={`${s.title}-${i}`} style={styles.tlRow}>
            <View style={styles.tlRail}>
              <View
                style={[
                  styles.tlDot,
                  done && styles.tlDone,
                  current && styles.tlCurrent,
                  alert && styles.tlAlert,
                  !done && !current && !alert && styles.tlFuture,
                ]}
              >
                {done ? (
                  <Icon
                    name="check"
                    size={14}
                    color="#FFFFFF"
                    strokeWidth={3}
                  />
                ) : current ? (
                  <Icon name="loader-2" size={14} color="#FFFFFF" />
                ) : alert ? (
                  <Icon name="triangle-alert" size={13} color="#FFFFFF" />
                ) : (
                  <View style={styles.tlInner} />
                )}
              </View>
              {!last && (
                <View
                  style={[
                    styles.tlLine,
                    {
                      experimental_backgroundImage: done
                        ? 'linear-gradient(to bottom, #34D399, #A7F3D0)'
                        : current
                        ? 'linear-gradient(to bottom, #1A6FFF, #E2E8F0)'
                        : undefined,
                      backgroundColor: done || current ? undefined : '#E2E8F0',
                    },
                  ]}
                />
              )}
            </View>
            <View style={styles.tlBody}>
              <T
                style={[
                  styles.tlTitle,
                  {
                    color: current
                      ? palette.brand[700]
                      : done || alert
                      ? palette.ink[900]
                      : palette.ink[400],
                  },
                ]}
              >
                {s.title}
              </T>
              {s.detail ? <T style={styles.tlDetail}>{s.detail}</T> : null}
              {s.date ? <T style={styles.tlDate}>{s.date}</T> : null}
              {current && (
                <View style={styles.tlProgress}>
                  <View style={styles.tlProgressDot} />
                  <T style={styles.tlProgressText}>In progress</T>
                </View>
              )}
              {s.action}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Document row with view / download (`DocCard`). */
export function DocCard({
  name,
  meta,
  onView,
  onDownload,
  flagged,
  reason,
  action,
}: {
  name: string;
  meta?: string;
  onView?: () => void;
  onDownload?: () => void;
  flagged?: boolean;
  reason?: string | null;
  action?: React.ReactNode;
}) {
  return (
    <View style={[styles.doc, flagged && styles.docFlagged]}>
      <View style={styles.docRow}>
        <View
          style={[
            styles.docIcon,
            flagged ? styles.docIconFlag : styles.docIconOk,
          ]}
        >
          <Icon
            name="file-text"
            size={20}
            color={flagged ? '#D97706' : '#E11D48'}
          />
        </View>
        <Press onPress={onView} pressScale={1} style={styles.docBody}>
          <T style={styles.docName} numberOfLines={1}>
            {name}
          </T>
          {meta ? <T style={styles.docMeta}>{meta}</T> : null}
        </Press>
        {onDownload && (
          <Press
            onPress={onDownload}
            style={styles.docDl}
            accessibilityLabel={`Download ${name}`}
          >
            <Icon name="download" size={15} color="#334155" />
          </Press>
        )}
      </View>
      {flagged && reason ? (
        <View style={styles.docReason}>
          <Icon
            name="triangle-alert"
            size={12}
            color="#D97706"
            style={{ marginTop: 2 }}
          />
          <T style={styles.docReasonText}>{reason}</T>
        </View>
      ) : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  card: tw('bg-white rounded-2xl elev-1 p-4'),
  groupLabel: tw(
    'px-1 mb-2 text-[11px] font-bold uppercase tracking-[.07em] text-ink-400',
  ),
  group: tw('bg-white rounded-2xl elev-1 overflow-hidden'),
  groupFooter: tw('px-1 mt-2 text-[11px] text-ink-400 leading-relaxed'),
  row: tw('w-full flex items-center gap-3 px-3.5 py-3'),
  rowPressed: tw('bg-ink-50'),
  rowIcon: tw('w-9 h-9 rounded-xl items-center justify-center shrink-0'),
  rowBody: tw('flex-1 min-w-0'),
  rowLabel: tw('text-[14px] font-semibold text-ink-900'),
  rowSub: tw('text-[11.5px] text-ink-500 mt-0.5'),
  rowValue: tw('text-[12.5px] text-ink-500 shrink-0'),
  specWrap: tw(
    'rounded-2xl overflow-hidden bg-ink-200/70 border border-ink-200/70',
  ),
  specCell: tw('bg-white px-2 py-3 items-center'),
  specValue: tw(
    'num text-[14px] font-extrabold text-ink-900 mt-1 tracking-[-.02em] text-center',
  ),
  specLabel: tw('text-[10px] text-ink-500 mt-0.5 text-center'),
  price: twh('num text-[24px] font-extrabold text-ink-900 leading-none'),
  per: tw('text-[11px] text-ink-500 mt-1'),
  note: tw('text-[11px] font-semibold text-emerald-600 mt-1'),
  sectionRow: tw('flex items-end justify-between gap-3 mb-3'),
  sectionLeft: tw('min-w-0 flex-1'),
  sectionTitleRow: tw('flex items-center gap-2'),
  accent: {
    ...tw('w-1 h-4 rounded-full shrink-0'),
    experimental_backgroundImage:
      'linear-gradient(to bottom, #4A8CFF, #1A6FFF)',
  },
  sectionTitle: twh('text-[17px] font-extrabold text-ink-900 shrink'),
  sectionSub: tw('text-[11.5px] text-ink-500 mt-0.5 ml-3'),
  tlRow: tw('flex gap-3'),
  tlRail: tw('items-center'),
  tlDot: tw('w-8 h-8 rounded-full items-center justify-center shrink-0'),
  tlDone: {
    experimental_backgroundImage: 'linear-gradient(135deg, #34D399, #10B981)',
    boxShadow: '0 3px 10px -2px rgba(16,185,129,.55)',
  },
  tlCurrent: {
    experimental_backgroundImage: 'linear-gradient(135deg, #3B86FF, #1A6FFF)',
    boxShadow: '0 0 0 6px rgba(26,111,255,0.15)',
  },
  tlAlert: {
    experimental_backgroundImage: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
    boxShadow: '0 3px 10px -2px rgba(245,158,11,.5)',
  },
  tlFuture: {
    backgroundColor: palette.ink[200],
    boxShadow: `0 0 0 4px ${palette.ink[100]}`,
  },
  tlInner: tw('w-2 h-2 rounded-full bg-white'),
  tlLine: { width: 2, flex: 1, minHeight: 26, borderRadius: 9999 },
  tlBody: tw('pb-5 flex-1'),
  tlTitle: tw('text-[13.5px] font-bold tracking-[-.01em]'),
  tlDetail: tw('text-[11.5px] text-ink-500 mt-0.5'),
  tlDate: tw('text-[10.5px] text-ink-400 mt-0.5'),
  tlProgress: tw('flex items-center gap-1 mt-0.5'),
  tlProgressDot: tw('w-1.5 h-1.5 rounded-full bg-brand-600'),
  tlProgressText: tw('text-[10.5px] text-brand-600 font-semibold'),
  doc: tw('rounded-card border border-ink-200 bg-white elev-1'),
  docFlagged: {
    borderColor: palette.amber[300],
    backgroundColor: 'rgba(255,251,235,0.3)',
  },
  docRow: tw('flex items-center gap-3 p-3'),
  docIcon: tw('w-11 h-11 rounded-xl items-center justify-center shrink-0'),
  docIconOk: {
    backgroundColor: palette.rose[50],
    boxShadow: `0 0 0 1px ${palette.rose[100]}`,
  },
  docIconFlag: {
    backgroundColor: palette.amber[50],
    boxShadow: `0 0 0 1px ${palette.amber[200]}`,
  },
  docBody: tw('flex-1 min-w-0'),
  docName: tw('text-[13px] font-semibold'),
  docMeta: tw('text-[11px] text-ink-500'),
  docDl: tw(
    'w-9 h-9 rounded-full bg-ink-100 items-center justify-center shrink-0',
  ),
  docReason: tw(
    'mx-3 mb-3 px-2.5 py-2 rounded-md bg-amber-50 flex items-start gap-1.5',
  ),
  docReasonText: tw('flex-1 text-[11.5px] text-amber-800'),
});
