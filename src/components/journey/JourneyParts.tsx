import React, { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { colors, elev, ring } from '../../theme';
import type { Property } from '../../types/property';
import { formatDayTime } from '../../utils/dates';
import { formatINR } from '../../utils/format';
import { Icon } from '../icons/Icon';
import { EmptyState } from '../ui/EmptyState';
import { Btn } from '../ui/Btn';
import { Spin } from '../ui/Float';
import { FadeIn } from '../ui/Motion';
import { Press } from '../ui/Press';
import { T } from '../ui/T';
import { PhotoPlaceholder } from '../PhotoPlaceholder';
import { Screen, TopBar } from '../layout/Screen';

/** Horizontal stage chips; the current stage scrolls to the centre. */
export function StageRail({ stages, cur, sel, onPick }: { stages: [string, string][]; cur: number; sel?: number | null; onPick: (i: number) => void }) {
  const ref = useRef<ScrollView>(null);
  const xs = useRef<{ x: number; w: number }[]>([]);
  const { width } = useWindowDimensions();
  useEffect(() => {
    const t = setTimeout(() => {
      const el = xs.current[Math.max(0, Math.min(cur, stages.length - 1))];
      if (el) ref.current?.scrollTo({ x: Math.max(0, el.x - (width - 32) / 2 + el.w / 2), animated: false });
    }, 50);
    return () => clearTimeout(t);
  }, [cur, stages.length, width]);
  return (
    <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
      {stages.map(([k, l], i) => {
        const done = i < cur, now = i === cur;
        const ringStyle = sel === i
          ? { boxShadow: `0 0 0 1px #FFFFFF, 0 0 0 3px ${colors.brand400}` }
          : { boxShadow: ring(now ? colors.brand600 : done ? colors.emerald200 : colors.ink200) };
        return (
          <Press key={k} onPress={() => onPick(i)} onLayout={e => { xs.current[i] = { x: e.nativeEvent.layout.x, w: e.nativeEvent.layout.width }; }}
            style={[styles.stage, ringStyle, { backgroundColor: now ? colors.brand600 : done ? colors.emerald50 : colors.white }]}>
            <View style={[styles.stageNum, { backgroundColor: now ? 'rgba(255,255,255,0.25)' : done ? colors.emerald500 : colors.ink100 }]}>
              {done ? <Icon name="check" size={12} color="white" strokeWidth={3} /> : <T num s={10} w={700} c={now ? colors.white : colors.ink400}>{i + 1}</T>}
            </View>
            <T s={11.5} w={700} c={now ? colors.white : done ? colors.emerald700 : colors.ink400}>{l}</T>
          </Press>
        );
      })}
    </ScrollView>
  );
}

export type StepState = 'done' | 'current' | 'alert' | 'future';

/** Expandable step in a tracker timeline. */
export function StepRow({ i, title, state, time, detail, children, open, onToggle, onLayout }: {
  i: number; title: React.ReactNode; state: StepState; time?: number | null; detail?: React.ReactNode; children?: React.ReactNode;
  open?: boolean; onToggle?: () => void; onLayout?: (y: number) => void;
}) {
  return (
    <View style={styles.step} onLayout={e => onLayout?.(e.nativeEvent.layout.y)}>
      <View style={styles.stepRail}>
        <View style={[styles.stepDot,
          state === 'done' ? { backgroundColor: colors.emerald500 } : state === 'current' ? { backgroundColor: colors.brand600 } : state === 'alert' ? { backgroundColor: colors.amber500 } : styles.stepFuture]}>
          {state === 'done' ? <Icon name="check" size={15} color="white" strokeWidth={3} />
            : state === 'current' ? <Spin period={1400}><Icon name="loader" size={15} color="white" /></Spin>
            : <T num s={11} w={700} c={colors.ink400}>{i + 1}</T>}
        </View>
        <View style={[styles.stepLine, { backgroundColor: state === 'done' ? colors.emerald300 : colors.ink200 }]} />
      </View>
      <View style={styles.stepBody}>
        <Pressable onPress={onToggle} style={styles.stepHead} accessibilityRole="button">
          <View style={styles.flex1}>
            <T s={14} w={700} c={state === 'future' ? colors.ink400 : state === 'current' ? colors.brand700 : colors.ink900}>{title}</T>
            <T s={11.5} c={colors.ink500} style={styles.mt2}>{time ? formatDayTime(time) : state === 'current' ? 'In progress' : state === 'future' ? 'Not started' : ''}</T>
          </View>
          {state !== 'future' && <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#94A3B8" />}
        </Pressable>
        {open && state !== 'future' && (
          <FadeIn style={styles.stepDetail}>
            {detail ? <T s={12.5} c={colors.ink700} lh={1.625}>{detail}</T> : null}
            {children ? <View style={[styles.stepActions, detail ? styles.mt12 : null]}>{children}</View> : null}
          </FadeIn>
        )}
      </View>
    </View>
  );
}

/** Locked step placeholder screen. */
export function JourneyLock({ back, title, body, action, label }: { back: () => void; title: string; body: React.ReactNode; action?: () => void; label?: string }) {
  return (
    <Screen>
      <TopBar onBack={back} title={title} />
      <EmptyState icon="lock" title="This step isn't open yet" body={body} action={action ? <Btn onPress={action} style={styles.selfCenter}>{label}</Btn> : undefined} />
    </Screen>
  );
}

/** Small property summary row. */
export function PropMini({ p, right }: { p: Pick<Property, 'id' | 'title' | 'location' | 'city' | 'price'>; right?: React.ReactNode }) {
  return (
    <View style={styles.mini}>
      <PhotoPlaceholder tag={p.id} style={styles.miniImg} />
      <View style={styles.flex1}>
        <T s={13.5} w={700} truncate>{p.title}</T>
        <T s={11.5} c={colors.ink500} truncate>{p.location}, {p.city}</T>
        <T num s={13} w={800} c={colors.brand700} style={styles.mt2}>{formatINR(p.price)}</T>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  mt2: { marginTop: 2 },
  mt12: { marginTop: 12 },
  selfCenter: { alignSelf: 'center' },
  rail: { gap: 6, paddingBottom: 4, paddingHorizontal: 2, paddingVertical: 3 },
  stage: { height: 32, paddingLeft: 4, paddingRight: 12, borderRadius: 9999, flexDirection: 'row', alignItems: 'center', gap: 6 },
  stageNum: { width: 24, height: 24, borderRadius: 9999, alignItems: 'center', justifyContent: 'center' },
  step: { flexDirection: 'row', gap: 12 },
  stepRail: { alignItems: 'center' },
  stepDot: { width: 32, height: 32, borderRadius: 9999, alignItems: 'center', justifyContent: 'center' },
  stepFuture: { backgroundColor: colors.ink100, boxShadow: ring(colors.ink200) },
  stepLine: { width: 2, flex: 1, minHeight: 14 },
  stepBody: { flex: 1, minWidth: 0, paddingBottom: 16 },
  stepHead: { width: '100%', flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  stepDetail: { marginTop: 8, borderRadius: 16, backgroundColor: colors.ink50, boxShadow: ring('rgba(226,232,240,0.7)'), padding: 12 },
  stepActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mini: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, backgroundColor: colors.white, boxShadow: elev.e1 },
  miniImg: { width: 56, height: 56, borderRadius: 12 },
});
