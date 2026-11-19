import { palette } from '../src/theme/colors';
import { tw, twh } from '../src/theme/tw';

describe('tw compiler', () => {
  it('compiles spacing, radius and colors from the theme', () => {
    const s = tw('px-4 py-2.5 rounded-card bg-brand-600 border border-ink-200');
    expect(s.paddingHorizontal ?? s.paddingLeft).toBe(16);
    expect(s.paddingVertical ?? s.paddingTop).toBe(10);
    expect(s.borderRadius).toBe(14);
    expect(s.backgroundColor).toBe(palette.brand[600]);
    expect(s.borderWidth).toBe(1);
    expect(s.borderColor).toBe(palette.ink[200]);
  });

  it('compiles arbitrary text sizes with the body line-height', () => {
    const s = tw('text-[13px] font-semibold text-ink-500');
    expect(s.fontSize).toBe(13);
    expect(s.lineHeight).toBeCloseTo(13 * 1.5);
    expect(s.color).toBe(palette.ink[500]);
    expect(typeof s.fontFamily).toBe('string');
  });

  it('lets undefined ink shades inherit instead of inventing a color', () => {
    expect(tw('text-ink-600').color).toBeUndefined();
    expect(tw('text-ink-800').color).toBeUndefined();
  });

  it('applies display tracking for headings', () => {
    const s = twh('text-[20px] font-bold');
    expect(s.letterSpacing).toBeCloseTo(20 * -0.021);
  });

  it('maps flex helpers to React Native layout', () => {
    const s = tw('flex items-center justify-between gap-2');
    expect(s.flexDirection).toBe('row');
    expect(s.alignItems).toBe('center');
    expect(s.justifyContent).toBe('space-between');
    expect(s.gap).toBe(8);
  });
});
