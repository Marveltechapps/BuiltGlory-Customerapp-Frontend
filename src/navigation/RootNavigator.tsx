import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  PanResponder,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { onSessionExpired } from '../api/session';
import { GuestGate } from '../components/GuestGate';
import { useAuth } from '../context/AuthContext';
import { buzz } from '../utils/haptics';
import { NavContext, ScreenContext, type Navigator } from './NavContext';
import { SCREENS } from './screens';
import type { ResumeTarget, ScreenName } from './types';

interface Entry {
  key: string;
  name: ScreenName;
  params: unknown;
  firstVisit: boolean;
}

/** Screens that need an account; guests get the sign-in sheet with this reason (screens-guest.jsx). */
const GUEST_GATED: Partial<Record<ScreenName, string>> = {
  enquiry: 'submit an enquiry',
  visitCalendar: 'schedule a site visit',
  rescheduleVisit: 'reschedule a visit',
  nriVideoCall: 'book an NRI video call',
  sellType: 'list a property',
  sellIntent: 'list a property',
  myListings: 'see your listings',
  myEnquiries: 'track your enquiries',
  notifications: 'get notifications',
  profileEdit: 'edit your profile',
  favorites: 'save properties',
  // Account-only screens reachable from public pages in this app.
  myVisits: 'manage your visits',
  myDeals: 'track your deals',
};

const EASE = Easing.bezier(0.22, 0.8, 0.3, 1);
let keySeq = 0;

