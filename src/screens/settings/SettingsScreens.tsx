import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppScreen } from '../../components/AppScreen';
import { Field, Input, Toggle } from '../../components/Form';
import { Icon } from '../../components/Icon';
import { Grid, InsetGroup, Row } from '../../components/Layout';
import { Fade } from '../../components/Motion';
import { Press } from '../../components/Press';
import { Screen, SolidButton } from '../../components/Screen';
import { ErrorState, LoadingState } from '../../components/States';
import { StatusMark } from '../../components/StatusMark';
import { T } from '../../components/T';
import { APP_VERSION } from '../../context/AppConfigContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useResource } from '../../lib/useResource';
import { useNav } from '../../navigation/NavContext';
import {
  cancelAccountDeletion,
  getAccountDeletion,
  requestAccountDeletion,
} from '../../services/user.service';
import type { NotificationPreferences } from '../../types/user';
import { palette, tw } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { formatLongDate } from '../../utils/format';
import { readJson, STORAGE_KEYS, writeJson } from '../../utils/storage';

/** A-01 Settings. */
export function SettingsMainScreen() {
  const nav = useNav();
  return (
    <AppScreen title="Settings" sub="Account, alerts and app preferences">
      <View style={styles.groups}>
        <InsetGroup label="Account">
          <Row
            icon="user"
            label="Edit Profile"
            sub="Name, photo, email"
            onPress={() => nav.go('profileEdit')}
          />
          <Row
            icon="shield"
            iconTone="green"
            label="Account Settings"
            sub="Password and account"
            onPress={() => nav.go('accountSettings')}
          />
        </InsetGroup>
        <InsetGroup label="Preferences">
          <Row
            icon="bell"
            iconTone="amber"
            label="Notifications"
            sub="Choose what alerts you receive"
            onPress={() => nav.go('notificationSettings')}
          />
          <Row
            icon="smartphone"
            iconTone="ink"
            label="App Settings"
            sub="Language, theme, location"
            onPress={() => nav.go('appSettings')}
          />
        </InsetGroup>
        <InsetGroup
          label="Support"
          footer={`Builtglory v${APP_VERSION} · Made in Chennai`}
        >
          <Row
            icon="circle-help"
            label="Help & FAQs"
            sub="Answers to common questions"
            onPress={() => nav.go('helpFaqs')}
          />
          <Row
            icon="info"
            iconTone="ink"
            label="About Us"
            sub="Mission, how it works, contact"
            onPress={() => nav.go('aboutUs')}
          />
        </InsetGroup>
      </View>
    </AppScreen>
  );
}

type PrefKey = 'enquiry' | 'listing' | 'deal' | 'payment' | 'seminar';
const PREF_ROWS: Array<[PrefKey, string, string]> = [
  [
    'enquiry',
    'Enquiry updates',
    'Replies and status changes on your enquiries',
  ],
  [
    'listing',
    'Listing updates',
    'Verification, views and enquiries on your listings',
  ],
  ['deal', 'Deal updates', 'Offers, negotiations and deal milestones'],
  ['payment', 'Payment updates', 'Token, balance and payout confirmations'],
  ['seminar', 'Seminar reminders', 'Webinars and investment events'],
];

/**
 * The API stores preferences per channel as `transactional` / `marketing`. The four update rows are all
 * transactional alerts (app push + in-app); seminar reminders are marketing on the same channels.
 */
function prefValue(p: NotificationPreferences | undefined, key: PrefKey) {
  const kind = key === 'seminar' ? 'marketing' : 'transactional';
  const push = p?.push?.[kind];
  const inApp = p?.in_app?.[kind];
  if (push === undefined && inApp === undefined)
    return kind === 'transactional';
  return Boolean(push ?? inApp);
}

