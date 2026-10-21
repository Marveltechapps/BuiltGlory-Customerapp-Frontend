import React, { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { StatusHero } from '../../components/Hero';
import { Icon } from '../../components/Icon';
import { Spin } from '../../components/Motion';
import { Screen, SolidButton } from '../../components/Screen';
import { T } from '../../components/T';
import {
  APP_VERSION,
  compareVersions,
  useAppConfig,
} from '../../context/AppConfigContext';
import { useAuth } from '../../context/AuthContext';
import { useNav } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { tw, twh } from '../../theme';
import { isNetworkError } from '../../utils/errorMessage';
import { formatTime } from '../../utils/format';
import { openUrl } from '../../utils/links';

/** Re-run the startup checks (config, maintenance, version, session) and route accordingly. */
function useRecheck() {
  const nav = useNav();
  const { load } = useAppConfig();
  const { bootstrap, status } = useAuth();
  return useCallback(async () => {
    try {
      const config = await load();
      if (config.maintenance?.enabled) return 'maintenance' as const;
      if (compareVersions(APP_VERSION, config.versions.minimumSupported) < 0)
        return 'forceUpdate' as const;
      const next =
        status === 'signedIn' || status === 'guest'
          ? status
          : await bootstrap();
      nav.reset(next === 'signedOut' ? 'login' : 'home');
      return 'ok' as const;
    } catch (e) {
      return isNetworkError(e) ? ('offline' as const) : ('error' as const);
    }
  }, [bootstrap, load, nav, status]);
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.centered}>
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

/** G-01 No internet. */
export function OfflineScreen() {
  const recheck = useRecheck();
  const [retrying, setRetrying] = useState(false);
  const retry = async () => {
    setRetrying(true);
    await recheck();
    setRetrying(false);
  };
  return (
    <Screen fill scroll={false}>
      <Centered>
        <StatusHero icon="wifi-off" tone="neutral" />
        <T style={styles.title}>No internet connection</T>
        <T style={[styles.body, styles.w240]}>
          Please check your network and try again.
        </T>
        <SolidButton
          label="Retry"
          loading={retrying}
          loadingLabel="Retrying…"
          icon={<Icon name="rotate-cw" size={17} color="#FFFFFF" />}
          onPress={retry}
          style={styles.inlineBtn}
        />
      </Centered>
    </Screen>
  );
}

/** G-02 Force update (installed version below `versions.minimumSupported`). */
export function ForceUpdateScreen() {
  const { config } = useAppConfig();
  const store =
    Platform.OS === 'ios' ? config?.storeUrls.ios : config?.storeUrls.android;
  return (
    <Screen fill scroll={false}>
      <Centered>
        <StatusHero icon="arrow-up-circle" tone="info" />
        <T style={styles.title}>Update required</T>
        <T style={[styles.body, styles.w260]}>
          A new version of Builtglory is available. Please update to continue.
        </T>
        <SolidButton
          label="Update Now"
          icon={<Icon name="download" size={17} color="#FFFFFF" />}
          onPress={() => store && openUrl(store)}
          disabled={!store}
          style={styles.inlineBtn}
        />
        <T style={styles.version}>Version {config?.versions.latest ?? '—'}</T>
      </Centered>
    </Screen>
  );
}

/** G-03 Maintenance mode: re-checks /app/config every 60 seconds. */
export function MaintenanceScreen() {
  const { config } = useAppConfig();
  const recheck = useRecheck();
  const [secs, setSecs] = useState(60);
  useEffect(() => {
    const t = setInterval(() => setSecs(s => (s <= 1 ? 60 : s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (secs === 60) recheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secs]);
  const back = config?.maintenance.expectedBackAt;
  return (
    <Screen fill scroll={false}>
      <Centered>
        <StatusHero icon="wrench" tone="warn" />
        <T style={styles.title}>Under maintenance</T>
        <T style={[styles.body, styles.w250]}>
          {config?.maintenance.message ||
            "Builtglory is under maintenance. We'll be back shortly."}
        </T>
        {back ? (
          <View style={styles.pill}>
            <Icon name="clock" size={13} color="#64748B" />
            <T style={styles.pillText}>
              Expected back by{' '}
              {/^\d{4}-/.test(back) ? `${formatTime(back)} IST` : back}
            </T>
          </View>
        ) : null}
        <View style={styles.retryRow}>
          <Spin>
            <Icon name="loader-2" size={13} color="#94A3B8" />
          </Spin>
          <T style={styles.retryText}>Auto-retrying in {secs}s</T>
        </View>
      </Centered>
    </Screen>
  );
}

/** G-04 Session expired: sign in again and return to the screen the user was on. */
export function SessionExpiryScreen({ params }: ScreenProps<'sessionExpiry'>) {
  const nav = useNav();
  return (
    <Screen fill scroll={false}>
      <Centered>
        <StatusHero icon="clock" tone="warn" />
        <T style={styles.title}>Session expired</T>
        <T style={[styles.body, styles.w250]}>
          Your session has expired. Please log in again.
        </T>
        <View style={styles.safe}>
          <Icon name="shield-check" size={13} color="#10B981" />
          <T style={styles.safeText}>Your data is safe</T>
        </View>
        <SolidButton
          label="Log In"
          icon={<Icon name="log-in" size={17} color="#FFFFFF" />}
          onPress={() => nav.reset('login', { resume: params?.resume ?? null })}
          style={[styles.inlineBtn, styles.mt5]}
        />
        <T style={styles.note}>You'll return to where you left off.</T>
      </Centered>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: tw('flex-1 items-center justify-center px-8'),
  inner: tw('items-center'),
  title: { ...twh('text-[20px] font-bold text-ink-900 text-center') },
  body: tw('text-[13px] text-ink-500 mt-2 leading-relaxed text-center'),
  w240: tw('max-w-[240px]'),
  w250: tw('max-w-[250px]'),
  w260: tw('max-w-[260px]'),
  inlineBtn: { ...tw('mt-6 px-8'), width: 'auto', alignSelf: 'center' },
  mt5: tw('mt-5'),
  version: tw('text-[11px] text-ink-400 mt-3'),
  pill: tw('mt-5 flex items-center gap-2 px-4 py-2 rounded-full bg-ink-50'),
  pillText: tw('text-[12px]'),
  retryRow: tw('mt-4 flex items-center gap-1.5'),
  retryText: tw('text-[11.5px] text-ink-400'),
  safe: tw(
    'mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50',
  ),
  safeText: tw('text-[11.5px] text-emerald-700 font-medium'),
  note: tw('text-[11px] text-ink-400 mt-3'),
});
