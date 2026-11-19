import React, { useState } from 'react';
import { StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { colors, type } from '../../theme';
import { Icon } from '../icons/Icon';
import { T } from './T';

/** Labelled form field wrapper. */
export function Field({ label, children, hint, required, style }: { label?: React.ReactNode; children?: React.ReactNode; hint?: React.ReactNode; required?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style}>
      {label ? (
        <T s={13} w={500} c={colors.ink700} style={styles.label}>
          {label}{required ? <T c={colors.rose500}> *</T> : null}
        </T>
      ) : null}
      {children}
      {hint ? <T s={11} c={colors.ink500} style={styles.hint}>{hint}</T> : null}
    </View>
  );
}

export interface InputProps extends TextInputProps {
  icon?: string;
  prefix?: string;
  containerStyle?: StyleProp<ViewStyle>;
  /** Trailing element inside the box. */
  right?: React.ReactNode;
}

/** Text input with the design's focus ring (brand border + 4px soft ring). */
export function Input({ icon, prefix, containerStyle, right, onFocus, onBlur, style, ...rest }: InputProps) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={[styles.box, focus && styles.focus, containerStyle]}>
      {icon ? <Icon name={icon} size={16} color={colors.ink400} /> : null}
      {prefix ? <T s={14} w={500} c={colors.ink500} lh={1.4286}>{prefix}</T> : null}
      <TextInput
        placeholderTextColor={colors.ink400}
        {...rest}
        onFocus={e => { setFocus(true); onFocus?.(e); }}
        onBlur={e => { setFocus(false); onBlur?.(e); }}
        style={[styles.input, style]}
      />
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 8 },
  hint: { marginTop: 6 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.ink200,
    borderRadius: 14,
  },
  focus: {
    borderColor: colors.brand500,
    boxShadow: '0 0 0 4px rgba(209,227,255,0.7), 0 2px 10px -2px rgba(26,111,255,0.25)',
  },
  input: {
    flex: 1,
    ...type(14),
    lineHeight: undefined,
    color: colors.ink900,
    paddingVertical: 0,
    height: '100%',
  },
});
