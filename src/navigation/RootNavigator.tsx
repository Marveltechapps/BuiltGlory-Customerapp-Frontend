import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, BackHandler, PanResponder, StatusBar, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { NavigationContext } from '../context/NavigationContext';
import { buzz } from '../components/ui/Press';
import { colors, ease } from '../theme';
import { SampleScreen } from '../screens/sample/SampleScreen';
import { CoachMarksScreen } from '../screens/home/CoachMarksScreen';
import { GuestGate, GUEST_GATED } from '../screens/profile/GuestScreens';
import { MissingScreen } from '../screens/global/MissingScreen';
import { DEV_START } from '../config/devStart';
import { session } from '../lib/session';
import * as propertiesService from '../services/properties.service';
import { SCREENS, flowOf } from './screens';
import type { Ctx, GateInfo, NavEntry, ScreenName, ScreenProps, TabId } from './types';

const ONBOARDING: ScreenName[] = ['splash', 'onboarding', 'login', 'otp', 'profileSetup', 'locationType', 'terms', 'permissions', 'home'];
/** Screens drawn on a dark hero, so the status bar text is light. */
const LIGHT_STATUS: ScreenName[] = ['home'];

/**
 * App navigator: a local stack in useState (no React Navigation), with the
 * design's push / pop / swap transitions, edge swipe back and Android back.
 */
