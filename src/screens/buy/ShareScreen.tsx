import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Share, StyleSheet, View } from 'react-native';
import { StatusMark } from '../../components/hero/StatusMark';
import { Icon } from '../../components/icons/Icon';
import { Grid } from '../../components/layout/Grid';
import { Screen, TopBar } from '../../components/layout/Screen';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { Btn } from '../../components/ui/Btn';
import { EmptyState } from '../../components/ui/EmptyState';
import { buzz, Press } from '../../components/ui/Press';
import { T } from '../../components/ui/T';
import { Toast } from '../../components/ui/Toast';
import type { ScreenProps } from '../../navigation/types';
import { colors } from '../../theme';
import { formatINR } from '../../utils/format';
import { useResolvedProperty } from '../../utils/useResolvedProperty';
import { useToast } from '../../utils/useToast';

const CHANNELS: [string, string, string][] = [
  ['message-circle', 'WhatsApp', '#25D366'], ['send', 'Telegram', '#1A6FFF'], ['mail', 'Email', '#EF4444'],
  ['message-square', 'Messages', '#10B981'], ['twitter', 'Twitter', '#0EA5E9'], ['facebook', 'Facebook', '#1D4ED8'],
  ['link', 'Copy link', '#64748B'], ['qr-code', 'QR code', '#0F172A'],
];

/** B-09 Share property */
export function ShareScreen({ back, ctx }: ScreenProps) {
  const { property: p, loading, error } = useResolvedProperty(ctx);
  const [copied, setCopied] = useState(false);
  const [toast, showToast] = useToast(2000);

  if (loading) {
    return (
      <Screen>
        <TopBar onBack={back} title="Share property" />
        <View style={styles.load}><ActivityIndicator color={colors.brand600} /></View>
      </Screen>
    );
  }
  if (!p) {
    return (
      <Screen>
        <TopBar onBack={back} title="Share property" />
        <EmptyState icon="share-2" title="Property not found" body={error || 'Nothing to share.'} action={<Btn onPress={back}>Go back</Btn>} />
      </Screen>
    );
  }

  const url = 'builtglory.app/p/' + p.id;
  const openShare = (label: string) => {
    showToast(`Opening ${label}…`);
    Share.share({ message: `${p.title} · ${formatINR(p.price)}\nhttps://${url}` }).catch(() => {});
  };
  const copy = () => { setCopied(true); buzz(); setTimeout(() => setCopied(false), 1800); };
  return (
    <Screen footer={<Toast message={toast} />}>
      <TopBar onBack={back} title="Share property" />
      <View style={styles.px4}>
        <View style={styles.summary}>
          <PhotoPlaceholder tag={p.id} style={styles.thumb} />
          <View style={styles.flex1}>
            <T s={13} w={600} truncate>{p.title}</T>
            <T s={11} c={colors.ink500} truncate>{p.location} · {formatINR(p.price)}</T>
          </View>
        </View>
        <T display s={13} w={600} style={styles.mb12}>Share via</T>
        <Grid cols={4} gap={8} style={styles.mb20}>
          {CHANNELS.map(([i, l, c]) => (
            <Pressable key={l} onPress={() => { if (l === 'Copy link') { setCopied(true); setTimeout(() => setCopied(false), 1500); } else openShare(l); }}
              style={({ pressed }) => [styles.channel, pressed && styles.channelPressed]} accessibilityRole="button">
              <View style={[styles.channelIcon, { backgroundColor: c + '20' }]}><Icon name={i} size={18} color={c} /></View>
              <T s={10.5} w={500} align="center">{l}</T>
            </Pressable>
          ))}
        </Grid>
        <View style={styles.link}>
          <Icon name="link" size={14} color="#64748B" />
          <T s={12} c={colors.ink700} truncate style={styles.flex1}>{url}</T>
          <Press onPress={copy}>
            {copied ? (
              <View style={styles.copied}>
                <StatusMark kind="success" size={15} />
                <T s={12} w={700} c={colors.emerald600}>Copied</T>
              </View>
            ) : <T s={12} w={700} c={colors.brand600}>Copy</T>}
          </Press>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  load: { paddingVertical: 64, alignItems: 'center' },
  px4: { paddingHorizontal: 16 },
  mb12: { marginBottom: 12 },
  mb20: { marginBottom: 20 },
  summary: { backgroundColor: colors.ink50, borderRadius: 14, padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 20 },
  thumb: { width: 72, height: 72, borderRadius: 6 },
  channel: { padding: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.ink200, alignItems: 'center' },
  channelPressed: { borderColor: colors.brand300 },
  channelIcon: { width: 40, height: 40, borderRadius: 9999, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 14, backgroundColor: colors.ink50, borderWidth: 1, borderColor: colors.ink200 },
  copied: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
