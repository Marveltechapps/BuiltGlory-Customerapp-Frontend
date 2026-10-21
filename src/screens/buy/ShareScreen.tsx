import Clipboard from '@react-native-clipboard/clipboard';
import React, { useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Icon, type IconName } from '../../components/Icon';
import { Grid } from '../../components/Layout';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { Press } from '../../components/Press';
import { Screen } from '../../components/Screen';
import { Sheet } from '../../components/Sheet';
import { StatusMark } from '../../components/StatusMark';
import { T } from '../../components/T';
import { useToast } from '../../context/ToastContext';
import type { ScreenProps } from '../../navigation/types';
import { tw } from '../../theme';
import { formatINR } from '../../utils/format';
import { buzz } from '../../utils/haptics';
import { openUrl, propertyLink } from '../../utils/links';

/** B-09 Share property. */
export function ShareScreen({ params }: ScreenProps<'shareProperty'>) {
  const toast = useToast();
  const p = params.property;
  const link = propertyLink(p.id);
  const message = `${p.title} · ${formatINR(p.price)} on Builtglory`;
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState(false);
  const enc = encodeURIComponent;

  const copy = () => {
    Clipboard.setString(link);
    setCopied(true);
    buzz();
    setTimeout(() => setCopied(false), 1800);
  };
  const open = async (label: string, url: string) => {
    toast.show(`Opening ${label}…`);
    if (!(await openUrl(url)))
      await Share.share({ message: `${message}\n${link}`, url: link });
  };

  const channels: Array<[IconName, string, string, () => void]> = [
    [
      'message-circle',
      'WhatsApp',
      '#25D366',
      () =>
        open('WhatsApp', `whatsapp://send?text=${enc(`${message} ${link}`)}`),
    ],
    [
      'send',
      'Telegram',
      '#1A6FFF',
      () =>
        open(
          'Telegram',
          `https://t.me/share/url?url=${enc(link)}&text=${enc(message)}`,
        ),
    ],
    [
      'mail',
      'Email',
      '#EF4444',
      () =>
        open(
          'Email',
          `mailto:?subject=${enc(p.title)}&body=${enc(`${message}\n${link}`)}`,
        ),
    ],
    [
      'message-square',
      'Messages',
      '#10B981',
      () => open('Messages', `sms:?body=${enc(`${message} ${link}`)}`),
    ],
    [
      'twitter',
      'Twitter',
      '#0EA5E9',
      () =>
        open(
          'Twitter',
          `https://twitter.com/intent/tweet?text=${enc(message)}&url=${enc(
            link,
          )}`,
        ),
    ],
    [
      'facebook',
      'Facebook',
      '#1D4ED8',
      () =>
        open(
          'Facebook',
          `https://www.facebook.com/sharer/sharer.php?u=${enc(link)}`,
        ),
    ],
    ['link', 'Copy link', '#64748B', copy],
    ['qr-code', 'QR code', '#0F172A', () => setQr(true)],
  ];

  return (
    <Screen topBar={{ title: 'Share property', back: true }}>
      <View style={styles.body}>
        <View style={styles.preview}>
          <PhotoPlaceholder tag={p.id} src={p.images[0]} style={styles.thumb} />
          <View style={styles.flex}>
            <T style={styles.title} numberOfLines={1}>
              {p.title}
            </T>
            <T style={styles.meta} numberOfLines={1}>
              {p.location} · {formatINR(p.price)}
            </T>
          </View>
        </View>
        <T style={styles.h3}>Share via</T>
        <Grid cols={4} gap={8} style={styles.mb5}>
          {channels.map(([icon, label, color, onPress]) => (
            <Press key={label} onPress={onPress} style={styles.channel}>
              <View
                style={[styles.channelIcon, { backgroundColor: `${color}20` }]}
              >
                <Icon name={icon} size={18} color={color} />
              </View>
              <T style={styles.channelText}>{label}</T>
            </Press>
          ))}
        </Grid>
        <View style={styles.linkRow}>
          <Icon name="link" size={14} color="#64748B" />
          <T style={styles.linkText} numberOfLines={1}>
            {link.replace(/^https?:\/\//, '')}
          </T>
          <Press onPress={copy} hitSlop={8}>
            {copied ? (
              <View style={styles.copied}>
                <StatusMark kind="success" size={15} />
                <T style={styles.copiedText}>Copied</T>
              </View>
            ) : (
              <T style={styles.copy}>Copy</T>
            )}
          </Press>
        </View>
      </View>
      <Sheet visible={qr} onClose={() => setQr(false)} title="Scan to view">
        <View style={styles.qr}>
          <QRCode value={link} size={200} />
          <T style={styles.qrText}>{link}</T>
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: tw('flex-1 min-w-0'),
  body: tw('px-4'),
  preview: tw('bg-ink-50 rounded-card p-3 flex items-center gap-3 mb-5'),
  thumb: { ...tw('rounded-md shrink-0'), width: 72, height: 72 },
  title: tw('text-[13px] font-semibold'),
  meta: tw('text-[11px] text-ink-500'),
  h3: tw('text-[13px] font-semibold mb-3'),
  mb5: tw('mb-5'),
  channel: tw('p-3 rounded-card border border-ink-200 items-center'),
  channelIcon: tw('w-10 h-10 rounded-full items-center justify-center mb-1.5'),
  channelText: tw('text-[10.5px] font-medium text-center'),
  linkRow: tw(
    'flex items-center gap-2 p-2.5 rounded-card bg-ink-50 border border-ink-200',
  ),
  linkText: tw('flex-1 text-[12px] text-ink-700'),
  copy: tw('text-brand-600 text-[12px] font-bold'),
  copied: tw('flex items-center gap-1'),
  copiedText: tw('text-emerald-600 text-[12px] font-bold'),
  qr: tw('items-center gap-3 pb-2'),
  qrText: tw('text-[12px] text-ink-500'),
});
