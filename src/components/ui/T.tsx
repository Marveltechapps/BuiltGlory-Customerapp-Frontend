import React, { createContext, useContext } from 'react';
import { Text, type TextProps, type TextStyle, type StyleProp } from 'react-native';
import { colors, fontFamily, tabular, type, type Weight } from '../../theme';

const InText = createContext(false);

export interface TProps extends TextProps {
  /** Font size in px. */
  s?: number;
  /** Font weight. */
  w?: Weight;
  /** Text colour. */
  c?: string;
  /** Bricolage Grotesque display face. */
  display?: boolean;
  /** Line-height factor (default 1.5). */
  lh?: number;
  /** Letter spacing in em. */
  ls?: number;
  /** Tabular numerals (.num). */
  num?: boolean;
  align?: TextStyle['textAlign'];
  upper?: boolean;
  /** Single line with ellipsis (Tailwind truncate). */
  truncate?: boolean;
  style?: StyleProp<TextStyle>;
}

const cache = new Map<string, TextStyle>();

function styleFor(p: TProps, nested: boolean): TextStyle {
  const key = [nested ? 1 : 0, p.s, p.w, p.c, p.display ? 1 : 0, p.lh, p.ls, p.num ? 1 : 0, p.align, p.upper ? 1 : 0].join('|');
  const hit = cache.get(key);
  if (hit) return hit;
  let st: TextStyle;
  if (nested) {
    // Inline spans inherit from their parent Text; only apply what was given.
    st = {};
    if (p.s != null) st.fontSize = p.s;
    if (p.w != null || p.display) st.fontFamily = fontFamily(p.w ?? 400, !!p.display);
    if (p.c) st.color = p.c;
    if (p.ls != null && p.s != null) st.letterSpacing = p.s * p.ls;
  } else {
    st = { ...type(p.s ?? 16, p.w ?? 400, { display: p.display, lh: p.lh, ls: p.ls }), color: p.c ?? colors.ink900 };
  }
  if (p.num) Object.assign(st, tabular);
  if (p.align) st.textAlign = p.align;
  if (p.upper) st.textTransform = 'uppercase';
  cache.set(key, st);
  return st;
}

/** Text with the design's type scale. Nested T inherits like an inline span. */
export function T(props: TProps) {
  const nested = useContext(InText);
  // Strip the type-scale props so they never reach <Text>.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { s, w, c, display, lh, ls, num, align, upper, truncate, style, children, ...rest } = props;
  const text = (
    <Text
      {...rest}
      numberOfLines={truncate ? 1 : rest.numberOfLines}
      style={[styleFor(props, nested), style]}>
      {children}
    </Text>
  );
  return nested ? text : <InText.Provider value>{text}</InText.Provider>;
}
