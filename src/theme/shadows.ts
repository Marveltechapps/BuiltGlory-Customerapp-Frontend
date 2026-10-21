// CSS box-shadow strings from the reference; React Native 0.83 renders them via `boxShadow`.
export const shadows = {
  elev1: '0 1px 2px rgba(15,23,42,.05), 0 1px 3px rgba(15,23,42,.04)',
  elev2: '0 2px 4px rgba(15,23,42,.05), 0 6px 16px -4px rgba(15,23,42,.09)',
  elev3: '0 8px 28px -6px rgba(15,23,42,.16), 0 2px 6px rgba(15,23,42,.06)',
  elevBrand:
    '0 6px 18px -4px rgba(26,111,255,.45), 0 2px 4px rgba(26,111,255,.2)',
  sm: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
  md: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  lg: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
  xl: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
  '2xl': '0 25px 50px -12px rgba(0,0,0,0.25)',
};

// Gradient surfaces from the reference (.mesh-brand, .mesh-warm, .mesh-mint, .bg-map).
export const meshes = {
  brand:
    'radial-gradient(110% 80% at 8% 0%, #2C7BFF 0%, transparent 55%), radial-gradient(95% 85% at 100% 8%, #6E4BFF 0%, transparent 52%), linear-gradient(150deg, #123E9C, #0B1E46)',
  warm: 'radial-gradient(100% 80% at 0% 0%, #FFD9A8 0%, transparent 55%), radial-gradient(90% 80% at 100% 20%, #FFB3C7 0%, transparent 50%), linear-gradient(140deg, #FFF3E4, #FFE9F0)',
  mint: 'radial-gradient(100% 80% at 10% 0%, #A8F0D2 0%, transparent 55%), radial-gradient(90% 80% at 100% 30%, #BEE3FF 0%, transparent 52%), linear-gradient(140deg, #EAFBF3, #E8F4FF)',
  map: 'radial-gradient(circle at 30% 20%, #C7E0F4 0%, transparent 40%), radial-gradient(circle at 80% 60%, #E5F3DC 0%, transparent 45%), radial-gradient(circle at 50% 90%, #FAEED5 0%, transparent 40%), linear-gradient(135deg, #EAF0F6, #DDE6EE)',
};

export const gradients = {
  primary: 'linear-gradient(135deg, #3B86FF, #1A6FFF 55%, #1259D4)',
  primarySoft: 'linear-gradient(135deg, #3B86FF, #1A6FFF)',
  buyTile: 'linear-gradient(135deg, #3B86FF, #1259D4)',
  logo: 'linear-gradient(140deg, #4A8CFF, #1A6FFF 55%, #0E4AA8)',
  dark: 'linear-gradient(135deg, #243247, #0F172A)',
  danger: 'linear-gradient(135deg, #F2536B, #E11D48)',
  success: 'linear-gradient(135deg, #34D399, #10B981)',
  successDeep: 'linear-gradient(135deg, #34D399, #059669)',
  warn: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
  bar: 'linear-gradient(90deg, #4A8CFF, #1A6FFF)',
  bottomFade: 'linear-gradient(to top, rgba(8,14,32,.42), transparent)',
};
