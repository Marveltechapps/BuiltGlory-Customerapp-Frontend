// CSS gradient strings from the design, rendered with React Native's
// experimental_backgroundImage. Fades use the colour at zero alpha instead of
// `transparent` so the midpoint does not darken.

export const gradients = {
  primary: 'linear-gradient(135deg, #3B86FF, #1A6FFF 55%, #1259D4)',
  primarySoft: 'linear-gradient(135deg, #3B86FF, #1A6FFF)',
  dark: 'linear-gradient(135deg, #243247, #0F172A)',
  danger: 'linear-gradient(135deg, #F2536B, #E11D48)',
  brandBar: 'linear-gradient(90deg, #4A8CFF, #1A6FFF)',
  brandRule: 'linear-gradient(180deg, #4A8CFF, #1A6FFF)',
  success: 'linear-gradient(135deg, #34D399, #10B981)',
  warn: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
  meshBrand:
    'radial-gradient(110% 80% at 8% 0%, #2C7BFF 0%, rgba(44,123,255,0) 55%), radial-gradient(95% 85% at 100% 8%, #6E4BFF 0%, rgba(110,75,255,0) 52%), linear-gradient(150deg, #123E9C, #0B1E46)',
  meshWarm:
    'radial-gradient(100% 80% at 0% 0%, #FFD9A8 0%, rgba(255,217,168,0) 55%), radial-gradient(90% 80% at 100% 20%, #FFB3C7 0%, rgba(255,179,199,0) 50%), linear-gradient(140deg, #FFF3E4, #FFE9F0)',
  meshMint:
    'radial-gradient(100% 80% at 10% 0%, #A8F0D2 0%, rgba(168,240,210,0) 55%), radial-gradient(90% 80% at 100% 30%, #BEE3FF 0%, rgba(190,227,255,0) 52%), linear-gradient(140deg, #EAFBF3, #E8F4FF)',
  photoShade: 'linear-gradient(0deg, rgba(8,14,32,0.42), rgba(8,14,32,0))',
  map:
    'radial-gradient(circle at 30% 20%, #C7E0F4 0%, rgba(199,224,244,0) 40%), radial-gradient(circle at 80% 60%, #E5F3DC 0%, rgba(229,243,220,0) 45%), radial-gradient(circle at 50% 90%, #FAEED5 0%, rgba(250,238,213,0) 40%), linear-gradient(135deg, #EAF0F6, #DDE6EE)',
} as const;

/** Hex → rgba string at zero alpha, for gradient fades. */
export function clear(hex: string): string {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},0)`;
}

/** Ambient tint per flow, from the design's [data-flow] rules. */
export const flowTints = {
  home: { tint: '#EEF4FF', blobA: '#BFD6FF', blobB: '#D9E6FF' },
  buy: { tint: '#EEF4FF', blobA: '#C3D8FF', blobB: '#DCE8FF' },
  sell: { tint: '#EAFBF3', blobA: '#B4F0D3', blobB: '#D5F7E6' },
  account: { tint: '#F3F0FF', blobA: '#D6CCFF', blobB: '#E7E1FF' },
} as const;

export type Flow = keyof typeof flowTints;
