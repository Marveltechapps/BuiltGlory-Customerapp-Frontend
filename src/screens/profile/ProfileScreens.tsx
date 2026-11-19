import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../../components/icons/Icon';
import { BottomNav } from '../../components/layout/BottomNav';
import { Grid } from '../../components/layout/Grid';
import { Screen, TopBar } from '../../components/layout/Screen';
import { CountUp } from '../../components/ui/CountUp';
import { Field, Input } from '../../components/ui/Field';
import { GlowBrand, Spin } from '../../components/ui/Float';
import { SwipeAction } from '../../components/ui/Gestures';
import { WordReveal } from '../../components/ui/Motion';
import { Press } from '../../components/ui/Press';
import { T } from '../../components/ui/T';
import { useAuth } from '../../context/AuthContext';
import type { ScreenName, ScreenProps } from '../../navigation/types';
import * as documents from '../../services/documents.service';
import * as meService from '../../services/me.service';
import * as notifications from '../../services/notifications.service';
import * as sellRequests from '../../services/sellRequests.service';
import { colors, elev, ring } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { relativeNotifTime } from '../../utils/sellApi';

const MENU: { icon: string; label: string; sub: string; target: ScreenName }[] = [
  { icon: 'inbox', label: 'My Enquiries', sub: 'Track your buyer enquiries', target: 'myEnquiries' },
  { icon: 'calendar', label: 'My Visits', sub: 'Manage your property visits', target: 'myVisits' },
  { icon: 'handshake', label: 'My Deals', sub: 'Track your active deals', target: 'myDeals' },
  { icon: 'tag', label: 'My Listings', sub: 'Active, upcoming, drafts and sold out', target: 'myListings' },
  { icon: 'heart', label: 'Saved Properties', sub: 'Your saved properties', target: 'favorites' },
  { icon: 'settings', label: 'Settings', sub: 'App preferences and configuration', target: 'settingsMain' },
  { icon: 'help-circle', label: 'Help & Support', sub: 'Get support and share feedback', target: 'helpFaqs' },
];

