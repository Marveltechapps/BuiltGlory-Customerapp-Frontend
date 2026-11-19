import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { BottomNav } from '../../components/BottomNav';
import { CountUp } from '../../components/Hero';
import { Icon, type IconName } from '../../components/Icon';
import { Grid } from '../../components/Layout';
import { WordReveal } from '../../components/Motion';
import { Press } from '../../components/Press';
import { Screen, SolidButton } from '../../components/Screen';
import { Sheet } from '../../components/Sheet';
import { T } from '../../components/T';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useToast } from '../../context/ToastContext';
import { useResource } from '../../lib/useResource';
import { useNav, useRefocus, useScreen } from '../../navigation/NavContext';
import type { ScreenName } from '../../navigation/types';
import { listMyEnquiries } from '../../services/enquiry.service';
import { getUnreadCount } from '../../services/notification.service';
import { listMySellRequests } from '../../services/sellRequest.service';
import { palette, tw, twh } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { formatPhone } from '../../utils/format';

const MENU: Array<{
  icon: IconName;
  label: string;
  sub: string;
  target: ScreenName;
}> = [
  {
    icon: 'inbox',
    label: 'My Enquiries',
    sub: 'Track your buyer enquiries',
    target: 'myEnquiries',
  },
  {
    icon: 'calendar',
    label: 'My Visits',
    sub: 'Manage your property visits',
    target: 'myVisits',
  },
  {
    icon: 'handshake',
    label: 'My Deals',
    sub: 'Track your active deals',
    target: 'myDeals',
  },
  {
    icon: 'tag',
    label: 'My Listings',
    sub: 'Manage your property listings',
    target: 'myListings',
  },
  {
    icon: 'heart',
    label: 'Saved Properties',
    sub: 'Your saved properties',
    target: 'favorites',
  },
  {
    icon: 'settings',
    label: 'Settings',
    sub: 'App preferences and configuration',
    target: 'settingsMain',
  },
  {
    icon: 'help-circle',
    label: 'Help & Support',
    sub: 'Get support and share feedback',
    target: 'helpFaqs',
  },
];

/** Counts for the profile stat tiles (list totals from the API). */
async function loadCounts(signal: AbortSignal) {
  const [enquiries, listings, unread] = await Promise.all([
    listMyEnquiries({ limit: 1 }, signal),
    listMySellRequests({ limit: 1 }, signal),
    getUnreadCount(signal),
  ]);
  return {
    enquiries: enquiries.meta.total,
    listings: listings.meta.total,
    unread: unread.count,
  };
}