/** A-02 Notification settings (PATCH /me notificationPreferences). */
export function NotificationSettingsScreen() {
  const { user, saveProfile } = useAuth();
  const toast = useToast();
  const [prefs, setPrefs] = useState<NotificationPreferences | undefined>(
    user?.notificationPreferences,
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 1200);
    return () => clearTimeout(t);
  }, [saved]);

  const set = async (key: PrefKey, on: boolean) => {
    const kind = key === 'seminar' ? 'marketing' : 'transactional';
    const patch: NotificationPreferences = {
      push: { [kind]: on },
      in_app: { [kind]: on },
    };
    const before = prefs;
    setPrefs(p => ({
      ...p,
      push: { ...p?.push, [kind]: on },
      in_app: { ...p?.in_app, [kind]: on },
    }));
    try {
      const next = await saveProfile({ notificationPreferences: patch });
      setPrefs(next.notificationPreferences);
      setSaved(true);
    } catch (e) {
      setPrefs(before);
      toast.show(errorMessage(e), 'error');
    }
  };

  return (
    <Screen topBar={{ title: 'Notification Settings', back: true }}>
      <View style={styles.px4}>
        <View style={styles.box}>
          {PREF_ROWS.map(([k, label, sub], i) => (
            <View key={k} style={[styles.toggleRow, i > 0 && styles.divider]}>
              <View style={styles.flex}>
                <T style={styles.rowTitle}>{label}</T>
                <T style={styles.rowSub}>{sub}</T>
              </View>
              <Toggle on={prefValue(prefs, k)} onChange={v => set(k, v)} />
            </View>
          ))}
        </View>
        <View style={styles.note}>
          <Icon name="cloud" size={13} color="#94A3B8" />
          <T style={styles.noteText}>
            Changes are saved to your account automatically.
          </T>
        </View>
      </View>
      {saved && (
        <Fade style={styles.savedToast}>
          <View style={styles.savedPill}>
            <Icon name="check" size={13} color="#FFFFFF" />
            <T style={styles.savedText}>Saved</T>
          </View>
        </Fade>
      )}
    </Screen>
  );
}

interface AppPrefs {
  language: 'English' | 'Tamil';
  dark: boolean;
  location: 'gps' | 'manual';
}
const DEFAULT_PREFS: AppPrefs = {
  language: 'English',
  dark: false,
  location: 'manual',
};

/** A-03 App settings. Device-level preferences (the API has no app-settings fields), kept in local storage. */
export function AppSettingsScreen() {
  const [prefs, setPrefs] = useState<AppPrefs>(DEFAULT_PREFS);
  useEffect(() => {
    readJson<AppPrefs>(STORAGE_KEYS.appSettings, DEFAULT_PREFS).then(p =>
      setPrefs({ ...DEFAULT_PREFS, ...p }),
    );
  }, []);
  const update = (patch: Partial<AppPrefs>) =>
    setPrefs(p => {
      const next = { ...p, ...patch };
      writeJson(STORAGE_KEYS.appSettings, next);
      return next;
    });
  const dark = prefs.dark;
  const muted = dark ? 'rgba(255,255,255,0.5)' : palette.ink[500];
  const strong = dark ? '#FFFFFF' : palette.ink[900];

  return (
    <Screen dark={dark} topBar={{ title: 'App Settings', back: true }}>
      <View style={styles.sections}>
        <View>
          <T style={[styles.h3, { color: muted }]}>Language</T>
          <Grid cols={2} gap={8}>
            {(['English', 'Tamil'] as const).map(l => {
              const on = prefs.language === l;
              return (
                <Press
                  key={l}
                  onPress={() => update({ language: l })}
                  style={[
                    styles.lang,
                    on
                      ? styles.langOn
                      : {
                          borderColor: dark
                            ? 'rgba(255,255,255,0.2)'
                            : palette.ink[200],
                        },
                  ]}
                >
                  <T
                    style={[
                      styles.langText,
                      {
                        color: on
                          ? palette.brand[700]
                          : dark
                          ? 'rgba(255,255,255,0.7)'
                          : palette.ink[700],
                      },
                    ]}
                  >
                    {l}
                  </T>
                </Press>
              );
            })}
          </Grid>
        </View>
        <View>
          <T style={[styles.h3, { color: muted }]}>Appearance</T>
          <View
            style={[styles.card, dark ? styles.cardDark : styles.cardLight]}
          >
            <Icon
              name={dark ? 'moon' : 'sun'}
              size={18}
              color={dark ? '#FFFFFF' : '#64748B'}
            />
            <View style={styles.flex}>
              <T style={[styles.rowTitle, { color: strong }]}>Dark Mode</T>
              <T style={[styles.rowSub, { color: muted }]}>
                Applies immediately
              </T>
            </View>
            <Toggle on={dark} onChange={v => update({ dark: v })} />
          </View>
        </View>
        <View>
          <T style={[styles.h3, { color: muted }]}>Location</T>
          <View style={styles.stack}>
            {(
              [
                ['gps', 'Use GPS', 'Auto-detect my location'],
                ['manual', 'Manual entry', 'Pick city and area myself'],
              ] as const
            ).map(([id, label, sub]) => {
              const on = prefs.location === id;
              return (
                <Press
                  key={id}
                  onPress={() => update({ location: id })}
                  pressScale={0.99}
                  style={[
                    styles.loc,
                    on
                      ? styles.locOn
                      : dark
                      ? styles.cardDark
                      : styles.cardLight,
                  ]}
                >
                  <Icon
                    name={id === 'gps' ? 'locate-fixed' : 'map-pin'}
                    size={17}
                    color={on ? '#1A6FFF' : dark ? '#FFFFFF' : '#64748B'}
                  />
                  <View style={styles.flex}>
                    <T
                      style={[
                        styles.locTitle,
                        { color: on ? palette.ink[900] : strong },
                      ]}
                    >
                      {label}
                    </T>
                    <T
                      style={[
                        styles.locSub,
                        { color: on ? palette.ink[500] : muted },
                      ]}
                    >
                      {sub}
                    </T>
                  </View>
                  <View
                    style={[
                      styles.radio,
                      on ? styles.radioOn : styles.radioOff,
                    ]}
                  >
                    {on && <View style={styles.radioDot} />}
                  </View>
                </Press>
              );
            })}
          </View>
        </View>
        <View style={styles.note}>
          <Icon name="cloud" size={13} color={dark ? '#FFFFFF' : '#94A3B8'} />
          <T style={[styles.noteText, { color: muted }]}>
            Preferences are saved on this device.
          </T>
        </View>
      </View>
    </Screen>
  );
}