/** P-01 Profile */
export function ProfileScreen({ go, onNav }: ScreenProps) {
  const { user, logout, refreshProfile } = useAuth();
  const [unread, setUnread] = useState(0);
  const [listed, setListed] = useState(0);
  const [showLogout, setShowLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refreshProfile();
      } catch {
        // Session may already be expired; AuthContext handles that.
      }
      try {
        const count = await notifications.getUnreadCount();
        if (!cancelled) setUnread(count.count || 0);
      } catch {
        if (!cancelled) setUnread(0);
      }
      try {
        const { items } = await sellRequests.listMySellRequests({ limit: 100 });
        if (!cancelled) setListed(items.filter(i => i.status !== 'draft').length);
      } catch {
        if (!cancelled) setListed(0);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshProfile]);

  const onLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      go('splash');
    } finally {
      setLoggingOut(false);
      setShowLogout(false);
    }
  };

  const name = user?.name || 'Your profile';
  const phone = user?.phone || (user?.mobileNumber ? `+91 ${user.mobileNumber}` : '—');
  const verified = user?.kycStatus === 'verified';

  return (
    <Screen
      padBottom
      footer={
        <>
          <BottomNav legacy active="profile" onNav={onNav} />
          {showLogout && (
            <View style={styles.backdrop}>
              <View style={styles.logoutSheet}>
                <View style={styles.logoutTop}>
                  <View style={styles.logoutIcon}><Icon name="log-out" size={32} color="#E11D48" /></View>
                  <T display s={18} w={700} align="center">Logout?</T>
                  <T s={13} c={colors.ink500} align="center" style={styles.mt8}>Are you sure you want to logout from your account?</T>
                </View>
                <View style={styles.gap8}>
                  <Pressable onPress={() => void onLogout()} style={({ pressed }) => [styles.solid, { backgroundColor: pressed ? colors.rose700 : colors.rose600 }]}>
                    <T s={15} w={600} c="#FFFFFF">{loggingOut ? 'Logging out…' : 'Yes, Logout'}</T>
                  </Pressable>
                  <Pressable onPress={() => setShowLogout(false)} style={({ pressed }) => [styles.solid, styles.outline, pressed && { backgroundColor: colors.ink50 }]}><T s={15} w={600} c={colors.ink700}>Cancel</T></Pressable>
                </View>
              </View>
            </View>
          )}
        </>
      }>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <WordReveal text="Profile" style={styles.title} />
          <Pressable onPress={() => { go('notifications'); setUnread(0); }} style={styles.bell} accessibilityLabel="Notifications">
            <Icon name="bell" size={17} color="#64748B" />
            {unread > 0 && <View style={styles.badge}><T s={9} w={700} c="#FFFFFF" lh={1}>{unread > 9 ? '9+' : unread}</T></View>}
          </Pressable>
        </View>
        <View style={styles.person}>
          <View style={styles.avatar}><Icon name="user" size={32} color="#1A6FFF" /></View>
          <View style={styles.flex1}>
            <T display s={16} w={600}>{name}</T>
            <T s={13} c={colors.ink500}>{phone}</T>
            {verified ? (
              <View style={styles.verified}>
                <Icon name="badge-check" size={12} color="#10B981" />
                <T s={11} w={500} c={colors.emerald600}>Verified</T>
              </View>
            ) : null}
          </View>
          <Press onPress={() => go('profileEdit')} style={styles.edit}>
            <Icon name="edit-2" size={13} color="#64748B" />
            <T s={12} w={700} c={colors.ink700}>Edit Profile</T>
          </Press>
        </View>
        <Grid cols={3} gap={8} style={styles.mt16}>
          {([[0, 'Saved', 'favorites'], [0, 'Enquiries', 'myEnquiries'], [listed, 'Listed', 'myListings']] as [number, string, ScreenName][]).map(([n, l, t]) => (
            <Press key={l} onPress={() => go(t)} style={styles.stat}>
              <CountUp to={n} dur={900} display s={19} w={800} ls={-0.03} align="center" />
              <T s={10} c={colors.ink500} align="center" style={styles.mt2}>{l}</T>
            </Press>
          ))}
        </Grid>
      </View>
      <View style={styles.menu}>
        {MENU.map(item => (
          <Pressable key={item.label} onPress={() => go(item.target)} style={({ pressed }) => [styles.item, pressed && styles.itemHover]}>
            <View style={styles.itemIcon}><Icon name={item.icon} size={18} color="#64748B" /></View>
            <View style={styles.flex1}>
              <T s={14} w={600}>{item.label}</T>
              <T s={11.5} c={colors.ink500} truncate>{item.sub}</T>
            </View>
            <Icon name="chevron-right" size={16} color="#94A3B8" />
          </Pressable>
        ))}
        <Pressable onPress={() => setShowLogout(true)} style={({ pressed }) => [styles.item, styles.logout, pressed && { backgroundColor: colors.rose50 }]}>
          <View style={[styles.itemIcon, { backgroundColor: colors.rose50 }]}><Icon name="log-out" size={18} color="#E11D48" /></View>
          <View style={styles.flex1}><T s={14} w={600} c={colors.rose600}>Logout</T></View>
          <Icon name="chevron-right" size={16} color="#E11D48" />
        </Pressable>
      </View>
    </Screen>
  );
}

