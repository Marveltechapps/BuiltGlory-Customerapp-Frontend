import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';
import { palette, withAlpha } from './colors';
import {
  BODY_LEADING,
  DISPLAY_TRACKING_EM,
  fontFor,
  type FontWeightKey,
} from './typography';
import { meshes, shadows } from './shadows';
import { radius } from './spacing';

/**
 * Compiles the Tailwind utility vocabulary used by the Builtglory design reference into
 * plain React Native style objects, resolved against the theme tokens in this folder.
 *
 * Screens use it inside `StyleSheet.create`, e.g. `card: tw('rounded-card border border-ink-200 p-3')`,
 * so styles stay static and the class lists can be compared line-by-line with the reference.
 *
 * Cascade rules reproduced from the reference stylesheet:
 * - `elev-*` / `glass` are unlayered and win over Tailwind's `ring-*` / `bg-*` utilities.
 * - Display text (h1–h3, `.font-display`) always uses `letter-spacing: -.021em`.
 * - Colors missing from the theme (`text-ink-600`, `text-ink-800`) emit nothing, so text inherits.
 * Interaction, animation and layout-only tokens (`grid`, `divide-*`, `truncate`…) are handled
 * by components and ignored here.
 */
export type TwStyle = ViewStyle & TextStyle & ImageStyle;

type Weight = FontWeightKey;
interface Acc {
  style: Record<string, unknown>;
  fontSize?: number;
  lineHeightPx?: number;
  leading?: number;
  trackingEm?: number;
  weight?: Weight;
  display: boolean;
  ringWidth?: number;
  ringColor?: string;
  shadow?: string;
  elev?: string;
  glass?: string;
  gradientDir?: string;
  gradientFrom?: string;
  gradientVia?: string;
  gradientTo?: string;
}

const TEXT_SIZES: Record<string, [number, number]> = {
  xs: [12, 16],
  sm: [14, 20],
  base: [16, 24],
  lg: [18, 28],
  xl: [20, 28],
  '2xl': [24, 32],
  '3xl': [30, 36],
};