/** A-04 Account settings. Customers sign in with a one-time code, so there is no password to change. */
export function AccountSettingsScreen() {
  const nav = useNav();
  const { user } = useAuth();
  return (
    <Screen topBar={{ title: 'Account Settings', back: true }}>
      <View style={styles.px4}>
        <T style={styles.h3Dark}>Sign-in & Security</T>
        <View style={styles.otpCard}>
          <View style={styles.otpIcon}>
            <Icon name="lock" size={18} color="#1A6FFF" />
          </View>
          <View style={styles.flex}>
            <T style={styles.rowTitle}>Password-free sign-in</T>
            <T style={styles.rowSub}>
              Your account is protected by a one-time code sent to{' '}
              {user?.mobileNumber ? `+91 ${user.mobileNumber}` : 'your phone'}.
              There is no password to change.
            </T>
          </View>
        </View>
        <SolidButton
          label="Change Phone Number"
          icon={<Icon name="phone" size={16} color="#FFFFFF" />}
          onPress={() => nav.go('changePhone')}
          style={styles.mt5}
        />
        <View style={styles.danger}>
          <Press
            onPress={() => nav.go('accountDeletion')}
            pressScale={0.99}
            pressedStyle={styles.dangerPressed}
            style={styles.dangerBtn}
          >
            <Icon name="trash-2" size={15} color="#E11D48" />
            <T style={styles.dangerText}>Delete Account</T>
          </Press>
        </View>
      </View>
    </Screen>
  );
}

