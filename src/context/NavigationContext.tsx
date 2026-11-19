import { createContext, useContext } from 'react';
import type { Flow } from '../theme';
import type { Ctx, ScreenName } from '../navigation/types';

export interface NavState {
  /** Current screen key. */
  key: ScreenName;
  go: (screen: ScreenName, ctx?: Ctx) => void;
  back: () => void;
  stack: ScreenName[];
  /** True when this screen was already shown once; entrance animations are skipped. */
  seen: boolean;
  /** Ambient colour family of the current screen. */
  flow: Flow;
}

export const NavigationContext = createContext<NavState>({
  key: 'home',
  go: () => {},
  back: () => {},
  stack: [],
  seen: false,
  flow: 'home',
});

export function useNav(): NavState {
  return useContext(NavigationContext);
}

/** Whether entrance animations should run for this screen. */
export function useFirstOpen(): boolean {
  return !useContext(NavigationContext).seen;
}
