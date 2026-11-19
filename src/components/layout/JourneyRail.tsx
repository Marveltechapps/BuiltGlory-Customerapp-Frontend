import React, { Fragment, useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useNav } from '../../context/NavigationContext';
import type { ScreenName } from '../../navigation/types';
import { colors, gradients, ring } from '../../theme';
import { Icon } from '../icons/Icon';
import { PopIn } from '../ui/Motion';
import { buzz } from '../ui/Press';
import { T } from '../ui/T';

type Steps = [ScreenName, string][];
export const JOURNEYS: Record<string, { label: string; steps: Steps }> = {
  enquiry: { label: 'Enquiry', steps: [['enquiry', 'Your details'], ['enquirySuccess', 'Submitted']] },
  visit: { label: 'Site visit', steps: [['visitCalendar', 'Pick a slot'], ['visitConfirmation', 'Confirmed']] },
  buy: { label: 'Buying journey', steps: [['buyerDeal', 'Deal'], ['documentsShared', 'Documents'], ['buyerKyc', 'KYC'], ['payment', 'Payment'], ['registrationDetails', 'Registration']] },
  sell: { label: 'Selling journey', steps: [['verificationStatus', 'Verification'], ['offer', 'Offer'], ['acceptNegotiate', 'Negotiate'], ['dealConfirmed', 'Deal'], ['paymentSchedule', 'Payment'], ['sellRegistration', 'Registration'], ['dealComplete', 'Sold']] },
};
const ALIAS: Partial<Record<ScreenName, ScreenName>> = { rescheduleVisit: 'visitCalendar', nriVideoCall: 'visitCalendar', paymentFailure: 'payment', reupload: 'verificationStatus' };

/** Step chips for multi-screen journeys; done steps are tappable, current one is centred. */
export function JourneyRail({ dark }: { dark?: boolean }) {
  const { key, go } = useNav();
  const k = ALIAS[key] ?? key;
  const jn = Object.values(JOURNEYS).find(j => j.steps.some(([s]) => s === k));
  const idx = jn ? jn.steps.findIndex(([s]) => s === k) : -1;
  const scroll = useRef<ScrollView>(null);
  const xs = useRef<{ x: number; w: number }[]>([]);
  const { width } = useWindowDimensions();
  useEffect(() => {
    const fit = () => {
      const el = xs.current[idx];
      if (el && scroll.current) scroll.current.scrollTo({ x: Math.max(0, el.x - (width - 32 - el.w) / 2), animated: true });
    };
    const a = setTimeout(fit, 60), b = setTimeout(fit, 480);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [idx, width]);
  if (!jn) return null;
  return (
    <View style={styles.wrap}>
      <T s={10} w={800} upper ls={0.12} c={dark ? 'rgba(255,255,255,0.5)' : colors.ink400} style={styles.label}>
        {jn.label} · <T num>{idx + 1}/{jn.steps.length}</T>
      </T>
      <ScrollView ref={scroll} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
        {jn.steps.map(([sk, label], n) => {
          const done = n < idx, now = n === idx;
          const chip = (
            <Pressable
              disabled={!done}
              onPress={() => { if (done) { buzz(); go(sk); } }}
              style={[styles.chip, now ? styles.now : done ? styles.done : dark ? styles.todoDark : styles.todo]}>
              <View style={[styles.num, now ? styles.numNow : done ? styles.numDone : dark ? styles.numTodoDark : styles.numTodo]}>
                {done ? <Icon name="check" size={12} color="white" strokeWidth={3} /> : <T num s={10} w={700} c={now ? colors.white : dark ? 'rgba(255,255,255,0.4)' : colors.ink400}>{n + 1}</T>}
              </View>
              <T s={11.5} w={700} c={now ? colors.white : done ? colors.emerald700 : dark ? 'rgba(255,255,255,0.4)' : colors.ink400}>{label}</T>
            </Pressable>
          );
          return (
            <Fragment key={sk}>
              {/* Measured on this wrapper: inside PopIn the chip's own x is relative to PopIn, not the rail. */}
              <View onLayout={e => { xs.current[n] = { x: e.nativeEvent.layout.x, w: e.nativeEvent.layout.width }; }}>
                {now ? <PopIn duration={450}>{chip}</PopIn> : chip}
              </View>
              {n < jn.steps.length - 1 && <View style={[styles.link, { backgroundColor: done ? colors.emerald300 : dark ? 'rgba(255,255,255,0.1)' : colors.ink200 }]} />}
            </Fragment>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingBottom: 12 },
  label: { marginBottom: 6 },
  rail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingLeft: 4, paddingRight: 12, borderRadius: 9999 },
  now: { experimental_backgroundImage: gradients.primarySoft, boxShadow: '0 6px 14px -6px rgba(26,111,255,0.7)' },
  done: { backgroundColor: colors.emerald50, boxShadow: ring(colors.emerald200) },
  todo: { backgroundColor: 'rgba(255,255,255,0.7)', boxShadow: ring(colors.ink200) },
  todoDark: { backgroundColor: 'rgba(255,255,255,0.05)' },
  num: { width: 24, height: 24, borderRadius: 9999, alignItems: 'center', justifyContent: 'center' },
  numNow: { backgroundColor: 'rgba(255,255,255,0.25)' },
  numDone: { backgroundColor: colors.emerald500 },
  numTodo: { backgroundColor: colors.ink100 },
  numTodoDark: { backgroundColor: 'rgba(255,255,255,0.1)' },
  link: { width: 12, height: 2, borderRadius: 9999 },
});
