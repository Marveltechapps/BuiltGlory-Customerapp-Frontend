import type { ScreenName } from '../navigation/types';

/**
 * Development aid: open the app on these screens (bottom of the stack first)
 * instead of the splash. Only read in __DEV__ builds; keep it null when committing.
 */
export const DEV_START: ScreenName[] | null = null;
