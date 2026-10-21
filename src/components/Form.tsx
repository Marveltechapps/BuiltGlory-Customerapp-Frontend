import React, { forwardRef, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { palette, tw } from '../theme';
import { Icon, type IconName } from './Icon';
import { Press } from './Press';
import { T } from './T';

/** Label + control + hint (`Field` in the reference). */
export function Field({
  label,
  required,
  hint,
  hintColor,
  error,
  children,
  style,
}: {
  label?: React.ReactNode;
  required?: boolean;
  hint?: React.ReactNode;
  hintColor?: string;
  error?: string | null;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={style}>
      {label ? (
        <T style={s.label}>
          {label}
          {required && <T style={s.required}> *</T>}
        </T>
      ) : null}
      {children}
      {error ? (
        <T style={s.error}>{error}</T>
      ) : hint ? (
        <T style={[s.hint, hintColor ? { color: hintColor } : null]}>{hint}</T>
      ) : null}
    </View>
  );
}

interface InputProps extends TextInputProps {
  icon?: IconName;
  prefix?: string;
  suffix?: string;
  invalid?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

/** Text input with optional leading icon / prefix and the reference focus ring. */
export const Input = forwardRef<TextInput, InputProps>(function InputField(
  {
    icon,
    prefix,
    suffix,
    invalid,
    containerStyle,
    inputStyle,
    onFocus,
    onBlur,
    editable = true,
    ...rest
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={[
        s.input,
        focused && s.inputFocus,
        invalid && s.inputInvalid,
        !editable && s.inputLocked,
        containerStyle,
      ]}
    >
      {icon && <Icon name={icon} size={16} color="#94A3B8" />}
      {prefix ? <T style={s.prefix}>{prefix}</T> : null}
      <TextInput
        ref={ref}
        {...rest}
        editable={editable}
        placeholderTextColor={palette.ink[400]}
        style={[s.inputText, inputStyle]}
        onFocus={e => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={e => {
          setFocused(false);
          onBlur?.(e);
        }}
      />
      {suffix ? <T style={s.suffix}>{suffix}</T> : null}
    </View>
  );
});

/** Multi-line input (`textarea` in the reference). */
export function TextArea({
  value,
  onChangeText,
  placeholder,
  height = 80,
  maxLength,
  counter,
  style,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  height?: number;
  maxLength?: number;
  counter?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={style}>
      {/* The border lives on a wrapper: restyling an Android EditText on focus resets its padding. */}
      <View
        style={[
          s.textareaBox,
          { height },
          focused && { borderColor: palette.brand[600] },
        ]}
      >
        <TextInput
          multiline
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.ink[400]}
          maxLength={maxLength}
          textAlignVertical="top"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={s.textarea}
        />
      </View>
      {counter && maxLength ? (
        <T style={s.counter}>
          {value.length}/{maxLength}
        </T>
      ) : null}
    </View>
  );
}

/** Square checkbox (Terms, Enquiry consent, registration checklist). */
export function Checkbox({
  checked,
  size = 20,
  radius = 6,
}: {
  checked: boolean;
  size?: number;
  radius?: number;
}) {
  return (
    <View
      style={[
        s.checkbox,
        { width: size, height: size, borderRadius: radius },
        checked
          ? {
              backgroundColor: palette.brand[600],
              borderColor: palette.brand[600],
            }
          : null,
      ]}
    >
      {checked && (
        <Icon name="check" size={size * 0.6} color="#FFFFFF" strokeWidth={3} />
      )}
    </View>
  );
}

/** Radio dot used by selectable rows (filled style or ring style). */
export function Radio({
  selected,
  variant = 'filled',
}: {
  selected: boolean;
  variant?: 'filled' | 'ring';
}) {
  if (variant === 'ring') {
    return (
      <View
        style={[s.radio, selected ? { borderColor: palette.brand[600] } : null]}
      >
        {selected && <View style={s.radioDotLarge} />}
      </View>
    );
  }
  return (
    <View
      style={[
        s.radio,
        selected
          ? {
              borderColor: palette.brand[600],
              backgroundColor: palette.brand[600],
            }
          : null,
      ]}
    >
      {selected && <View style={s.radioDot} />}
    </View>
  );
}

/** Pill chip (`Chip` in the reference). */
export function Chip({
  active,
  children,
  onPress,
  icon,
  style,
}: {
  active?: boolean;
  children: React.ReactNode;
  onPress?: () => void;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  const color = active ? '#FFFFFF' : palette.ink[700];
  return (
    <Press
      onPress={onPress}
      style={[s.chip, active ? s.chipOn : s.chipOff, style]}
    >
      {icon && <Icon name={icon} size={12} color={color} />}
      <T style={[s.chipText, { color }]} numberOfLines={1}>
        {children}
      </T>
    </Press>
  );
}

export type BadgeColor = 'brand' | 'green' | 'amber' | 'rose' | 'ink';
const BADGE: Record<BadgeColor, { bg: string; fg: string; ring: string }> = {
  brand: {
    bg: palette.brand[50],
    fg: palette.brand[700],
    ring: palette.brand[100],
  },
  green: {
    bg: palette.emerald[50],
    fg: palette.emerald[700],
    ring: palette.emerald[100],
  },
  amber: {
    bg: palette.amber[50],
    fg: palette.amber[700],
    ring: palette.amber[100],
  },
  rose: {
    bg: palette.rose[50],
    fg: palette.rose[700],
    ring: palette.rose[100],
  },
  ink: { bg: palette.ink[100], fg: palette.ink[700], ring: palette.ink[200] },
};

/** Small status pill (`Badge`). */
export function Badge({
  color = 'brand',
  children,
  icon,
  style,
}: {
  color?: BadgeColor;
  children: React.ReactNode;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  const c = BADGE[color];
  return (
    <View
      style={[
        s.badge,
        { backgroundColor: c.bg, boxShadow: `0 0 0 1px ${c.ring}` },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={10} color={c.fg} />}
      <T style={[s.badgeText, { color: c.fg }]} numberOfLines={1}>
        {children}
      </T>
    </View>
  );
}

/** Round heart toggle shown on property photos. */
export function Heart({
  active,
  onPress,
  size = 16,
}: {
  active?: boolean;
  onPress?: () => void;
  size?: number;
}) {
  return (
    <Press
      onPress={onPress}
      haptic
      hitSlop={6}
      accessibilityLabel={active ? 'Remove from saved' : 'Save property'}
      style={[s.heart, active ? s.heartOn : s.heartOff]}
    >
      <Icon
        name="heart"
        size={size}
        color={active ? '#E11D48' : '#0F172A'}
        strokeWidth={active ? 2.4 : 2}
        fill={active ? '#E11D48' : 'none'}
      />
    </Press>
  );
}

/** iOS-style switch (`Toggle`). */
export function Toggle({
  on,
  onChange,
  disabled,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Press
      onPress={() => onChange(!on)}
      disabled={disabled}
      haptic
      pressScale={1}
      accessibilityRole="switch"
      accessibilityState={{ checked: on, disabled }}
      style={[
        s.toggle,
        on ? s.toggleOn : s.toggleOff,
        disabled && { opacity: 0.5 },
      ]}
    >
      <View style={[s.knob, { left: on ? 23 : 3 }]} />
    </Press>
  );
}

/** Gradient progress bar with sheen (`ProgressBar`). */
export function ProgressBar({ value }: { value: number }) {
  return (
    <View style={s.track}>
      <View
        style={[s.fill, { width: `${Math.max(0, Math.min(100, value))}%` }]}
      />
    </View>
  );
}

const s = StyleSheet.create({
  label: tw('mb-2 text-[13px] font-medium text-ink-700'),
  required: tw('text-[13px] text-rose-500'),
  hint: tw('mt-1.5 text-[11px] text-ink-500'),
  error: tw('mt-1.5 text-[11px] text-rose-600'),
  input: tw(
    'flex items-center gap-2 h-12 px-3 bg-white border border-ink-200 rounded-card',
  ),
  inputFocus: {
    borderColor: palette.brand[500],
    boxShadow:
      '0 0 0 4px rgba(209,227,255,0.7), 0 2px 10px -2px rgba(26,111,255,.25)',
  },
  inputInvalid: { borderColor: palette.rose[500] },
  inputLocked: { backgroundColor: palette.ink[100] },
  inputText: {
    ...tw('flex-1 text-[14px] text-ink-900'),
    paddingVertical: 0,
    height: '100%',
  },
  prefix: tw('text-sm font-medium text-ink-500'),
  suffix: tw('text-[12px] font-medium text-ink-500'),
  textareaBox: tw(
    'w-full border border-ink-200 rounded-card bg-white overflow-hidden',
  ),
  textarea: {
    ...tw('flex-1 p-3 text-[14px] text-ink-900'),
    fontFamily: 'Inter-Regular',
  },
  counter: tw('absolute bottom-2 right-3 text-[10px] text-ink-400'),
  checkbox: tw('border-2 border-ink-300 bg-white items-center justify-center'),
  radio: tw(
    'w-5 h-5 rounded-full border-2 border-ink-300 items-center justify-center',
  ),
  radioDot: tw('w-1.5 h-1.5 rounded-full bg-white'),
  radioDotLarge: tw('w-2.5 h-2.5 rounded-full bg-brand-600'),
  chip: tw('flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border'),
  chipOn: {
    borderColor: 'transparent',
    experimental_backgroundImage: 'linear-gradient(135deg, #3B86FF, #1A6FFF)',
    boxShadow: '0 4px 12px -3px rgba(26,111,255,.6)',
  },
  chipOff: tw('bg-white border-ink-200'),
  chipText: tw('text-[12px] font-semibold'),
  badge: {
    ...tw('flex items-center gap-1 px-2 py-[3px] rounded-full'),
    alignSelf: 'flex-start',
  },
  badgeText: tw('text-[10.5px] font-bold tracking-[.01em]'),
  heart: tw('w-8 h-8 rounded-full items-center justify-center'),
  heartOn: { ...tw('bg-white elev-2'), transform: [{ scale: 1.05 }] },
  heartOff: tw('bg-white/85'),
  toggle: tw('w-[46px] h-[26px] rounded-full relative'),
  toggleOn: {
    experimental_backgroundImage: 'linear-gradient(135deg, #3B86FF, #1A6FFF)',
    boxShadow: '0 2px 8px -1px rgba(26,111,255,.55)',
  },
  toggleOff: tw('bg-ink-200'),
  knob: {
    ...tw('absolute top-[3px] w-5 h-5 rounded-full bg-white'),
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  },
  track: tw(
    'w-full h-2 bg-ink-100 rounded-full overflow-hidden ring-1 ring-ink-200/60',
  ),
  fill: {
    ...tw('h-full rounded-full'),
    experimental_backgroundImage: 'linear-gradient(90deg, #4A8CFF, #1A6FFF)',
  },
});
