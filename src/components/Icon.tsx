import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, {
  Circle,
  Ellipse,
  Line,
  Path,
  Polygon,
  Polyline,
  Rect,
} from 'react-native-svg';
import { ICON_NODES, type IconName } from './iconNodes';

export type { IconName };

const ELEMENTS = {
  path: Path,
  circle: Circle,
  rect: Rect,
  line: Line,
  polyline: Polyline,
  polygon: Polygon,
  ellipse: Ellipse,
} as const;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  /** Solid fill (the reference fills the heart when saved). */
  fill?: string;
  style?: StyleProp<ViewStyle>;
}

/** Lucide line icon rendered with react-native-svg (24×24 grid, round caps), as in the reference. */
export function Icon({
  name,
  size = 20,
  color = '#0F172A',
  strokeWidth = 2,
  fill = 'none',
  style,
}: IconProps) {
  const node = ICON_NODES[name] as unknown as ReadonlyArray<
    readonly [keyof typeof ELEMENTS, Record<string, string | number>]
  >;
  if (!node) return null;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {node.map(([tag, attrs], i) => {
        const Element = ELEMENTS[tag] as React.ComponentType<
          Record<string, unknown>
        >;
        return <Element key={i} {...attrs} />;
      })}
    </Svg>
  );
}
