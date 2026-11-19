import { Platform, type TextStyle } from 'react-native';

// Bundled from assets/fonts. File names match PostScript names so the same
// fontFamily works on Android (file name) and iOS (PostScript name).
export const fonts = {
  sans: {
    400: 'Inter-Regular',
    500: 'Inter-Medium',
    600: 'Inter-SemiBold',
    700: 'Inter-Bold',
    800: 'Inter-ExtraBold',
  },
  // The design loads Bricolage Grotesque at 500, 700 and 800 only, so
  // 600 resolves to 700 and anything below 500 resolves to 500, as in the browser.
  display: {
    500: 'BricolageGrotesque-Medium',
    700: 'BricolageGrotesque-Bold',
    800: 'BricolageGrotesque-ExtraBold',
  },
} as const;

export type Weight = 400 | 500 | 600 | 700 | 800 | 900;

export function fontFamily(weight: Weight = 400, display = false): string {
  if (display) {
    if (weight >= 800) return fonts.display[800];
    if (weight >= 600) return fonts.display[700];
    return fonts.display[500];
  }
  if (weight >= 800) return fonts.sans[800];
  return fonts.sans[weight as 400 | 500 | 600 | 700];
}

export interface TypeOptions {
  /** Bricolage Grotesque (h1–h3 and .font-display in the design). */
  display?: boolean;
  /** Unitless line-height factor. Tailwind's default is 1.5. */
  lh?: number;
  /** Letter spacing in em. Display text defaults to -0.021em. */
  ls?: number;
}

/**
 * Text style matching a Tailwind text class: size in px, weight, and the
 * inherited 1.5 line height unless a leading-* value is given.
 */
export function type(size: number, weight: Weight = 400, opts: TypeOptions = {}): TextStyle {
  const { display = false, lh = 1.5, ls } = opts;
  const spacing = ls ?? (display ? -0.021 : 0);
  return {
    fontSize: size,
    lineHeight: Math.round(size * lh * 100) / 100,
    fontFamily: fontFamily(weight, display),
    letterSpacing: spacing ? Math.round(size * spacing * 100) / 100 : 0,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
  };
}

/** Tailwind named sizes with their paired line heights. */
export const textSize = {
  xs: { size: 12, lh: 1 / 0.75 },
  sm: { size: 14, lh: 1.25 / 0.875 },
  base: { size: 16, lh: 1.5 },
  lg: { size: 18, lh: 1.75 / 1.125 },
  xl: { size: 20, lh: 1.75 / 1.25 },
  '2xl': { size: 24, lh: 2 / 1.5 },
} as const;

export const leading = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
} as const;

/** Tabular figures, the design's .num class. */
export const tabular: TextStyle = { fontVariant: ['tabular-nums'] };
