import React, { useRef, useState } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const PALETTES: Array<[string, string]> = [
  ['#60A5FA', '#3B82F6'],
  ['#34D399', '#10B981'],
  ['#FBBF24', '#F59E0B'],
  ['#F472B6', '#EC4899'],
  ['#A78BFA', '#8B5CF6'],
  ['#FB7185', '#E11D48'],
  ['#22D3EE', '#0891B2'],
  ['#FCA5A5', '#EF4444'],
];

interface PhotoProps {
  /** Seed for the placeholder gradient (property id, etc.). */
  tag?: string;
  /** Remote image URL or bundled asset. When absent the gradient placeholder is shown. */
  src?: string | null;
  source?: ImageSourcePropType;
  gradient?: [string, string];
  height?: number;
  style?: StyleProp<ViewStyle>;
  /** Hide the bottom shade (the reference always draws it). */
  noShade?: boolean;
  children?: React.ReactNode;
}

/** Photo with gradient fallback and bottom shade (`PhotoPlaceholder` in the reference). */
export function PhotoPlaceholder({
  tag = '',
  src,
  source,
  gradient,
  height,
  style,
  noShade,
  children,
}: PhotoProps) {
  const seed = tag.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const [c1, c2] = gradient ?? PALETTES[seed % PALETTES.length];
  const [failed, setFailed] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const imageSource = source ?? (src && !failed ? { uri: src } : undefined);
  return (
    <View
      style={[
        styles.box,
        height !== undefined && { height },
        {
          experimental_backgroundImage: `radial-gradient(120% 90% at 12% 0%, ${c1} 0%, transparent 58%), radial-gradient(110% 95% at 100% 15%, ${c2} 0%, transparent 55%), linear-gradient(145deg, ${c1}, ${c2})`,
        },
        style,
      ]}
    >
      {imageSource ? (
        <Animated.Image
          source={imageSource}
          resizeMode="cover"
          onLoad={() =>
            Animated.timing(fade, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }).start()
          }
          onError={() => setFailed(true)}
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: fade,
              transform: [
                {
                  scale: fade.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1.04, 1],
                  }),
                },
              ],
            },
          ]}
        />
      ) : (
        <>
          <View style={[StyleSheet.absoluteFill, styles.glow]} />
          <Svg
            viewBox="0 0 100 60"
            preserveAspectRatio="none"
            style={styles.hills}
          >
            <Path
              d="M0,55 L20,40 L35,48 L55,30 L75,42 L100,32 L100,60 L0,60 Z"
              fill="rgba(255,255,255,.35)"
            />
            <Path
              d="M0,60 L25,52 L40,56 L60,46 L80,52 L100,48 L100,60 Z"
              fill="rgba(0,0,0,.15)"
            />
          </Svg>
        </>
      )}
      {!noShade && <View pointerEvents="none" style={styles.shade} />}
      {children}
    </View>
  );
}

/** Prefetch helper for galleries. */
export const prefetchImage = (url?: string | null) =>
  url ? Image.prefetch(url).catch(() => false) : Promise.resolve(false);

const styles = StyleSheet.create({
  box: { position: 'relative', overflow: 'hidden' },
  glow: {
    opacity: 0.25,
    experimental_backgroundImage:
      'radial-gradient(circle at 28% 26%, rgba(255,255,255,.75) 0%, transparent 42%), radial-gradient(circle at 72% 82%, rgba(0,0,0,.3) 0%, transparent 44%)',
  },
  hills: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '60%',
    opacity: 0.3,
  },
  shade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
    experimental_backgroundImage:
      'linear-gradient(to top, rgba(8,14,32,.42), transparent)',
  },
});
