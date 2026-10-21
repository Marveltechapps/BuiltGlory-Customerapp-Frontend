export const spacing = { small: 8, medium: 16, large: 24 };

/** Tailwind spacing scale used by the design reference: 1 step = 4px. */
export const space = (steps: number) => steps * 4;

export const radius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  card: 14,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
};

/** Fixed chrome sizes from the 375×812 reference frame. */
export const layout = {
  frameWidth: 375,
  topBar: 48,
  bottomNav: 64,
  gutter: 16,
};
