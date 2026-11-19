import React, { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { StatusHero } from '../../components/hero/StatusHero';
import { Icon } from '../../components/icons/Icon';
import { AmbientBackground } from '../../components/layout/AmbientBackground';
import { Spin } from '../../components/ui/Float';
import { T } from '../../components/ui/T';
import type { ScreenProps } from '../../navigation/types';
import { colors } from '../../theme';

function StateShell({ children }: { children?: React.ReactNode }) {
  return (
    <View style={styles.root}>
      <AmbientBackground />
      <View style={styles.center}>{children}</View>
    </View>
  );
}

function BrandButton({ icon, label, onPress, disabled, busy }: { icon: string; label: string; onPress?: () => void; disabled?: boolean; busy?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button"
      style={({ pressed }) => [styles.btn, pressed && styles.btnPressed, disabled && styles.btnDisabled]}>
      {busy ? <Spin><Icon name="loader-2" size={18} color="white" /></Spin> : <Icon name={icon} size={17} color="white" />}
      <T s={15} w={600} c="#FFFFFF">{label}</T>
    </Pressable>
  );
}

/** G-01 No internet */
export function OfflineScreen({ go }: ScreenProps) {
  const [retrying, setRetrying] = useState(false);
  const [retryHint, setRetryHint] = useState('');
  const retry = async () => {
    if (retrying) return;
    setRetrying(true);
    setRetryHint('');
    try {
      const state = await NetInfo.fetch();
      if (state.isConnected && state.isInternetReachable !== false) {
        go('home');
        return;
      }
      setRetryHint('Still offline. Check your connection and try again.');
    } catch {
      // NetInfo failed — navigate immediately rather than faking a delay.
      go('home');
    } finally {
      setRetrying(false);
    }
  };
  return (
    <StateShell>
      <StatusHero icon="wifi-off" tone="neutral" />
      <T display s={20} w={700} align="center">No internet connection</T>
      <T s={13} c={colors.ink500} lh={1.625} align="center" style={styles.body}>Please check your network and try again.</T>
      {retryHint ? <T s={12} c={colors.ink500} align="center" style={styles.mt12}>{retryHint}</T> : null}
      <View style={styles.mt24}>
        <BrandButton icon="rotate-cw" label={retrying ? 'Checking…' : 'Retry'} onPress={() => { void retry(); }} disabled={retrying} busy={retrying} />
      </View>
    </StateShell>
  );
}

/** G-02 Force update */
export function ForceUpdateScreen() {
  return (
    <StateShell>
      <StatusHero icon="arrow-up-circle" tone="info" />
      <T display s={20} w={700} align="center">Update required</T>
      <T s={13} c={colors.ink500} lh={1.625} align="center" style={[styles.body, styles.w260]}>A new version of Builtglory is available. Please update to continue.</T>
      <View style={styles.mt24}>
        <BrandButton icon="download" label="Update Now" onPress={() => Linking.openURL('https://apps.apple.com')} />
      </View>
      <T s={11} c={colors.ink400} align="center" style={styles.mt12}>Version 1.1.0 · 18 MB</T>
    </StateShell>
  );
}

/** G-03 Maintenance */
export function MaintenanceScreen({ ctx }: ScreenProps) {
  const [dots, setDots] = useState(60);
  useEffect(() => {
    const t = setInterval(() => setDots(d => (d <= 1 ? 60 : d - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const message =
    (typeof ctx?.message === 'string' && ctx.message.trim()) ||
    "Builtglory is under maintenance. We'll be back shortly.";
  return (
    <StateShell>
      <StatusHero icon="wrench" tone="warn" />
      <T display s={20} w={700} align="center">Under maintenance</T>
      <T s={13} c={colors.ink500} lh={1.625} align="center" style={styles.body}>{message}</T>
      <View style={styles.pill}>
        <Icon name="clock" size={13} color="#64748B" />
        <T s={12} c={colors.ink600}>Expected back by 2:00 PM IST</T>
      </View>
      <View style={styles.retryRow}>
        <Spin><Icon name="loader-2" size={13} color="#94A3B8" /></Spin>
        <T s={11.5} c={colors.ink400}>Auto-retrying in {dots}s</T>
      </View>
    </StateShell>
  );
}

/** G-04 Session expiry */
export function SessionExpiryScreen({ go }: ScreenProps) {
  return (
    <StateShell>
      <StatusHero icon="clock-alert" tone="warn" />
      <T display s={20} w={700} align="center">Session expired</T>
      <T s={13} c={colors.ink500} lh={1.625} align="center" style={styles.body}>Your session has expired. Please log in again.</T>
      <View style={styles.safe}>
        <Icon name="shield-check" size={13} color="#10B981" />
        <T s={11.5} w={500} c={colors.emerald700}>Your data is safe</T>
      </View>
      <View style={styles.mt20}>
        <BrandButton icon="log-in" label="Log In" onPress={() => go('login')} />
      </View>
      <T s={11} c={colors.ink400} align="center" style={styles.mt12}>You'll return to where you left off.</T>
    </StateShell>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  center: { alignItems: 'center' },
  body: { marginTop: 8, maxWidth: 250 },
  w260: { maxWidth: 260 },
  mt12: { marginTop: 12 },
  mt20: { marginTop: 20 },
  mt24: { marginTop: 24 },
  btn: { height: 48, paddingHorizontal: 32, borderRadius: 12, backgroundColor: colors.brand600, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnPressed: { backgroundColor: colors.brand700 },
  btnDisabled: { opacity: 0.7 },
  pill: { marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999, backgroundColor: colors.ink50 },
  retryRow: { marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  safe: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999, backgroundColor: colors.emerald50 },
});