export function RootNavigator() {
  const { isAuthenticated, isHydrating, onSessionExpired } = useAuth();
  const [stack, setStack] = useState<NavEntry[]>(() =>
    (__DEV__ && DEV_START?.length ? DEV_START : (['splash'] as ScreenName[])).map(screen => ({ screen, ctx: {} })));
  const [fav, setFav] = useState<Set<string>>(() => new Set());
  const [coach, setCoach] = useState(false);
  const [coachSeen, setCoachSeen] = useState(false);
  const [guest, setGuest] = useState(false);
  const [gate, setGate] = useState<GateInfo | null>(null);
  const guestRef = useRef(false);
  guestRef.current = guest;
  const authRef = useRef(isAuthenticated);
  authRef.current = isAuthenticated;
  const pending = useRef<GateInfo | null>(null);
  const visited = useRef(new Set<ScreenName>());
  const { width } = useWindowDimensions();

  const cur = stack[stack.length - 1];
  const seen = useMemo(() => {
    const s = visited.current.has(cur.screen);
    visited.current.add(cur.screen);
    return s;
    // re-evaluate on every navigation, like the design's useMemo on stack length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur.screen, stack.length]);

  const prevLen = useRef(stack.length);
  const dir = stack.length > prevLen.current ? 'push' : stack.length < prevLen.current ? 'pop' : 'swap';

  const go = useCallback((screen: ScreenName, ctx: Ctx = {}) => {
    let target = screen;
    if (target === 'propertyDetail' && ctx?.p?.soldOut) target = 'soldOut';
    const reason = GUEST_GATED[target];
    if (guestRef.current && reason) { buzz(10); setGate({ reason, target, ctx }); return; }
    setStack(s => [...s, { screen: target, ctx }]);
  }, []);

  const back = useCallback(() => {
    setStack(s => (s.length > 1 ? s.slice(0, -1) : s[0].screen === 'home' ? s : [{ screen: 'home', ctx: {} }]));
  }, []);

  const jump = useCallback((screen: ScreenName) => {
    setStack(screen === 'home' ? [{ screen: 'home', ctx: {} }] : [{ screen: 'home', ctx: {} }, { screen, ctx: {} }]);
  }, []);

  const toggleFav = useCallback((id: string) => {
    if (guestRef.current) { buzz(10); setGate({ reason: GUEST_GATED.fav }); return; }
    setFav(f => {
      const s = new Set(f);
      const removing = s.has(id);
      if (removing) s.delete(id); else s.add(id);

      if (authRef.current) {
        const op = removing
          ? propertiesService.unsaveProperty(id)
          : propertiesService.saveProperty(id);
        op.catch(() => {
          setFav(prev => {
            const rolled = new Set(prev);
            if (removing) rolled.add(id); else rolled.delete(id);
            return rolled;
          });
        });
      }

      return s;
    });
  }, []);

  const onNav = useCallback((tab: TabId) => {
    if (tab === 'home') jump('home');
    if (tab === 'buy') jump('buyTypes');
    if (tab === 'sell') { if (guestRef.current) setGate({ reason: GUEST_GATED.sellType, target: 'sellType' }); else jump('sellType'); }
    if (tab === 'profile') jump(guestRef.current ? 'guestProfile' : 'profile');
  }, [jump]);

  // Session expiry → G-04
  useEffect(() => {
    if (isHydrating) return;
    return onSessionExpired(() => {
      if (SCREENS.sessionExpiry) {
        setStack([{ screen: 'sessionExpiry', ctx: {} }]);
      }
    });
  }, [isHydrating, onSessionExpired]);

  // Load favorites when authenticated; clear when signed out.
  useEffect(() => {
    if (!isAuthenticated) {
      setFav(new Set());
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { items } = await propertiesService.listFavorites();
        if (!cancelled) {
          setFav(new Set(items.map(p => p._id).filter(Boolean)));
        }
      } catch {
        // Keep empty / previous set; list may fail offline.
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  // Coach marks on the first visit to Home.
  useEffect(() => {
    if (cur.screen === 'home' && !coachSeen) {
      const t = setTimeout(() => { setCoach(true); setCoachSeen(true); }, 800);
      return () => clearTimeout(t);
    }
  }, [cur.screen, coachSeen]);

  const enterGuest = useCallback(() => { setGuest(true); buzz(); jump('home'); }, [jump]);
  const signIn = useCallback((resume?: GateInfo) => {
    pending.current = resume ?? null;
    setGate(null);
    setStack(s => [...s, { screen: 'login', ctx: { fromGuest: true } }]);
  }, []);
  const finishGuestSignIn = useCallback(() => {
    const r = pending.current;
    pending.current = null;
    setGuest(false);
    setStack(r && r.target ? [{ screen: 'home', ctx: {} }, { screen: r.target, ctx: r.ctx ?? {} }] : [{ screen: 'home', ctx: {} }]);
  }, []);

  const onNext = useCallback(() => {
    if (guestRef.current && cur.screen === 'otp') { finishGuestSignIn(); return; }
    if (cur.screen === 'otp' && session.authMode !== 'signup') { jump('home'); return; }
    const i = ONBOARDING.indexOf(cur.screen);
    if (i >= 0 && i < ONBOARDING.length - 1) go(ONBOARDING[i + 1]);
  }, [cur.screen, finishGuestSignIn, jump, go]);

  const screenProps: ScreenProps = {
    go, back, jump, ctx: cur.ctx, fav: guest ? new Set() : fav, toggleFav, onNav, guest, signIn, onGuest: enterGuest,
    onNext, onDone: () => go('login'),
  };

  // ─── Android hardware back ──────────────────────────────────
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (gate) { setGate(null); return true; }
      if (coach) { setCoach(false); return true; }
      if (stack.length > 1) { back(); return true; }
      if (cur.screen !== 'home' && cur.screen !== 'splash') { back(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [stack.length, cur.screen, gate, coach, back]);

  // ─── Screen transition ─────────────────────────────────────
  const enter = useRef(new Animated.Value(1)).current;
  const edgeX = useRef(new Animated.Value(0)).current;
  const [anim, setAnim] = useState<'push' | 'pop' | 'swap'>('swap');
  useEffect(() => {
    setAnim(dir);
    prevLen.current = stack.length;
    enter.setValue(0);
    Animated.timing(enter, { toValue: 1, duration: dir === 'push' ? 420 : dir === 'pop' ? 380 : 340, easing: ease.out, useNativeDriver: true }).start();
    // run once per navigation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur.screen, stack.length]);

  const stackLen = useRef(stack.length);
  stackLen.current = stack.length;
  const edge = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => stackLen.current > 1,
    onMoveShouldSetPanResponder: (_, g) => stackLen.current > 1 && g.dx > 4,
    onPanResponderMove: (_, g) => edgeX.setValue(Math.max(0, g.dx)),
    onPanResponderRelease: (_, g) => {
      if (g.dx > width * 0.3) {
        Animated.timing(edgeX, { toValue: width, duration: 200, easing: ease.out, useNativeDriver: true }).start(() => {
          buzz();
          back();
          edgeX.setValue(0);
        });
      } else {
        Animated.timing(edgeX, { toValue: 0, duration: 300, easing: ease.out, useNativeDriver: true }).start();
      }
    },
    onPanResponderTerminate: () => Animated.timing(edgeX, { toValue: 0, duration: 300, easing: ease.out, useNativeDriver: true }).start(),
  })).current;

  const from = anim === 'push' ? width * 0.42 : anim === 'pop' ? -width * 0.28 : 0;
  const frameStyle = {
    opacity: enter.interpolate({ inputRange: [0, 1], outputRange: [anim === 'swap' ? 0 : 0.4, 1] }),
    transform: [
      { translateX: Animated.add(enter.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }), edgeX) },
      { scale: anim === 'swap' ? enter.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) : 1 },
    ],
  };

  const entry = SCREENS[cur.screen];
  const Comp = entry?.Comp;
  const navValue = useMemo(() => ({
    key: cur.screen, go, back, stack: stack.map(s => s.screen), seen, flow: flowOf(entry?.group),
  }), [cur.screen, go, back, stack, seen, entry?.group]);

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle={LIGHT_STATUS.includes(cur.screen) ? 'light-content' : 'dark-content'} />
      <NavigationContext.Provider value={navValue}>
        <Animated.View key={cur.screen + stack.length} style={[styles.frame, frameStyle]}>
          {cur.screen === 'samples' ? (
            <SampleScreen onBack={back} />
          ) : Comp ? (
            <Comp {...screenProps} />
          ) : (
            <MissingScreen name={cur.screen} onHome={() => jump('home')} />
          )}
          {coach && cur.screen === 'home' && <CoachMarksScreen onDone={() => setCoach(false)} />}
          {cur.screen === 'coachMarks' && <CoachMarksScreen onDone={() => jump('home')} />}
          {gate && <GuestGate reason={gate.reason} onClose={() => setGate(null)} onSignIn={() => signIn(gate)} />}
        </Animated.View>
        {stack.length > 1 && <View style={styles.edge} {...edge.panHandlers} />}
      </NavigationContext.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink900 },
  frame: { flex: 1, backgroundColor: colors.white, overflow: 'hidden' },
  edge: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 22, zIndex: 70 },
});