/** P-02 Edit profile */
export function ProfileEditScreen({ go, back }: ScreenProps) {
  const { user, refreshProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [city, setCity] = useState(user?.city || '');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [photo, setPhoto] = useState<'idle' | 'uploading' | 'done'>(user?.profilePhoto ? 'done' : 'idle');

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setCity(user?.city || '');
  }, [user?.name, user?.email, user?.city]);

  const phone = user?.phone || (user?.mobileNumber ? `+91 ${user.mobileNumber}` : '—');

  const save = async () => {
    if (busy) return;
    setBusy(true);
    setErr('');
    try {
      await meService.patchMe({ name: name.trim(), email: email.trim() || undefined, city: city.trim() || undefined });
      await refreshProfile();
      setSaved(true);
      back();
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
      setSaved(false);
    }
  };

  const onPhoto = () => {
    // No image picker installed — require a real upload path later.
    setErr('Profile photo picker is not installed. Use documents.upload with purpose profile_photo when available.');
    setPhoto('idle');
    void documents;
  };

  return (
    <Screen>
      <TopBar onBack={back} title="Edit Profile" />
      <View style={styles.px6}>
        <View style={styles.photoRow}>
          <View>
            <View style={[styles.bigAvatar, { backgroundColor: photo === 'done' ? colors.brand200 : colors.brand100 }]}>
              <Icon name="user" size={44} color="#1A6FFF" />
              {photo === 'uploading' && <View style={styles.uploading}><Spin><Icon name="loader-2" size={22} color="white" /></Spin></View>}
            </View>
            <Pressable onPress={onPhoto} style={styles.cam} accessibilityLabel="Change photo">
              <Icon name={photo === 'done' ? 'check' : 'camera'} size={14} color="white" />
            </Pressable>
          </View>
        </View>
        <View style={styles.gap16}>
          <Field label="Full Name" required><Input icon="user" value={name} onChangeText={setName} /></Field>
          <Field label="Phone Number" hint="Verified — use Change Number to update">
            <View style={styles.locked}>
              <Icon name="phone" size={16} color="#94A3B8" />
              <T s={14} c={colors.ink700} style={styles.flex1}>{phone}</T>
              <Pressable onPress={() => go('changePhone')}><T s={12} w={600} c={colors.brand600}>Change Number</T></Pressable>
            </View>
          </Field>
          <Field label="Email Address"><Input icon="mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" /></Field>
          <Field label="City"><Input icon="map-pin" value={city} onChangeText={setCity} placeholder="Chennai" /></Field>
        </View>
        {err ? <T s={12} c={colors.rose600} style={styles.mt8}>{err}</T> : null}
        <Pressable onPress={() => void save()} disabled={busy} style={({ pressed }) => [styles.solid, styles.mt24, { backgroundColor: saved ? colors.emerald500 : pressed ? colors.brand700 : colors.brand600 }]}>
          {busy ? <ActivityIndicator color="#fff" /> : saved ? <Icon name="check" size={18} color="white" /> : null}
          <T s={15} w={600} c="#FFFFFF">{busy ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}</T>
        </Pressable>
      </View>
    </Screen>
  );
}

type NotifRow = {
  id: string;
  i: string;
  t: string;
  b: string;
  time: string;
  unread: boolean;
  day: string;
};

function iconForNotif(type?: string): string {
  switch (type) {
    case 'visit': return 'calendar';
    case 'deal': return 'handshake';
    case 'payment': return 'wallet';
    case 'listing': return 'badge-check';
    default: return 'bell';
  }
}

function dayLabel(iso?: string): string {
  if (!iso) return 'Earlier';
  const d = new Date(iso);
  const today = new Date();
  const yday = new Date();
  yday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yday.toDateString()) return 'Yesterday';
  return 'Earlier';
}

