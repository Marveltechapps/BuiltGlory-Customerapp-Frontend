// Box shadows from the design's elevation classes. React Native 0.83 renders
// CSS box-shadow strings natively on Android and iOS.

export const elev = {
  e1: '0 1px 2px rgba(15,23,42,0.05), 0 1px 3px rgba(15,23,42,0.04)',
  e2: '0 2px 4px rgba(15,23,42,0.05), 0 6px 16px -4px rgba(15,23,42,0.09)',
  e3: '0 8px 28px -6px rgba(15,23,42,0.16), 0 2px 6px rgba(15,23,42,0.06)',
  brand: '0 6px 18px -4px rgba(26,111,255,0.45), 0 2px 4px rgba(26,111,255,0.2)',
  md: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  lg: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
  xl: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
  sm: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
} as const;

/** Tailwind ring-N: a spread-only shadow that sits outside the box without changing layout. */
export function ring(color: string, width = 1): string {
  return `0 0 0 ${width}px ${color}`;
}

/** Combine several shadow strings into one box-shadow value. */
export function shadows(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(', ');
}
