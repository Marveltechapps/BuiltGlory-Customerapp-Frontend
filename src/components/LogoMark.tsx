import { Image, type StyleProp, type ImageStyle } from 'react-native';

/** Builtglory app icon. */
export function LogoMark({
  size,
  style,
}: {
  size: number;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={require('../assets/logo.png')}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
  );
}
