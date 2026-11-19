import { Easing } from 'react-native';

// Easing curves from the design's CSS variables.
export const ease = {
  /** --e-spring: cubic-bezier(.34,1.32,.44,1) */
  spring: Easing.bezier(0.34, 1.32, 0.44, 1),
  /** --e-out: cubic-bezier(.22,.8,.3,1) */
  out: Easing.bezier(0.22, 0.8, 0.3, 1),
  /** draw-on strokes: cubic-bezier(.65,0,.35,1) */
  draw: Easing.bezier(0.65, 0, 0.35, 1),
  navPop: Easing.bezier(0.34, 1.56, 0.44, 1),
};
