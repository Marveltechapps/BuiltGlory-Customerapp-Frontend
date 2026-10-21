// Brand + ink tokens come from the reference's Tailwind @theme block.
// The other families are Tailwind v4 defaults (OKLCH) converted to sRGB hex.
export const palette = {
  brand: {
    50: '#EEF4FF',
    100: '#D1E3FF',
    200: '#A3C7FF',
    300: '#75ABFF',
    400: '#4A8CFF',
    500: '#1A6FFF',
    600: '#1A6FFF',
    700: '#1259D4',
    800: '#0E4AA8',
    900: '#0A3270',
  },
  ink: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    700: '#334155',
    900: '#0F172A',
  },
  emerald: {
    50: '#ECFDF5',
    100: '#D0FAE5',
    200: '#A4F4CF',
    300: '#5EE9B5',
    400: '#00D492',
    500: '#00BC7D',
    600: '#009966',
    700: '#007A55',
    800: '#006045',
    900: '#004F3B',
  },
  amber: {
    50: '#FFFBEB',
    100: '#FEF3C6',
    200: '#FEE685',
    300: '#FFD230',
    400: '#FFBA00',
    500: '#FD9A00',
    600: '#E17100',
    700: '#BB4D00',
    800: '#973C00',
    900: '#7B3306',
  },
  rose: {
    50: '#FFF1F2',
    100: '#FFE4E6',
    200: '#FFCCD3',
    300: '#FFA1AD',
    400: '#FF637E',
    500: '#FF2056',
    600: '#EC003F',
    700: '#C70036',
    800: '#A50036',
    900: '#8B0836',
  },
  violet: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FF',
    300: '#C4B4FF',
    400: '#A684FF',
    500: '#8E51FF',
    600: '#7F22FE',
    700: '#7008E7',
    800: '#5D0EC0',
    900: '#4D179A',
  },
  blue: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BEDBFF',
    300: '#8EC5FF',
    400: '#51A2FF',
    500: '#2B7FFF',
    600: '#155DFC',
    700: '#1447E6',
    800: '#193CB8',
    900: '#1C398E',
  },
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type ColorFamily = Exclude<keyof typeof palette, 'white' | 'black'>;

export const colors = {
  background: '#FFFFFF',
  text: palette.ink[900],
  surface: '#FFFFFF',
  border: palette.ink[200],
  brand: palette.brand[600],
  brandDark: palette.brand[700],
  muted: palette.ink[500],
  danger: '#E11D48',
  success: '#10B981',
  warning: '#F59E0B',
  frame: '#0B1020',
};

/** `withAlpha('#1A6FFF', 0.2)` → `rgba(26,111,255,0.2)` */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map(c => c + c)
          .join('')
      : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