const LEADING: Record<string, number> = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
};
const TRACKING: Record<string, number> = {
  tighter: -0.05,
  tight: -0.025,
  normal: 0,
  wide: 0.025,
  wider: 0.05,
  widest: 0.1,
};
const WEIGHTS: Record<string, Weight> = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
};
const RADII: Record<string, number> = {
  '': radius.sm,
  sm: radius.sm,
  md: radius.md,
  lg: radius.lg,
  xl: radius.xl,
  '2xl': radius['2xl'],
  '3xl': radius['3xl'],
  card: radius.card,
  full: radius.full,
  none: 0,
};
const ELEV: Record<string, string> = {
  '1': shadows.elev1,
  '2': shadows.elev2,
  '3': shadows.elev3,
  brand: shadows.elevBrand,
};
const SHADOW: Record<string, string> = {
  '': shadows.sm,
  sm: shadows.sm,
  md: shadows.md,
  lg: shadows.lg,
  xl: shadows.xl,
  '2xl': shadows['2xl'],
};
const IGNORED =
  /^(transition|duration-|ease|animate-|delay-|press$|lift$|sheen$|float$|fade-in|pop-in|sweep-up|stagger$|slide-in|hide-scroll|select-|cursor-|touch-|will-change|backdrop-|blur|group$|outline-|resize-|appearance-|block$|inline$|inline-block$|grid$|grid-cols|grid-rows|col-|row-|snap-|divide|truncate$|whitespace-|object-|break-|scale|rotate|-?translate|origin|transform$|filter$|isolate|antialiased|shimmer$|glow-|navic|bell-live|wr$|num-?$|sr-only|list-|content-\[|underline-offset|decoration-|text-ellipsis|font-sans$|font-mono$|static$|visible$|sticky$|ring-offset|ring-inset)/;

const DIRS: Record<string, string> = {
  t: 'to top',
  b: 'to bottom',
  l: 'to left',
  r: 'to right',
  tr: 'to top right',
  tl: 'to top left',
  br: 'to bottom right',
  bl: 'to bottom left',
};

/** Spacing value: `4` → 16, `0.5` → 2, `px` → 1, `[18px]` → 18, `1/2` → '50%', `full` → '100%'. */
function sizeValue(raw: string): number | string | undefined {
  if (raw === 'px') return 1;
  if (raw === 'full') return '100%';
  if (raw === 'auto') return 'auto';
  if (raw === 'screen') return '100%';
  const arb = raw.match(/^\[(-?[\d.]+)(px|%)?\]$/);
  if (arb) return arb[2] === '%' ? `${arb[1]}%` : Number(arb[1]);
  const frac = raw.match(/^(\d+)\/(\d+)$/);
  if (frac) return `${(Number(frac[1]) / Number(frac[2])) * 100}%`;
  if (/^\d+(\.\d+)?$/.test(raw)) return Number(raw) * 4;
  return undefined;
}

function negate(
  v: number | string | undefined,
  neg: boolean,
): number | string | undefined {
  if (!neg || v === undefined) return v;
  if (typeof v === 'number') return -v;
  if (v.endsWith('%')) return `-${v}`;
  return v;
}

/** Color token: `brand-600`, `white/70`, `[#24466F]`, `transparent`. Returns undefined for unknown tokens. */
export function colorValue(raw: string): string | undefined {
  const [base, alphaRaw] = raw.split('/');
  const alpha = alphaRaw === undefined ? undefined : Number(alphaRaw) / 100;
  let hex: string | undefined;
  if (base === 'transparent') return 'transparent';
  if (base === 'white') hex = palette.white;
  else if (base === 'black') hex = palette.black;
  else if (/^\[#[0-9a-fA-F]{3,8}\]$/.test(base)) hex = base.slice(1, -1);
  else {
    const m = base.match(/^([a-z]+)-(\d+)$/);
    if (m) {
      const fam = (
        palette as unknown as Record<string, Record<string, string>>
      )[m[1]];
      hex = fam && typeof fam === 'object' ? fam[m[2]] : undefined;
    }
  }
  if (!hex) return undefined;
  return alpha === undefined ? hex : withAlpha(hex, alpha);
}

const arbitraryCss = (raw: string) => raw.slice(1, -1).replace(/_/g, ' ');

function apply(acc: Acc, token: string) {
  const s = acc.style;
  if (!token || token.includes(':') || IGNORED.test(token)) return;
  const neg = token.startsWith('-');
  const t = neg ? token.slice(1) : token;

  // ── Custom reference classes ──
  if (t === 'num') {
    s.fontVariant = ['tabular-nums'];
    return;
  }
  if (t === 'font-display') {
    acc.display = true;
    return;
  }
  const elev = t.match(/^elev-(1|2|3|brand)$/);
  if (elev) {
    acc.elev = ELEV[elev[1]];
    return;
  }
  if (t === 'glass') {
    acc.glass = 'rgba(255,255,255,0.72)';
    return;
  }
  if (t === 'glass-dark') {
    acc.glass = 'rgba(9,14,30,0.55)';
    return;
  }
  const mesh = t.match(/^mesh-(brand|warm|mint)$/);
  if (mesh) {
    s.experimental_backgroundImage = meshes[mesh[1] as keyof typeof meshes];
    return;
  }
  if (t === 'bg-map') {
    s.experimental_backgroundImage = meshes.map;
    return;
  }

  // ── Layout ──
  switch (t) {
    case 'flex':
    case 'flex-row':
    case 'inline-flex':
      s.flexDirection = 'row';
      if (t === 'inline-flex') s.alignSelf = 'flex-start';
      return;
    case 'inline-grid':
      s.alignSelf = 'flex-start';
      return;
    case 'flex-col':
      s.flexDirection = 'column';
      return;
    case 'flex-1':
      s.flex = 1;
      return;
    case 'flex-auto':
      s.flexGrow = 1;
      s.flexShrink = 1;
      return;
    case 'flex-none':
      s.flex = 0;
      return;
    case 'flex-wrap':
      s.flexWrap = 'wrap';
      return;
    case 'grow':
      s.flexGrow = 1;
      return;
    case 'shrink-0':
    case 'flex-shrink-0':
      s.flexShrink = 0;
      return;
    case 'shrink':
      s.flexShrink = 1;
      return;
    case 'items-center':
      s.alignItems = 'center';
      return;
    case 'items-start':
      s.alignItems = 'flex-start';
      return;
    case 'items-end':
      s.alignItems = 'flex-end';
      return;
    case 'items-stretch':
      s.alignItems = 'stretch';
      return;
    case 'items-baseline':
      s.alignItems = 'baseline';
      return;
    case 'justify-center':
      s.justifyContent = 'center';
      return;
    case 'justify-between':
      s.justifyContent = 'space-between';
      return;
    case 'justify-start':
      s.justifyContent = 'flex-start';
      return;
    case 'justify-end':
      s.justifyContent = 'flex-end';
      return;
    case 'justify-around':
      s.justifyContent = 'space-around';
      return;
    case 'self-center':
      s.alignSelf = 'center';
      return;
    case 'self-start':
      s.alignSelf = 'flex-start';
      return;
    case 'self-end':
      s.alignSelf = 'flex-end';
      return;
    case 'self-stretch':
      s.alignSelf = 'stretch';
      return;
    case 'place-items-center':
      s.alignItems = 'center';
      s.justifyContent = 'center';
      return;
    case 'absolute':
    case 'fixed':
      s.position = 'absolute';
      return;
    case 'relative':
      s.position = 'relative';
      return;
    case 'overflow-hidden':
    case 'overflow-x-auto':
    case 'overflow-y-auto':
    case 'overflow-auto':
      if (t === 'overflow-hidden') s.overflow = 'hidden';
      return;
    case 'overflow-visible':
      s.overflow = 'visible';
      return;
    case 'hidden':
      s.display = 'none';
      return;
    case 'mx-auto':
      s.alignSelf = 'center';
      return;
    case 'ml-auto':
      s.marginLeft = 'auto';
      return;
    case 'mr-auto':
      s.marginRight = 'auto';
      return;
    case 'aspect-square':
      s.aspectRatio = 1;
      return;
    case 'aspect-video':
      s.aspectRatio = 16 / 9;
      return;
    case 'pointer-events-none':
      s.pointerEvents = 'none';
      return;
    case 'pointer-events-auto':
      s.pointerEvents = 'auto';
      return;
    case 'uppercase':
      s.textTransform = 'uppercase';
      return;
    case 'lowercase':
      s.textTransform = 'lowercase';
      return;
    case 'capitalize':
      s.textTransform = 'capitalize';
      return;
    case 'normal-case':
      s.textTransform = 'none';
      return;
    case 'underline':
      s.textDecorationLine = 'underline';
      return;
    case 'line-through':
      s.textDecorationLine = 'line-through';
      return;
    case 'italic':
      s.fontStyle = 'italic';
      return;
    case 'text-center':
      s.textAlign = 'center';
      return;
    case 'text-left':
      s.textAlign = 'left';
      return;
    case 'text-right':
      s.textAlign = 'right';
      return;
    case 'grayscale':
      s.filter = 'grayscale(1)';
      return;
    case 'border-dashed':
      s.borderStyle = 'dashed';
      return;
    case 'border-dotted':
      s.borderStyle = 'dotted';
      return;
    case 'bg-gradient-to-b':
    case 'bg-gradient-to-r':
    case 'bg-gradient-to-t':
    case 'bg-gradient-to-l':
    case 'bg-gradient-to-br':
    case 'bg-gradient-to-bl':
    case 'bg-gradient-to-tr':
    case 'bg-gradient-to-tl':
      acc.gradientDir = DIRS[t.replace('bg-gradient-to-', '')];
      return;
  }

  let m: RegExpMatchArray | null;

  // aspect-[4/5]
  if ((m = t.match(/^aspect-\[(\d+)\/(\d+)\]$/))) {
    s.aspectRatio = Number(m[1]) / Number(m[2]);
    return;
  }

  // ── Spacing ──
  const SPACING: Record<string, string[]> = {
    p: ['padding'],
    px: ['paddingHorizontal'],
    py: ['paddingVertical'],
    pt: ['paddingTop'],
    pb: ['paddingBottom'],
    pl: ['paddingLeft'],
    pr: ['paddingRight'],
    m: ['margin'],
    mx: ['marginHorizontal'],
    my: ['marginVertical'],
    mt: ['marginTop'],
    mb: ['marginBottom'],
    ml: ['marginLeft'],
    mr: ['marginRight'],
    gap: ['gap'],
    'gap-x': ['columnGap'],
    'gap-y': ['rowGap'],
    'space-y': ['rowGap'],
    'space-x': ['columnGap'],
    w: ['width'],
    h: ['height'],
    size: ['width', 'height'],
    'min-w': ['minWidth'],
    'min-h': ['minHeight'],
    'max-w': ['maxWidth'],
    'max-h': ['maxHeight'],
    top: ['top'],
    bottom: ['bottom'],
    left: ['left'],
    right: ['right'],
    inset: ['top', 'right', 'bottom', 'left'],
    'inset-x': ['left', 'right'],
    'inset-y': ['top', 'bottom'],
  };
  if (
    (m = t.match(
      /^(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap-x|gap-y|gap|space-y|space-x|w|h|size|min-w|min-h|max-w|max-h|top|bottom|left|right|inset-x|inset-y|inset)-(.+)$/,
    ))
  ) {
    const [, key, rawVal] = m;
    let v: number | string | undefined;
    if (key === 'max-w' && rawVal === 'sm') v = 384;
    else if (key === 'top' && rawVal === 'full') v = '100%';
    else v = sizeValue(rawVal);
    if (v === undefined) return;
    if ((key === 'space-y' || key === 'space-x') && neg) return; // overlap stacks are composed manually
    for (const prop of SPACING[key]) s[prop] = negate(v, neg);
    return;
  }

  // ── Z index / opacity ──
  if ((m = t.match(/^z-(\d+|\[\d+\])$/))) {
    s.zIndex = Number(m[1].replace(/[[\]]/g, ''));
    return;
  }
  if ((m = t.match(/^opacity-(\d+)$/))) {
    s.opacity = Number(m[1]) / 100;
    return;
  }

  // ── Radius ──
  if ((m = t.match(/^rounded(?:-(t|b|l|r|tl|tr|bl|br))?(?:-(.+))?$/))) {
    const [, side, size = ''] = m;
    const arb = size.match(/^\[(\d+(?:\.\d+)?)px\]$/);
    const r = arb ? Number(arb[1]) : RADII[size];
    if (r === undefined) return;
    const sides: Record<string, string[]> = {
      '': ['borderRadius'],
      t: ['borderTopLeftRadius', 'borderTopRightRadius'],
      b: ['borderBottomLeftRadius', 'borderBottomRightRadius'],
      l: ['borderTopLeftRadius', 'borderBottomLeftRadius'],
      r: ['borderTopRightRadius', 'borderBottomRightRadius'],
      tl: ['borderTopLeftRadius'],
      tr: ['borderTopRightRadius'],
      bl: ['borderBottomLeftRadius'],
      br: ['borderBottomRightRadius'],
    };
    for (const prop of sides[side ?? '']) s[prop] = r;
    return;
  }

  // ── Border ──
  if ((m = t.match(/^border(?:-(t|b|l|r|x|y))?(?:-(\d+|\[\d+px\]))?$/))) {
    const [, side, w] = m;
    const width = w === undefined ? 1 : Number(w.replace(/[[\]px]/g, ''));
    const sides: Record<string, string[]> = {
      '': ['borderWidth'],
      t: ['borderTopWidth'],
      b: ['borderBottomWidth'],
      l: ['borderLeftWidth'],
      r: ['borderRightWidth'],
      x: ['borderLeftWidth', 'borderRightWidth'],
      y: ['borderTopWidth', 'borderBottomWidth'],
    };
    for (const prop of sides[side ?? '']) s[prop] = width;
    return;
  }
  if ((m = t.match(/^border-(.+)$/))) {
    const c = colorValue(m[1]);
    if (c) s.borderColor = c;
    return;
  }

  // ── Ring (outline drawn as a spread shadow) ──
  if ((m = t.match(/^ring(?:-(\d+|\[\d+px\]))?$/))) {
    acc.ringWidth =
      m[1] === undefined ? 1 : Number(m[1].replace(/[[\]px]/g, ''));
    return;
  }
  if ((m = t.match(/^ring-(.+)$/))) {
    const c = colorValue(m[1]);
    if (c) acc.ringColor = c;
    return;
  }

  // ── Shadow ──
  if ((m = t.match(/^shadow(?:-(sm|md|lg|xl|2xl))?$/))) {
    acc.shadow = SHADOW[m[1] ?? ''];
    return;
  }
  if ((m = t.match(/^shadow-(\[.+\])$/))) {
    acc.shadow = arbitraryCss(m[1]);
    return;
  }

  // ── Background ──
  if ((m = t.match(/^bg-\[(linear|radial)-gradient\((.+)\)\]$/))) {
    s.experimental_backgroundImage = `${m[1]}-gradient(${m[2].replace(
      /_/g,
      ' ',
    )})`;
    return;
  }
  if ((m = t.match(/^bg-(.+)$/))) {
    const c = colorValue(m[1]);
    if (c) s.backgroundColor = c;
    return;
  }
  if ((m = t.match(/^(from|via|to)-(.+)$/))) {
    const c = colorValue(m[2]);
    if (!c) return;
    if (m[1] === 'from') acc.gradientFrom = c;
    else if (m[1] === 'via') acc.gradientVia = c;
    else acc.gradientTo = c;
    return;
  }

  // ── Typography ──
  if ((m = t.match(/^text-\[(\d+(?:\.\d+)?)px\]$/))) {
    acc.fontSize = Number(m[1]);
    acc.lineHeightPx = undefined;
    return;
  }
  if ((m = t.match(/^text-(xs|sm|base|lg|xl|2xl|3xl)$/))) {
    const [size, lh] = TEXT_SIZES[m[1]];
    acc.fontSize = size;
    acc.lineHeightPx = lh;
    return;
  }
  if ((m = t.match(/^text-(.+)$/))) {
    const c = colorValue(m[1]);
    if (c) s.color = c;
    return;
  }
  if ((m = t.match(/^font-(normal|medium|semibold|bold|extrabold|black)$/))) {
    acc.weight = WEIGHTS[m[1]];
    return;
  }
  if ((m = t.match(/^leading-(.+)$/))) {
    const arb = m[1].match(/^\[([\d.]+)\]$/);
    acc.leading = arb ? Number(arb[1]) : LEADING[m[1]];
    acc.lineHeightPx = undefined;
    return;
  }
  if ((m = t.match(/^tracking-(.+)$/))) {
    const arb = m[1].match(/^\[(-?[\d.]+)em\]$/);
    acc.trackingEm = arb ? Number(arb[1]) : TRACKING[m[1]];
    return;
  }
}

function finish(acc: Acc): TwStyle {
  const s = acc.style;
  const isText =
    acc.fontSize !== undefined ||
    acc.weight !== undefined ||
    acc.display ||
    acc.leading !== undefined ||
    acc.trackingEm !== undefined;
  if (isText) {
    const size = acc.fontSize ?? 16;
    if (acc.fontSize !== undefined) s.fontSize = size;
    if (acc.weight !== undefined || acc.display)
      s.fontFamily = fontFor(acc.weight ?? 400, acc.display);
    if (acc.leading !== undefined)
      s.lineHeight = Math.round(acc.leading * size * 100) / 100;
    else if (acc.lineHeightPx !== undefined) s.lineHeight = acc.lineHeightPx;
    else if (acc.fontSize !== undefined)
      s.lineHeight = Math.round(BODY_LEADING * size * 100) / 100;
    const em = acc.display ? DISPLAY_TRACKING_EM : acc.trackingEm;
    if (em !== undefined) s.letterSpacing = Math.round(em * size * 1000) / 1000;
  }
  if (acc.glass) s.backgroundColor = acc.glass;
  if (acc.gradientDir && acc.gradientFrom) {
    const stops = [
      acc.gradientFrom,
      acc.gradientVia,
      acc.gradientTo ?? 'transparent',
    ]
      .filter(Boolean)
      .join(', ');
    s.experimental_backgroundImage = `linear-gradient(${acc.gradientDir}, ${stops})`;
  }
  if (acc.elev) s.boxShadow = acc.elev;
  else {
    const parts: string[] = [];
    if (acc.ringWidth !== undefined)
      parts.push(
        `0 0 0 ${acc.ringWidth}px ${acc.ringColor ?? 'rgba(15,23,42,0.1)'}`,
      );
    if (acc.shadow) parts.push(acc.shadow);
    if (parts.length) s.boxShadow = parts.join(', ');
  }
  return s as TwStyle;
}

const cache = new Map<string, TwStyle>();

/** Compile a reference class list (falsy entries are skipped) into a style object. */
export function tw(
  ...classLists: Array<string | false | null | undefined>
): TwStyle {
  const key = classLists.filter(Boolean).join(' ');
  const hit = cache.get(key);
  if (hit) return hit;
  const acc: Acc = { style: {}, display: false };
  for (const token of key.split(/\s+/)) apply(acc, token);
  const result = finish(acc);
  cache.set(key, result);
  return result;
}

/** Display-heading variant: h1–h3 in the reference render in Bricolage with -.021em tracking. */
export function twh(
  ...classLists: Array<string | false | null | undefined>
): TwStyle {
  return tw('font-display', ...classLists);
}
