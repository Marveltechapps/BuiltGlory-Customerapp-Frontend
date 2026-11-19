import React from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';
import { colors, fonts } from '../theme';

/** Body text with the reference defaults: Inter 16/24, ink-900. Nested <T> inherits like CSS. */
export function T({ style, maxFontSizeMultiplier = 1.3, ...rest }: TextProps) {
  return (
    <Text
      {...rest}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[styles.base, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
});