/** P-10 Notifications */
export function NotificationsScreen({ back }: ScreenProps) {
  const [items, setItems] = useState<NotifRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const { items: rows } = await notifications.listNotifications({ limit: 50 });
      setItems(rows.map(n => ({
        id: n._id,
        i: iconForNotif(n.notificationType || n.entityType),
        t: n.title,
        b: n.message,
        time: relativeNotifTime(n.createdAt),
        unread: !n.isRead,
        day: dayLabel(n.createdAt),
      })));
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const markAll = async () => {
    try {
      await notifications.markAllNotificationsRead();
      setItems(prev => prev.map(i => ({ ...i, unread: false })));
    } catch (e) {
      setErr(errorMessage(e));
    }
  };

  const dismiss = async (id: string) => {
    try {
      await notifications.deleteNotification(id);
    } catch {
      // still remove locally
    }
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const markOne = async (id: string) => {
    try {
      await notifications.markNotificationRead(id);
    } catch {
      // ignore
    }
    setItems(prev => prev.map(i => (i.id === id ? { ...i, unread: false } : i)));
  };

  const groups = ['Today', 'Yesterday', 'Earlier']
    .map(day => ({ day, items: items.filter(i => i.day === day) }))
    .filter(g => g.items.length);

  return (
    <Screen>
      <TopBar onBack={back} title="Notifications" right={
        <Pressable onPress={() => void markAll()}><T s={12} w={600} c={colors.brand600}>Mark all read</T></Pressable>
      } />
      <View style={styles.notifs}>
        {loading ? <ActivityIndicator color={colors.brand600} /> : null}
        {err ? <T s={12} c={colors.rose600}>{err}</T> : null}
        {!loading && !err && items.length === 0 ? (
          <T s={13} c={colors.ink500} align="center">No notifications yet.</T>
        ) : null}
        {groups.map(g => (
          <View key={g.day}>
            <T s={11} w={600} upper ls={0.05} c={colors.ink500} style={styles.mb8}>{g.day}</T>
            <View style={styles.gap8}>
              {g.items.map(it => {
                const un = it.unread;
                return (
                  <SwipeAction key={it.id} label="Dismiss" icon="x" tone="#64748B" action={() => void dismiss(it.id)}>
                    <Pressable onPress={() => void markOne(it.id)} style={[styles.notif, un ? styles.notifUnread : styles.notifRead]}>
                      <View style={styles.notifIconWrap}>
                        {un && <GlowBrand size={36} />}
                        <View style={[styles.notifIcon, { backgroundColor: un ? colors.brand100 : colors.brand50 }]}><Icon name={it.i} size={16} color="#1A6FFF" /></View>
                      </View>
                      <View style={styles.flex1}>
                        <View style={styles.notifTop}>
                          <T s={13} w={600} style={styles.flex1}>{it.t}</T>
                          {un && <View style={styles.unreadDot} />}
                        </View>
                        <T s={11.5} c={colors.ink500} style={styles.mt2}>{it.b}</T>
                      </View>
                      <T s={10.5} c={colors.ink400}>{it.time}</T>
                    </Pressable>
                  </SwipeAction>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  px6: { paddingHorizontal: 24 },
  gap8: { gap: 8 },
  gap16: { gap: 16 },
  mt2: { marginTop: 2 },
  mt8: { marginTop: 8 },
  mt16: { marginTop: 16 },
  mt24: { marginTop: 24 },
  mb8: { marginBottom: 8 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontFamily: 'BricolageGrotesque-ExtraBold', fontSize: 28, lineHeight: 42, letterSpacing: 28 * -0.035, color: colors.ink900, includeFontPadding: false },
  bell: { width: 36, height: 36, borderRadius: 9999, backgroundColor: colors.ink100, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, paddingHorizontal: 4, borderRadius: 9999, backgroundColor: colors.rose500, alignItems: 'center', justifyContent: 'center' },
  person: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 64, height: 64, borderRadius: 9999, backgroundColor: colors.brand100, alignItems: 'center', justifyContent: 'center' },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  edit: { height: 36, paddingHorizontal: 12, borderRadius: 9999, backgroundColor: colors.ink100, flexDirection: 'row', alignItems: 'center', gap: 6 },
  stat: { padding: 10, borderRadius: 14, experimental_backgroundImage: 'linear-gradient(180deg, #F8FAFC, #FFFFFF)', boxShadow: ring('rgba(226,232,240,0.7)') },
  menu: { paddingHorizontal: 16, paddingVertical: 16, gap: 8 },
  item: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 16, padding: 14, backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.ink200 },
  itemHover: { borderColor: colors.brand200, backgroundColor: '#FBFCFF' },
  itemIcon: { width: 40, height: 40, borderRadius: 9999, backgroundColor: colors.ink100, alignItems: 'center', justifyContent: 'center' },
  logout: { borderColor: colors.rose100, marginTop: 8 },
  backdrop: { ...StyleSheet.absoluteFillObject, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  logoutSheet: { width: '100%', backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  logoutTop: { alignItems: 'center', marginBottom: 24 },
  logoutIcon: { width: 64, height: 64, borderRadius: 9999, backgroundColor: colors.rose50, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  solid: { width: '100%', height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  outline: { borderWidth: 1, borderColor: colors.ink200 },
  photoRow: { alignItems: 'center', marginBottom: 24 },
  bigAvatar: { width: 96, height: 96, borderRadius: 9999, alignItems: 'center', justifyContent: 'center' },
  uploading: { ...StyleSheet.absoluteFillObject, borderRadius: 9999, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  cam: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 9999, backgroundColor: colors.brand600, alignItems: 'center', justifyContent: 'center', boxShadow: elev.sm },
  locked: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingHorizontal: 12, backgroundColor: colors.ink100, borderWidth: 1, borderColor: colors.ink200, borderRadius: 14 },
  notifs: { paddingHorizontal: 16, gap: 16 },
  notif: { padding: 12, borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 12 },
  notifUnread: { borderColor: colors.brand200, backgroundColor: 'rgba(238,244,255,0.4)' },
  notifRead: { borderColor: colors.ink200 },
  notifIconWrap: { width: 36, height: 36 },
  notifIcon: { width: 36, height: 36, borderRadius: 9999, alignItems: 'center', justifyContent: 'center' },
  notifTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  unreadDot: { width: 8, height: 8, borderRadius: 9999, backgroundColor: colors.brand600, marginTop: 6 },
});