/** A-04a Account deletion (GET/POST/DELETE /me/account-deletion, 30-day grace period). */
export function AccountDeletionScreen() {
  const nav = useNav();
  const toast = useToast();
  const { logout } = useAuth();
  const status = useResource(signal => getAccountDeletion(signal), []);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const enabled = typed === 'DELETE';
  const pending = status.data?.status === 'requested';

  const del = async () => {
    setBusy(true);
    try {
      const res = await requestAccountDeletion();
      toast.show(
        res.scheduledDeletionAt
          ? `Account scheduled for deletion on ${formatLongDate(
              res.scheduledDeletionAt,
            )}`
          : 'Account deletion requested',
        'warn',
        3200,
      );
      await logout();
      nav.reset('login');
    } catch (e) {
      toast.show(errorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  };
  const cancel = async () => {
    setBusy(true);
    try {
      status.setData(await cancelAccountDeletion());
      toast.show('Deletion request cancelled');
    } catch (e) {
      toast.show(errorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen topBar={{ title: 'Delete Account', back: true }}>
      <View style={styles.px4}>
        {status.loading ? (
          <LoadingState />
        ) : status.error ? (
          <ErrorState message={status.error} onRetry={status.reload} />
        ) : pending ? (
          <>
            <View style={styles.pending}>
              <StatusMark kind="warn" size={20} />
              <View style={styles.flex}>
                <T style={styles.pendingTitle}>Deletion scheduled</T>
                <T style={styles.pendingText}>
                  Your account will be deleted on{' '}
                  {formatLongDate(status.data?.scheduledDeletionAt)}. You can
                  cancel until then.
                </T>
              </View>
            </View>
            <SolidButton
              label="Cancel Deletion Request"
              loading={busy}
              onPress={cancel}
            />
          </>
        ) : (
          <>
            <View style={styles.warnBox}>
              <View style={styles.warnHead}>
                <StatusMark kind="error" size={20} />
                <T style={styles.warnTitle}>This cannot be undone</T>
              </View>
              <T style={styles.warnLead}>
                The following data will be permanently deleted:
              </T>
              {[
                'Profile and contact details',
                'Saved searches and favourites',
                'Enquiry and listing history',
                'Uploaded documents',
              ].map(t => (
                <View key={t} style={styles.warnItem}>
                  <Icon name="x" size={12} color="#E11D48" />
                  <T style={styles.warnItemText}>{t}</T>
                </View>
              ))}
            </View>
            <View style={styles.legal}>
              <Icon name="scale" size={14} color="#64748B" style={styles.mt1} />
              <T style={styles.legalText}>
                Some records (transaction & tax documents) are retained as
                required by law. Deletion follows a{' '}
                <T style={styles.legalBold}>30-day grace period</T> and complies
                with the <T style={styles.legalBold}>DPDP Act 2023</T>.
              </T>
            </View>
            <Field
              label={
                <>
                  Type <T style={styles.bold}>DELETE</T> to confirm
                </>
              }
            >
              <Input
                value={typed}
                onChangeText={setTyped}
                placeholder="DELETE"
                autoCapitalize="characters"
              />
            </Field>
            <SolidButton
              label="Delete My Account"
              tone="rose"
              disabledStyle="faded"
              disabled={!enabled}
              loading={busy}
              onPress={del}
              style={styles.mt5}
            />
            <SolidButton
              label="Keep My Account"
              tone="neutral"
              onPress={nav.back}
              style={styles.mt2}
            />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: tw('flex-1 min-w-0'),
  px4: tw('px-4'),
  groups: { ...tw('px-4 pt-2'), gap: 20 },
  box: tw('rounded-card border border-ink-200'),
  toggleRow: tw('flex items-center gap-3 p-4'),
  divider: tw('border-t border-ink-100'),
  rowTitle: tw('text-[14px] font-semibold text-ink-900'),
  rowSub: tw('text-[11.5px] text-ink-500'),
  note: tw('mt-3 flex items-center gap-2 px-1'),
  noteText: tw('text-[11.5px] text-ink-500'),
  savedToast: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  savedPill: {
    ...tw('bg-ink-900 px-4 py-2 rounded-full flex items-center gap-1.5'),
    boxShadow: '0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -4px rgba(0,0,0,.1)',
  },
  savedText: tw('text-white text-[12px] font-medium'),
  sections: { ...tw('px-4'), gap: 20 },
  h3: tw('text-[12px] font-semibold uppercase tracking-wider mb-2'),
  h3Dark: tw('text-[14px] font-semibold mb-3'),
  lang: tw('h-12 rounded-card border items-center justify-center'),
  langOn: tw('border-brand-600 bg-brand-50'),
  langText: tw('text-[14px] font-medium'),
  card: tw('flex items-center gap-3 p-4 rounded-card border'),
  cardLight: tw('border-ink-200'),
  cardDark: {
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  stack: { gap: 8 },
  loc: tw('w-full flex items-center gap-3 p-3 rounded-card border'),
  locOn: tw('border-brand-600 bg-brand-50'),
  locTitle: tw('text-[13.5px] font-semibold'),
  locSub: tw('text-[11px]'),
  radio: tw('w-5 h-5 rounded-full border-2 items-center justify-center'),
  radioOn: tw('border-brand-600 bg-brand-600'),
  radioOff: tw('border-ink-300'),
  radioDot: tw('w-1.5 h-1.5 rounded-full bg-white'),
  otpCard: tw('flex items-start gap-3 p-4 rounded-card border border-ink-200'),
  otpIcon: tw(
    'w-10 h-10 rounded-full bg-brand-50 items-center justify-center shrink-0',
  ),
  mt5: tw('mt-5'),
  mt2: tw('mt-2'),
  mt1: { marginTop: 1 },
  danger: tw('mt-10 pt-5 border-t border-ink-100'),
  dangerBtn: tw(
    'w-full flex items-center gap-2 justify-center py-2 rounded-card',
  ),
  dangerPressed: tw('bg-rose-50'),
  dangerText: tw('text-[13px] text-rose-600 font-medium'),
  pending: tw(
    'flex items-start gap-3 p-4 rounded-card border border-amber-200 bg-amber-50 mb-4',
  ),
  pendingTitle: tw('text-[14px] font-bold text-amber-800'),
  pendingText: tw('text-[12px] text-amber-700 mt-0.5'),
  warnBox: {
    ...tw('rounded-card border border-rose-200 p-4 mb-4'),
    backgroundColor: 'rgba(255,241,242,0.5)',
  },
  warnHead: tw('flex items-center gap-2 mb-2'),
  warnTitle: tw('text-[14px] font-bold text-rose-800'),
  warnLead: tw('text-[12px] text-rose-700 mb-2'),
  warnItem: tw('flex items-center gap-2 mb-1'),
  warnItemText: tw('text-[12.5px] text-rose-800'),
  legal: tw('flex items-start gap-2 p-3 rounded-card bg-ink-50 mb-2'),
  legalText: tw('flex-1 text-[11.5px]'),
  legalBold: tw('text-[11.5px] font-bold'),
  bold: tw('text-[13px] font-bold'),
});
