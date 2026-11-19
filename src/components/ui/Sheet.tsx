import React, { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, PanResponder, Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, elev, ease } from '../../theme';
import { buzz } from './Press';
import { T } from './T';

export interface SheetProps {
  children?: React.ReactNode;
  onClose?: () => void;
  title?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Bottom sheet you can drag down to dismiss (the design's DragSheet):
 * slides up over .38s, rubber-bands upward, closes past 110px or a fast fling.
 */
export function DragSheet({ children, onClose, title, contentStyle }: SheetProps) {
  const insets = useSafeAreaInsets();
  const y = useRef(new Animated.Value(600)).current;
  const [closing, setClosing] = useState(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    Animated.timing(y, { toValue: 0, duration: 380, easing: ease.out, useNativeDriver: true }).start();
  }, [y]);

  const dismiss = () => {
    if (closing) return;
    setClosing(true);
    buzz();
    Animated.timing(y, { toValue: 600, duration: 230, easing: ease.out, useNativeDriver: true }).start(() => closeRef.current?.());
  };

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
    onPanResponderMove: (_, g) => y.setValue(g.dy > 0 ? g.dy : g.dy * 0.22),
    onPanResponderRelease: (_, g) => {
      if (g.dy > 110 || g.vy > 0.55) {
        setClosing(true);
        buzz();
        Animated.timing(y, { toValue: 600, duration: 230, easing: ease.out, useNativeDriver: true }).start(() => closeRef.current?.());
      } else {
        Animated.timing(y, { toValue: 0, duration: 400, easing: ease.spring, useNativeDriver: true }).start();
      }
    },
  })).current;

  const backdrop = y.interpolate({ inputRange: [0, 420], outputRange: [1, 0], extrapolate: 'clamp' });

  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdrop }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} accessibilityLabel="Close" />
      </Animated.View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: y }] }]}>
          <View style={styles.handleArea} {...pan.panHandlers}>
            <View style={styles.handle} />
          </View>
          <View style={[styles.content, { paddingBottom: 28 + insets.bottom }, contentStyle]}>
            {title ? <T display s={19} w={800} ls={-0.02} style={styles.title}>{title}</T> : null}
            {children}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

export const Sheet = DragSheet;

/** Conditionally shown sheet. */
export function Modal({ open, onClose, children, title }: SheetProps & { open: boolean }) {
  if (!open) return null;
  return <DragSheet onClose={onClose} title={title}>{children}</DragSheet>;
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: 50, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, boxShadow: elev.e3 },
  handleArea: { paddingTop: 12, paddingBottom: 4 },
  handle: { width: 44, height: 6, borderRadius: 9999, backgroundColor: colors.ink200, alignSelf: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  title: { marginBottom: 12 },
});
