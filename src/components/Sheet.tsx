import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tw, twh } from '../theme';
import { buzz } from '../utils/haptics';
import { T } from './T';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
}

const GLIDE = Easing.bezier(0.22, 0.8, 0.3, 1);

/** Bottom sheet you can fling away (`DragSheet` / `Sheet` in the reference). */
export function Sheet({ visible, onClose, title, children }: SheetProps) {
  const insets = useSafeAreaInsets();
  const y = useRef(new Animated.Value(600)).current;
  const closing = useRef(false);

  useEffect(() => {
    if (!visible) return;
    closing.current = false;
    y.setValue(600);
    Animated.timing(y, {
      toValue: 0,
      duration: 380,
      easing: GLIDE,
      useNativeDriver: true,
    }).start();
  }, [visible, y]);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(y, {
      toValue: 620,
      duration: 230,
      easing: GLIDE,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderMove: (_, g) => y.setValue(g.dy > 0 ? g.dy : g.dy * 0.22),
      onPanResponderRelease: (_, g) => {
        if (g.dy > 110 || g.vy > 0.55) {
          buzz();
          close();
        } else {
          Animated.spring(y, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        }
      },
    }),
  ).current;

  const backdrop = y.interpolate({
    inputRange: [0, 420],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.backdrop,
            { opacity: backdrop },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={close}
            accessibilityLabel="Close"
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: 28 + insets.bottom,
              transform: [{ translateY: y }],
            },
          ]}
        >
          <View style={styles.handleArea} {...pan.panHandlers}>
            <View style={styles.handle} />
          </View>
          <View style={styles.body}>
            {title ? <T style={styles.title}>{title}</T> : null}
            {children}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: tw('bg-white rounded-t-3xl elev-3'),
  handleArea: tw('pt-3 pb-1'),
  handle: tw('w-11 h-1.5 bg-ink-200 rounded-full self-center'),
  body: tw('px-5 pt-2'),
  title: {
    ...twh('text-[19px] font-extrabold text-ink-900'),
    marginBottom: 12,
  },
});
