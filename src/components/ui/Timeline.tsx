import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors, gradients } from '../../theme';
import { Icon } from '../icons/Icon';
import { Pulse, Spin } from './Float';
import { RiseIn } from './Motion';
import { T } from './T';

export interface TimelineStep {
  title: React.ReactNode;
  detail?: React.ReactNode;
  date?: React.ReactNode;
  state?: 'done' | 'current' | 'alert' | 'todo' | string;
  action?: React.ReactNode;
}

/** .glow-brand: a soft brand halo that expands and fades every 2.4s. */
function Glow() {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(t, { toValue: 1, duration: 1440, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(t, { toValue: 0, duration: 0, useNativeDriver: true }),
      Animated.delay(960),
    ]));
    loop.start();
    return () => loop.stop();
  }, [t]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.glow, {
        opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.42, 0] }),
        transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 56 / 32] }) }],
      }]} />
  );
}

/** Status stepper used by trackers (enquiry, listing, deal). */
export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <View>
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        const isDone = s.state === 'done';
        const isCurrent = s.state === 'current';
        const isAlert = s.state === 'alert';
        return (
          <RiseIn key={i} delay={40 + i * 45} style={styles.row}>
            <View style={styles.rail}>
              <View style={styles.dotWrap}>
                {isCurrent && <Glow />}
                <View style={[styles.dot, isDone ? styles.done : isCurrent ? styles.current : isAlert ? styles.alert : styles.todo]}>
                  {isDone ? <Icon name="check" size={14} color="white" strokeWidth={3} />
                    : isCurrent ? <Spin><Icon name="loader-2" size={14} color="white" /></Spin>
                    : isAlert ? <Icon name="triangle-alert" size={13} color="white" />
                    : <View style={styles.todoDot} />}
                </View>
              </View>
              {!last && <View style={[styles.line, isDone ? styles.lineDone : isCurrent ? styles.lineCurrent : styles.lineTodo]} />}
            </View>
            <View style={styles.body}>
              <T s={13.5} w={700} ls={-0.01} c={isCurrent ? colors.brand700 : (isDone || isAlert) ? colors.ink900 : colors.ink400}>{s.title}</T>
              {s.detail ? <T s={11.5} c={colors.ink500} style={styles.mt2}>{s.detail}</T> : null}
              {s.date ? <T s={10.5} c={colors.ink400} style={styles.mt2}>{s.date}</T> : null}
              {isCurrent && (
                <View style={styles.progress}>
                  <Pulse style={styles.pulseDot} />
                  <T s={10.5} w={600} c={colors.brand600}>In progress</T>
                </View>
              )}
              {s.action}
            </View>
          </RiseIn>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  rail: { alignItems: 'center' },
  dotWrap: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 32, height: 32, borderRadius: 9999, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 32, height: 32, borderRadius: 9999, backgroundColor: 'rgba(26,111,255,1)' },
  done: { experimental_backgroundImage: gradients.success, boxShadow: '0 3px 10px -2px rgba(16,185,129,0.55)' },
  current: { experimental_backgroundImage: gradients.primarySoft },
  alert: { experimental_backgroundImage: gradients.warn, boxShadow: '0 3px 10px -2px rgba(245,158,11,0.5)' },
  todo: { backgroundColor: colors.ink200, boxShadow: `0 0 0 4px ${colors.ink100}` },
  todoDot: { width: 8, height: 8, borderRadius: 9999, backgroundColor: colors.white },
  line: { width: 2, flex: 1, minHeight: 26, borderRadius: 9999 },
  lineDone: { experimental_backgroundImage: 'linear-gradient(180deg, #34D399, #A7F3D0)' },
  lineCurrent: { experimental_backgroundImage: 'linear-gradient(180deg, #1A6FFF, #E2E8F0)' },
  lineTodo: { backgroundColor: '#E2E8F0' },
  body: { paddingBottom: 20, flex: 1 },
  mt2: { marginTop: 2 },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  pulseDot: { width: 6, height: 6, borderRadius: 9999, backgroundColor: colors.brand600 },
});
