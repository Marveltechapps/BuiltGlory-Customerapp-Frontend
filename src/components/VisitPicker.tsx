import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useResource } from '../lib/useResource';
import { getAvailability } from '../services/visit.service';
import type { AvailabilitySlot, VisitType } from '../types/visit';
import { palette, tw } from '../theme';
import { fromIsoDate, isoDate, MONTHS } from '../utils/format';
import { Icon } from './Icon';
import { Grid } from './Layout';
import { Press } from './Press';
import { ErrorState, LoadingState } from './States';
import { T } from './T';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export interface VisitPick {
  date: string;
  slot: string;
}

/**
 * Month calendar + slot grid backed by GET /visits/availability (B-12, B-12a).
 * Days before tomorrow are disabled because the backend only accepts future visits.
 */
export function VisitPicker({
  propertyId,
  visitType = 'physical',
  value,
  onChange,
}: {
  propertyId: string;
  visitType?: VisitType;
  value: VisitPick | null;
  onChange: (v: VisitPick | null) => void;
}) {
  const today = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);
  const tomorrow = useMemo(() => new Date(today.getTime() + 86400000), [today]);
  const [view, setView] = useState({
    y: tomorrow.getFullYear(),
    m: tomorrow.getMonth(),
  });
  const monthStart = new Date(view.y, view.m, 1);
  const from = monthStart > tomorrow ? monthStart : tomorrow;
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const firstDow = monthStart.getDay();
  const span = Math.min(
    30,
    Math.max(
      1,
      Math.round(
        (new Date(view.y, view.m + 1, 1).getTime() - from.getTime()) / 86400000,
      ),
    ),
  );

  const avail = useResource(
    signal =>
      getAvailability(
        { propertyId, visitType, from: isoDate(from), days: span },
        signal,
      ),
    [propertyId, visitType, view.y, view.m],
  );
  const byDate = useMemo(() => {
    const map = new Map<string, AvailabilitySlot[]>();
    for (const d of avail.data?.days ?? []) map.set(d.date, d.slots);
    return map;
  }, [avail.data]);

  // Default to the first open slot once availability arrives.
  useEffect(() => {
    if (value || !avail.data) return;
    for (const d of avail.data.days) {
      const open = d.slots.find(s => s.available);
      if (open) {
        onChange({ date: d.date, slot: open.time });
        return;
      }
    }
  }, [avail.data, onChange, value]);

  const isBeforeView =
    view.y < tomorrow.getFullYear() ||
    (view.y === tomorrow.getFullYear() && view.m <= tomorrow.getMonth());
  const selectedDate = value?.date ?? null;
  const slots = selectedDate ? byDate.get(selectedDate) ?? [] : [];

  return (
    <View>
      <View style={styles.monthRow}>
        <Press
          disabled={isBeforeView}
          onPress={() =>
            setView(v =>
              v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 },
            )
          }
          style={styles.navBtn}
          accessibilityLabel="Previous month"
        >
          <Icon
            name="chevron-left"
            size={18}
            color={isBeforeView ? palette.ink[200] : palette.ink[700]}
          />
        </Press>
        <T style={styles.month}>
          {MONTHS[view.m]} {view.y}
        </T>
        <Press
          onPress={() =>
            setView(v =>
              v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 },
            )
          }
          style={styles.navBtn}
          accessibilityLabel="Next month"
        >
          <Icon name="chevron-right" size={18} color={palette.ink[700]} />
        </Press>
      </View>
      <Grid cols={7} gap={4} style={styles.mb1}>
        {DOW.map((d, i) => (
          <T key={i} style={styles.dow}>
            {d}
          </T>
        ))}
      </Grid>
      <Grid cols={7} gap={4}>
        {Array.from({ length: firstDow + daysInMonth }).map((_, i) => {
          const dayN = i - firstDow + 1;
          if (dayN < 1) return <View key={i} />;
          const cell = new Date(view.y, view.m, dayN);
          const key = isoDate(cell);
          const past = cell < tomorrow;
          const isToday = cell.getTime() === today.getTime();
          const sel = key === selectedDate;
          const daySlots = byDate.get(key);
          const full = daySlots ? !daySlots.some(s => s.available) : false;
          return (
            <Press
              key={i}
              disabled={past || full}
              pressScale={0.92}
              onPress={() => {
                const open = (byDate.get(key) ?? []).find(s => s.available);
                onChange(
                  open
                    ? { date: key, slot: open.time }
                    : { date: key, slot: '' },
                );
              }}
              style={[
                styles.day,
                sel ? styles.daySel : isToday ? styles.dayToday : null,
              ]}
            >
              <T
                style={[
                  styles.dayText,
                  sel
                    ? styles.dayTextSel
                    : isToday
                    ? styles.dayTextToday
                    : past || full
                    ? styles.dayTextPast
                    : null,
                ]}
              >
                {dayN}
              </T>
            </Press>
          );
        })}
      </Grid>
      <T style={styles.slotsTitle}>Available time slots</T>
      {avail.loading ? (
        <LoadingState style={styles.slotLoad} />
      ) : avail.error ? (
        <ErrorState compact message={avail.error} onRetry={avail.reload} />
      ) : slots.length === 0 ? (
        <T style={styles.none}>No slots on this day. Pick another date.</T>
      ) : (
        <Grid cols={4} gap={8}>
          {slots.map(s => {
            const on = value?.slot === s.time && value?.date === selectedDate;
            return (
              <Press
                key={s.time}
                disabled={!s.available}
                onPress={() =>
                  selectedDate && onChange({ date: selectedDate, slot: s.time })
                }
                style={[
                  styles.slot,
                  on ? styles.slotOn : styles.slotOff,
                  !s.available && styles.slotBooked,
                ]}
              >
                <T
                  style={[
                    styles.slotText,
                    on && styles.slotTextOn,
                    !s.available && styles.slotTextBooked,
                  ]}
                >
                  {s.time}
                </T>
              </Press>
            );
          })}
        </Grid>
      )}
    </View>
  );
}

/** "May 24, 2026" for a YYYY-MM-DD key. */
export function pickLabel(date: string) {
  const d = fromIsoDate(date);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

const styles = StyleSheet.create({
  monthRow: tw('flex items-center justify-between mb-3'),
  navBtn: tw('w-9 h-9 rounded-full items-center justify-center'),
  month: tw('text-[14px] font-semibold text-ink-900'),
  mb1: tw('mb-1'),
  dow: tw('text-[11px] text-ink-500 text-center'),
  day: tw('aspect-square rounded-lg items-center justify-center'),
  daySel: tw('bg-brand-600'),
  dayToday: tw('border border-brand-600'),
  dayText: tw('text-[13px] text-ink-700'),
  dayTextSel: tw('text-white font-bold'),
  dayTextToday: tw('text-brand-600 font-bold'),
  dayTextPast: tw('text-ink-300'),
  slotsTitle: tw('text-[14px] font-semibold mt-5 mb-2'),
  slotLoad: tw('py-6'),
  none: tw('text-[12px] text-ink-400 py-2'),
  slot: tw('py-2.5 rounded-card border items-center'),
  slotOn: tw('border-brand-600 bg-brand-50'),
  slotOff: tw('border-ink-200'),
  slotBooked: { opacity: 0.4 },
  slotText: tw('text-[11.5px]'),
  slotTextOn: tw('text-brand-700 font-semibold'),
  slotTextBooked: { textDecorationLine: 'line-through' },
});
