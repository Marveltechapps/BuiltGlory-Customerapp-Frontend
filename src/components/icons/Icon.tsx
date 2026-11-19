import React, { memo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg';
import { iconNodes } from './iconNodes';

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  /** Fill colour (the design fills hearts and stars when active). */
  fill?: string;
  style?: StyleProp<ViewStyle>;
}

const tags = { path: Path, circle: Circle, rect: Rect, line: Line, polyline: Polyline, polygon: Polygon } as const;

/** Lucide icon drawn with react-native-svg, same glyphs as the design (lucide 0.378). */
export const Icon = memo(function Icon({ name, size = 20, color = '#0F172A', strokeWidth = 2, fill = 'none', style }: IconProps) {
  const node = iconNodes[name];
  if (!node) return <View style={[{ width: size, height: size }, style]} />;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {node.map(([tag, attrs], i) => {
        const El = tags[tag as keyof typeof tags] as React.ComponentType<Record<string, unknown>> | undefined;
        return El ? <El key={i} {...attrs} /> : null;
      })}
    </Svg>
  );
});
