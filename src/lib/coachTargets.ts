import type { RefObject } from 'react';
import type { View } from 'react-native';

// Screen rectangles of the Home elements the coach marks spotlight.
// Home registers the views; the overlay re-measures them when it opens.
export interface Rect { x: number; y: number; w: number; h: number }
export type CoachKey = 'search' | 'buy' | 'sell';

export const coachTargets: Partial<Record<CoachKey, Rect>> = {};
export const coachViews: Partial<Record<CoachKey, RefObject<View | null>>> = {};

/**
 * Measure a registered target in page coordinates (relative to the full-screen root).
 * measureInWindow is avoided: on Android it leaves out the translucent status bar.
 */
export function measureCoachTarget(key: CoachKey, done: (r: Rect) => void) {
  coachViews[key]?.current?.measure((_x, _y, w, h, x, y) => {
    if (!w || !h) return;
    const r = { x, y, w, h };
    coachTargets[key] = r;
    done(r);
  });
}
