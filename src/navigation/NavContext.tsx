import { createContext, useContext, useEffect, useRef } from 'react';
import type { Flow, ResumeTarget, ScreenName, ScreenParamMap } from './types';

type ParamArgs<N extends ScreenName> = undefined extends ScreenParamMap[N]
  ? [params?: ScreenParamMap[N]]
  : [params: ScreenParamMap[N]];

export interface Navigator {
  /** Push a screen (guest-gated screens open the sign-in sheet instead). */
  go<N extends ScreenName>(name: N, ...params: ParamArgs<N>): void;
  /** Pop the current screen; from a root screen this returns to Home. */
  back(): void;
  /** Reset to Home, optionally with one screen on top (bottom navigation). */
  jump(name: ScreenName): void;
  /** Replace the whole stack. */
  reset<N extends ScreenName>(name: N, ...params: ParamArgs<N>): void;
  /** Replace the current screen. */
  replace<N extends ScreenName>(name: N, ...params: ParamArgs<N>): void;
  /** Pop back to the nearest `name` in the stack with new params, or push it. */
  popTo<N extends ScreenName>(name: N, ...params: ParamArgs<N>): void;
  /** Tab handler for the bottom navigation. */
  onNav(tab: 'home' | 'buy' | 'sell' | 'profile'): void;
  /** Open the guest sign-in sheet explicitly. */
  signIn(resume?: ResumeTarget | null): void;
  /** After OTP sign-in: Home, then the screen the user was trying to reach (if any). */
  finishSignIn(resume?: ResumeTarget | null): void;
  stack: ScreenName[];
}

export const NavContext = createContext<Navigator | null>(null);

export function useNav(): Navigator {
  const nav = useContext(NavContext);
  if (!nav) throw new Error('useNav must be used inside RootNavigator');
  return nav;
}

/** Per-screen context: which screen this is and whether it is on top of the stack. */
export interface ScreenInfo {
  name: ScreenName;
  key: string;
  focused: boolean;
  flow: Flow;
  /** First visit this session → play entrance animations (`.seen` disables them on revisits). */
  firstVisit: boolean;
}

export const ScreenContext = createContext<ScreenInfo | null>(null);

export function useScreen(): ScreenInfo {
  const info = useContext(ScreenContext);
  if (!info)
    throw new Error('useScreen must be used inside a navigator screen');
  return info;
}

/** Runs `effect` every time the screen becomes the top of the stack (including the first time). */
export function useFocusEffect(effect: () => void | (() => void)) {
  const { focused } = useScreen();
  const ref = useRef(effect);
  ref.current = effect;
  useEffect(() => {
    if (!focused) return;
    return ref.current();
  }, [focused]);
}

/** Calls `effect` when the screen regains focus after another screen was on top. */
export function useRefocus(effect: () => void) {
  const { focused } = useScreen();
  const wasFocused = useRef(focused);
  const ref = useRef(effect);
  ref.current = effect;
  useEffect(() => {
    if (focused && !wasFocused.current) ref.current();
    wasFocused.current = focused;
  }, [focused]);
}