export function RootNavigator() {
  const { status } = useAuth();
  const { width } = useWindowDimensions();
  const visited = useRef(new Set<ScreenName>());
  const makeEntry = (name: ScreenName, params?: unknown): Entry => {
    const firstVisit = !visited.current.has(name);
    visited.current.add(name);
    keySeq += 1;
    return { key: `${name}-${keySeq}`, name, params, firstVisit };
  };
  const [stack, setStack] = useState<Entry[]>(() => [makeEntry('splash')]);
  const stackRef = useRef(stack);
  stackRef.current = stack;
  const [gate, setGate] = useState<{
    reason: string;
    resume: ResumeTarget | null;
  } | null>(null);
  const statusRef = useRef(status);
  statusRef.current = status;

  // Transition animation for the top screen (nav-push / nav-pop / nav-swap).
  const anim = useRef(new Animated.Value(1)).current;
  const [direction, setDirection] = useState<'push' | 'pop' | 'swap'>('swap');
  const edgeX = useRef(new Animated.Value(0)).current;

  const animate = useCallback(
    (dir: 'push' | 'pop' | 'swap') => {
      setDirection(dir);
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: dir === 'push' ? 420 : dir === 'pop' ? 380 : 340,
        easing: EASE,
        useNativeDriver: true,
      }).start();
    },
    [anim],
  );

  const isGated = (name: ScreenName) =>
    statusRef.current !== 'signedIn' &&
    GUEST_GATED[name] !== undefined &&
    (statusRef.current === 'guest' || statusRef.current === 'signedOut');

  const navigator = useMemo<Navigator>(() => {
    const push = (name: ScreenName, params?: unknown) => {
      if (isGated(name)) {
        buzz(10);
        setGate({
          reason: GUEST_GATED[name] as string,
          resume: { name, params },
        });
        return;
      }
      animate('push');
      setStack(s => [...s, makeEntry(name, params)]);
    };
    const resetTo = (entries: Array<[ScreenName, unknown?]>) => {
      animate('swap');
      setStack(entries.map(([n, p]) => makeEntry(n, p)));
    };
    return {
      go: ((name: ScreenName, params?: unknown) =>
        push(name, params)) as Navigator['go'],
      back: () => {
        const s = stackRef.current;
        if (s.length > 1) {
          animate('pop');
          setStack(s.slice(0, -1));
        } else if (
          s[0].name !== 'home' &&
          (statusRef.current === 'signedIn' || statusRef.current === 'guest')
        ) {
          resetTo([['home']]);
        }
      },
      jump: (name: ScreenName) => {
        if (name !== 'home' && isGated(name)) {
          setGate({ reason: GUEST_GATED[name] as string, resume: { name } });
          return;
        }
        resetTo(name === 'home' ? [['home']] : [['home'], [name]]);
      },
      reset: ((name: ScreenName, params?: unknown) =>
        resetTo([[name, params]])) as Navigator['reset'],
      replace: ((name: ScreenName, params?: unknown) => {
        animate('swap');
        setStack(s => [...s.slice(0, -1), makeEntry(name, params)]);
      }) as Navigator['replace'],
      popTo: ((name: ScreenName, params?: unknown) => {
        const s = stackRef.current;
        const idx = s.map(e => e.name).lastIndexOf(name);
        if (idx < 0) {
          push(name, params);
          return;
        }
        animate('pop');
        setStack(
          s
            .slice(0, idx)
            .concat({
              ...s[idx],
              params: params === undefined ? s[idx].params : params,
            }),
        );
      }) as Navigator['popTo'],
      onNav: tab => {
        const guest = statusRef.current !== 'signedIn';
        if (tab === 'home') resetTo([['home']]);
        if (tab === 'buy') resetTo([['home'], ['buyTypes']]);
        if (tab === 'sell') {
          if (guest)
            setGate({
              reason: GUEST_GATED.sellType as string,
              resume: { name: 'sellType' },
            });
          else resetTo([['home'], ['sellType']]);
        }
        if (tab === 'profile')
          resetTo([['home'], [guest ? 'guestProfile' : 'profile']]);
      },
      signIn: (resume?: ResumeTarget | null) => {
        setGate(null);
        animate('push');
        setStack(s => [
          ...s,
          makeEntry('login', { fromGuest: true, resume: resume ?? null }),
        ]);
      },
      finishSignIn: (resume?: ResumeTarget | null) => {
        resetTo(
          resume && resume.name !== 'home'
            ? [['home'], [resume.name, resume.params]]
            : [['home']],
        );
      },
      stack: stack.map(e => e.name),
    };
  }, [animate, stack]);

  // Refresh-token rejection → G-04, remembering where the user was.
  useEffect(
    () =>
      onSessionExpired(() => {
        const top = stackRef.current[stackRef.current.length - 1];
        const resume =
          top && !['splash', 'login', 'otp', 'sessionExpiry'].includes(top.name)
            ? { name: top.name, params: top.params }
            : null;
        animate('swap');
        setStack([makeEntry('sessionExpiry', { resume })]);
      }),
    [animate],
  );

  // Android hardware back.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (gate) {
        setGate(null);
        return true;
      }
      const s = stackRef.current;
      if (s.length > 1) {
        navigator.back();
        return true;
      }
      if (
        s[0].name !== 'home' &&
        (statusRef.current === 'signedIn' || statusRef.current === 'guest')
      ) {
        navigator.back();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [gate, navigator]);

  // iOS edge swipe back (Android uses the system back gesture).
  const edgePan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => stackRef.current.length > 1,
        onMoveShouldSetPanResponder: (_, g) =>
          stackRef.current.length > 1 && g.dx > 4,
        onPanResponderMove: (_, g) => edgeX.setValue(Math.max(0, g.dx)),
        onPanResponderRelease: (_, g) => {
          if (g.dx > width * 0.3) {
            buzz();
            edgeX.setValue(0);
            navigator.back();
          } else
            Animated.spring(edgeX, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
        },
        onPanResponderTerminate: () =>
          Animated.spring(edgeX, { toValue: 0, useNativeDriver: true }).start(),
      }),
    [edgeX, navigator, width],
  );

  const topIndex = stack.length - 1;
  const transitionStyle =
    direction === 'push'
      ? {
          opacity: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.4, 1],
          }),
          transform: [
            {
              translateX: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [width * 0.42, 0],
              }),
            },
          ],
        }
      : direction === 'pop'
      ? {
          opacity: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.4, 1],
          }),
          transform: [
            {
              translateX: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [-width * 0.28, 0],
              }),
            },
          ],
        }
      : {
          opacity: anim,
          transform: [
            {
              scale: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.97, 1],
              }),
            },
          ],
        };

  return (
    <NavContext.Provider value={navigator}>
      <View style={styles.root}>
        {stack.map((entry, i) => {
          const Comp = SCREENS[entry.name].Comp as React.ComponentType<{
            params: unknown;
          }>;
          const focused = i === topIndex;
          return (
            <ScreenContext.Provider
              key={entry.key}
              value={{
                name: entry.name,
                key: entry.key,
                focused,
                flow: SCREENS[entry.name].flow,
                firstVisit: entry.firstVisit,
              }}
            >
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  !focused && styles.hidden,
                  focused && transitionStyle,
                  focused && {
                    transform: [
                      ...((transitionStyle as any).transform ?? []),
                      { translateX: edgeX },
                    ],
                  },
                ]}
                pointerEvents={focused ? 'auto' : 'none'}
              >
                <Comp params={entry.params} />
              </Animated.View>
            </ScreenContext.Provider>
          );
        })}
        {Platform.OS === 'ios' && stack.length > 1 && (
          <View style={styles.edge} {...edgePan.panHandlers} />
        )}
        <GuestGate
          visible={!!gate}
          reason={gate?.reason ?? ''}
          onClose={() => setGate(null)}
          onSignIn={() => navigator.signIn(gate?.resume ?? null)}
        />
      </View>
    </NavContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F172A' },
  hidden: { display: 'none' },
  edge: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 22,
    zIndex: 70,
  },
});
