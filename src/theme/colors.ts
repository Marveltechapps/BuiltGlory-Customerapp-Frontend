// Starter tokens (used by the sample feature) plus the Builtglory design palette.
// brand / ink come from the design's @theme block. The other families are the
// Tailwind v4.1 defaults the design renders with, converted from OKLCH to sRGB hex.
export const colors = {
  background: '#f5f7fa',
  text: '#172033',
  surface: '#ffffff',
  border: '#dfe4eb',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  brand: '#1A6FFF',
  brand50: '#EEF4FF',
  brand100: '#D1E3FF',
  brand200: '#A3C7FF',
  brand300: '#75ABFF',
  brand400: '#4A8CFF',
  brand500: '#1A6FFF',
  brand600: '#1A6FFF',
  brand700: '#1259D4',
  brand800: '#0E4AA8',
  brand900: '#0A3270',

  ink50: '#F8FAFC',
  ink100: '#F1F5F9',
  ink200: '#E2E8F0',
  ink300: '#CBD5E1',
  ink400: '#94A3B8',
  ink500: '#64748B',
  // The design's theme defines no ink-600 / ink-800, so Tailwind emits nothing
  // for text-ink-600 / text-ink-800 and that text renders in the inherited ink-900.
  ink600: '#0F172A',
  ink700: '#334155',
  ink800: '#0F172A',
  ink900: '#0F172A',

  emerald50: '#ECFDF5',
  emerald100: '#D0FAE5',
  emerald200: '#A4F4CF',
  emerald300: '#5EE9B5',
  emerald400: '#00D492',
  emerald500: '#00BC7D',
  emerald600: '#009966',
  emerald700: '#007A55',
  emerald800: '#006045',

  amber50: '#FFFBEB',
  amber100: '#FEF3C6',
  amber200: '#FEE685',
  amber300: '#FFD230',
  amber400: '#FFB900',
  amber500: '#FE9A00',
  amber600: '#E17100',
  amber700: '#BB4D00',
  amber800: '#973C00',
  amber900: '#7B3306',

  rose50: '#FFF1F2',
  rose100: '#FFE4E6',
  rose200: '#FFCCD3',
  rose300: '#FFA1AD',
  rose400: '#FF637E',
  rose500: '#FF2056',
  rose600: '#EC003F',
  rose700: '#C70036',
  rose800: '#A50036',

  violet50: '#F5F3FF',
  violet100: '#EDE9FE',
  violet200: '#DDD6FF',
  violet500: '#8E51FF',
  violet700: '#7008E7',

  blue50: '#EFF6FF',
  blue200: '#BEDBFF',
  blue600: '#155DFC',
  blue700: '#1447E6',
  blue900: '#1C398E',

  sky50: '#F0F9FF',
  sky600: '#0084D1',
  orange50: '#FFF7ED',
  orange500: '#FF6900',
  teal50: '#F0FDFA',
  teal600: '#009689',
  pink50: '#FDF2F8',
  pink500: '#F6339A',
  indigo50: '#EEF2FF',
  indigo600: '#4F39F6',
} as const;

export type ColorToken = keyof typeof colors;

/** Hex colour with an alpha channel, e.g. alpha('#0F172A', 0.45) → rgba(15,23,42,0.45). */
export function alpha(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
