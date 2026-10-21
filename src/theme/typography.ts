// Inter (body) and Bricolage Grotesque (display) are bundled from assets/fonts.
// File names match each face's PostScript name, so one string works on iOS and Android.
export const fonts = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  extrabold: 'Inter-ExtraBold',
  black: 'Inter-Black',
  displayMedium: 'BricolageGrotesque-Medium',
  displaySemibold: 'BricolageGrotesque-SemiBold',
  displayBold: 'BricolageGrotesque-Bold',
  displayExtrabold: 'BricolageGrotesque-ExtraBold',
};

export type FontWeightKey = 400 | 500 | 600 | 700 | 800 | 900;

/** Resolve the concrete face for a weight, mirroring CSS font matching against the loaded faces. */
export function fontFor(weight: FontWeightKey, display = false): string {
  if (display) {
    // The reference loads Bricolage 500/700/800; 400 resolves upward to 500.
    if (weight <= 500) return fonts.displayMedium;
    if (weight === 600) return fonts.displaySemibold;
    if (weight === 700) return fonts.displayBold;
    return fonts.displayExtrabold;
  }
  switch (weight) {
    case 500:
      return fonts.medium;
    case 600:
      return fonts.semibold;
    case 700:
      return fonts.bold;
    case 800:
      return fonts.extrabold;
    case 900:
      return fonts.black;
    default:
      return fonts.regular;
  }
}

/** Body line-height inherited from the reference's preflight (html { line-height: 1.5 }). */
export const BODY_LEADING = 1.5;
/** h1–h3 and .font-display letter-spacing from the reference stylesheet. */
export const DISPLAY_TRACKING_EM = -0.021;