/** P-01 Profile. */
export function ProfileScreen() {
  const nav = useNav();
  const toast = useToast();
  const { firstVisit } = useScreen();
  const { user, logout } = useAuth();
  const fav = useFavorites();
  const counts = useResource(loadCounts, []);
  useRefocus(counts.refresh);
  const [showLogout, setShowLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const unread = counts.data?.unread ?? 0;

  const doLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setShowLogout(false);
      nav.reset('login');
    } catch (e) {
      toast.show(errorMessage(e), 'error');
    } finally {
      setLoggingOut(false);
    }
  };

  const stats: Array<[number | null, string, ScreenName]> = [
    [fav.ids.size, 'Saved', 'favorites'],
    [counts.data?.enquiries ?? null, 'Enquiries', 'myEnquiries'],
    [counts.data?.listings ?? null, 'Listed', 'myListings'],
  ];

  return (
    <Screen
      padBottom
      refreshing={counts.refreshing}
      onRefresh={counts.refresh}
      overlay={<BottomNav active="profile" />}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <WordReveal
            text="Profile"
            disabled={!firstVisit}
            style={styles.title}
          />
          <Press
            onPress={() => nav.go('notifications')}
            style={styles.iconBtn}
            accessibilityLabel={`Notifications${
              unread ? `, ${unread} unread` : ''
            }`}
          >
            <Icon name="bell" size={17} color="#64748B" />
            {unread > 0 && (
              <View style={styles.badge}>
                <T style={styles.badgeText}>{unread > 99 ? '99+' : unread}</T>
              </View>
            )}
          </Press>
        </View>
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            {user?.profilePhoto ? (
              <Image
                source={{ uri: user.profilePhoto }}
                style={styles.avatarImg}
              />
            ) : (
              <Icon name="user" size={32} color="#1A6FFF" />
            )}
          </View>
          <View style={styles.flex}>
            <T style={styles.name} numberOfLines={1}>
              {user?.name || 'Your name'}
            </T>
            <T style={styles.phone}>
              {formatPhone(user?.mobileNumber ?? user?.phone)}
            </T>
            {user?.isVerified ? (
              <View style={styles.verified}>
                <Icon name="badge-check" size={12} color="#10B981" />
                <T style={styles.verifiedText}>Verified</T>
              </View>
            ) : null}
          </View>
          <Press
            onPress={() => nav.go('profileEdit')}
            style={styles.iconBtn}
            accessibilityLabel="Edit profile"
          >
            <Icon name="edit-2" size={15} color="#64748B" />
          </Press>
        </View>
        <Grid cols={3} gap={8} style={styles.mt4}>
          {stats.map(([n, label, target]) => (
            <Press
              key={label}
              onPress={() => nav.go(target)}
              style={styles.stat}
            >
              {n === null ? (
                <T style={styles.statNum}>–</T>
              ) : (
                <CountUp to={n} dur={900} style={styles.statNum} />
              )}
              <T style={styles.statLabel}>{label}</T>
            </Press>
          ))}
        </Grid>
      </View>
      <View style={styles.menu}>
        {MENU.map(item => (
          <Press
            key={item.label}
            onPress={() => nav.go(item.target)}
            pressScale={0.99}
            style={styles.item}
          >
            <View style={styles.itemIcon}>
              <Icon name={item.icon} size={18} color="#64748B" />
            </View>
            <View style={styles.flex}>
              <T style={styles.itemLabel}>{item.label}</T>
              <T style={styles.itemSub} numberOfLines={1}>
                {item.sub}
              </T>
            </View>
            <Icon name="chevron-right" size={16} color="#94A3B8" />
          </Press>
        ))}
        <Press
          onPress={() => setShowLogout(true)}
          pressScale={0.99}
          style={[styles.item, styles.logout]}
        >
          <View style={[styles.itemIcon, styles.logoutIcon]}>
            <Icon name="log-out" size={18} color="#E11D48" />
          </View>
          <View style={styles.flex}>
            <T style={[styles.itemLabel, styles.rose]}>Logout</T>
          </View>
          <Icon name="chevron-right" size={16} color="#E11D48" />
        </Press>
      </View>
      <Sheet visible={showLogout} onClose={() => setShowLogout(false)}>
        <View style={styles.sheetHead}>
          <View style={styles.sheetIcon}>
            <Icon name="log-out" size={32} color="#E11D48" />
          </View>
          <T style={styles.sheetTitle}>Logout?</T>
          <T style={styles.sheetText}>
            Are you sure you want to logout from your account?
          </T>
        </View>
        <View style={styles.sheetActions}>
          <SolidButton
            label="Yes, Logout"
            tone="rose"
            loading={loggingOut}
            loadingLabel="Logging out…"
            onPress={doLogout}
          />
          <Press
            onPress={() => setShowLogout(false)}
            pressScale={0.99}
            style={styles.cancel}
          >
            <T style={styles.cancelText}>Cancel</T>
          </Press>
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: tw('flex-1 min-w-0'),
  header: tw('px-4 pt-2 pb-5'),
  titleRow: tw('flex items-center justify-between mb-4'),
  title: {
    ...twh('text-[28px] font-extrabold text-ink-900'),
    letterSpacing: 28 * -0.035,
  },
  iconBtn: tw('w-9 h-9 rounded-full bg-ink-100 items-center justify-center'),
  badge: {
    ...tw(
      'absolute top-1 right-1 h-4 bg-rose-500 rounded-full items-center justify-center px-1',
    ),
    minWidth: 16,
  },
  badgeText: tw('text-white text-[9px] font-bold'),
  userRow: tw('flex items-center gap-4'),
  avatar: tw(
    'w-16 h-16 rounded-full bg-brand-100 items-center justify-center overflow-hidden',
  ),
  avatarImg: { width: 64, height: 64 },
  name: tw('text-[16px] font-semibold text-ink-900'),
  phone: tw('text-[13px] text-ink-500'),
  verified: tw('flex items-center gap-1 mt-0.5'),
  verifiedText: tw('text-[11px] text-emerald-600 font-medium'),
  mt4: tw('mt-4'),
  stat: {
    ...tw('p-2.5 rounded-card items-center'),
    experimental_backgroundImage: `linear-gradient(to bottom, ${palette.ink[50]}, #FFFFFF)`,
    boxShadow: '0 0 0 1px rgba(226,232,240,0.7)',
  },
  statNum: {
    ...twh('num text-[19px] font-extrabold text-ink-900'),
    letterSpacing: 19 * -0.03,
  },
  statLabel: tw('text-[10px] text-ink-500 mt-0.5'),
  menu: { ...tw('px-4 py-4'), gap: 8 },
  item: tw(
    'w-full flex items-center gap-4 p-3.5 bg-white rounded-card border border-ink-200',
  ),
  itemIcon: tw(
    'w-10 h-10 bg-ink-100 rounded-full items-center justify-center shrink-0',
  ),
  itemLabel: tw('text-[14px] font-semibold text-ink-900'),
  itemSub: tw('text-[11.5px] text-ink-500'),
  logout: tw('border-rose-100 mt-2'),
  logoutIcon: tw('bg-rose-50'),
  rose: tw('text-rose-600'),
  sheetHead: tw('items-center mb-6'),
  sheetIcon: tw(
    'w-16 h-16 rounded-full bg-rose-50 items-center justify-center mb-4',
  ),
  sheetTitle: tw('text-[18px] font-bold text-ink-900'),
  sheetText: tw('text-[13px] text-ink-500 mt-2 text-center'),
  sheetActions: { gap: 8 },
  cancel: tw(
    'w-full h-12 rounded-xl border border-ink-200 items-center justify-center',
  ),
  cancelText: tw('font-semibold text-[15px] text-ink-700'),
});
