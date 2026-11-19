import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusMark, type MarkKind } from '../components/StatusMark';
import { T } from '../components/T';
import { tw } from '../theme';

interface ToastState {
  id: number;
  message: string;
  kind: MarkKind;
}

interface ToastValue {
  /** Glass toast with an animated status mark (`Toast` in the reference). */
  show(message: string, kind?: MarkKind, durationMs?: number): void;
}

const ToastContext = createContext<ToastValue | null>(null);

/** Same heuristic as the reference Toast for picking the icon when no kind is passed. */
function inferKind(message: string): MarkKind {
  if (
    /fail|error|invalid|unable|could not|couldn't|try again|not available|isn't available/i.test(
      message,
    )
  )
    return 'error';
  if (/warn|expire|pending/i.test(message)) return 'warn';
  return 'success';
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anim = useRef(new Animated.Value(0)).current;

  const show = useCallback(
    (message: string, kind?: MarkKind, durationMs = 2600) => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ id: Date.now(), message, kind: kind ?? inferKind(message) });
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 460,
        easing: Easing.bezier(0.34, 1.32, 0.44, 1),
        useNativeDriver: true,
      }).start();
      timer.current = setTimeout(() => setToast(null), durationMs);
    },
    [anim],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const value = useMemo(() => ({ show }), [show]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <View
          pointerEvents="none"
          style={[styles.wrap, { bottom: 80 + insets.bottom }]}
        >
          <Animated.View
            style={[
              styles.toast,
              {
                opacity: anim.interpolate({
                  inputRange: [0, 0.6, 1],
                  outputRange: [0, 1, 1],
                }),
                transform: [
                  {
                    scale: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.86, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <StatusMark
              key={toast.id}
              kind={toast.kind}
              size={24}
              delay={0.12}
            />
            <T style={styles.text}>{toast.message}</T>
          </Animated.View>
        </View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, zIndex: 60 },
  toast: {
    ...tw('glass-dark rounded-card px-4 py-3 flex items-center gap-2.5 elev-3'),
    backgroundColor: 'rgba(9,14,30,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  text: { ...tw('flex-1 text-white text-[13px] font-semibold') },
});
