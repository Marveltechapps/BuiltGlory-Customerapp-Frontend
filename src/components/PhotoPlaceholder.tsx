import React, { useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { gradients } from '../theme';
import { photoFor } from '../utils/photos';

const PALETTES: [string, string][] = [
  ['#60A5FA', '#3B82F6'],
  ['#34D399', '#10B981'],
  ['#FBBF24', '#F59E0B'],
  ['#F472B6', '#EC4899'],
  ['#A78BFA', '#8B5CF6'],
  ['#FB7185', '#E11D48'],
  ['#22D3EE', '#0891B2'],
  ['#FCA5A5', '#EF4444'],
];

const fade = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},0)`;
};

export interface PhotoPlaceholderProps {
  tag?: string;
  gradient?: [string, string];
  height?: DimensionValue;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  src?: string;
  noPhoto?: boolean;
  w?: number;
  /** Hide the bottom shade (the design always draws it). */
  noShade?: boolean;
}

/**
 * Property photo with a seeded gradient behind it. The photo fades in when it
 * loads; if it fails, the gradient and a hill silhouette stay.
 */
export function PhotoPlaceholder({ tag = '', gradient, height, style, children, src, noPhoto, w = 800, noShade }: PhotoPlaceholderProps) {
  const seed = tag.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const [c1, c2] = gradient ?? PALETTES[seed % PALETTES.length];
  const photo = noPhoto ? null : src ?? photoFor(tag, w);
  const [failed, setFailed] = useState(false);
  const loaded = useRef(new Animated.Value(0)).current;
  const showPhoto = !!photo && !failed;
  const bg = `radial-gradient(120% 90% at 12% 0%, ${c1} 0%, ${fade(c1)} 58%), radial-gradient(110% 95% at 100% 15%, ${c2} 0%, ${fade(c2)} 55%), linear-gradient(145deg, ${c1}, ${c2})`;
  return (
    <View style={[styles.root, { height, experimental_backgroundImage: bg }, style]}>
      {showPhoto ? (
        <Animated.Image
          source={{ uri: photo }}
          resizeMode="cover"
          onLoad={() => Animated.timing(loaded, { toValue: 1, duration: 500, easing: Easing.bezier(0.22, 0.8, 0.3, 1), useNativeDriver: true }).start()}
          onError={() => setFailed(true)}
          style={[StyleSheet.absoluteFill, styles.img, { opacity: loaded, transform: [{ scale: loaded.interpolate({ inputRange: [0, 1], outputRange: [1.04, 1] }) }] }]}
        />
      ) : (
        <>
          <View style={[StyleSheet.absoluteFill, styles.gloss]} />
          <Svg viewBox="0 0 100 60" preserveAspectRatio="none" style={styles.hills}>
            <Path d="M0,55 L20,40 L35,48 L55,30 L75,42 L100,32 L100,60 L0,60 Z" fill="rgba(255,255,255,0.35)" />
            <Path d="M0,60 L25,52 L40,56 L60,46 L80,52 L100,48 L100,60 Z" fill="rgba(0,0,0,0.15)" />
          </Svg>
        </>
      )}
      {!noShade && <View pointerEvents="none" style={styles.shade} />}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'relative', overflow: 'hidden' },
  img: { width: '100%', height: '100%' },
  gloss: {
    opacity: 0.25,
    experimental_backgroundImage: 'radial-gradient(circle at 28% 26%, rgba(255,255,255,0.75), rgba(255,255,255,0) 42%), radial-gradient(circle at 72% 82%, rgba(0,0,0,0.3), rgba(0,0,0,0) 44%)',
  },
  hills: { position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: '60%', opacity: 0.3 },
  shade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%', experimental_backgroundImage: gradients.photoShade },
});
