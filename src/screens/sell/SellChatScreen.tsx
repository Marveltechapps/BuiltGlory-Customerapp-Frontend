import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip } from '../../components/Form';
import { Icon } from '../../components/Icon';
import { LogoMark } from '../../components/LogoMark';
import { Row } from '../../components/Layout';
import { Spin } from '../../components/Motion';
import { Press } from '../../components/Press';
import { Screen } from '../../components/Screen';
import { Sheet } from '../../components/Sheet';
import { ErrorState, LoadingState } from '../../components/States';
import { T } from '../../components/T';
import { useAppConfig } from '../../context/AppConfigContext';
import { useToast } from '../../context/ToastContext';
import { useNav, useScreen } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { sendSellerMessage } from '../../services/sellRequest.service';
import type { SellerMessage } from '../../types/sellRequest';
import { palette, tw } from '../../theme';
import { errorMessage } from '../../utils/errorMessage';
import { dayBucket, formatINR, formatTime } from '../../utils/format';
import { callPhone } from '../../utils/links';
import { useSellerActivity } from './sellShared';

const POLL_MS = 15000;

/** Negotiation chat between the seller and the Builtglory team (activity `messages`; POST …/messages). */
export function SellChatScreen({ params }: ScreenProps<'sellChat'>) {
  const nav = useNav();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { focused } = useScreen();
  const { supportPhone } = useAppConfig();
  const res = useSellerActivity(params.id);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [menu, setMenu] = useState(false);
  const scroller = useRef<ScrollView>(null);
  const a = res.data;
  const refreshRef = useRef(res.refresh);
  refreshRef.current = res.refresh;
  const messages: SellerMessage[] = a?.messages ?? [];

  // Poll for replies while the chat is on screen.
  useEffect(() => {
    if (!focused) return;
    const t = setInterval(() => refreshRef.current(), POLL_MS);
    return () => clearInterval(t);
  }, [focused]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      res.setData(await sendSellerMessage(params.id, text));
      setDraft('');
    } catch (e) {
      toast.show(errorMessage(e), 'error');
    } finally {
      setSending(false);
    }
  };

  let lastDay = '';
  return (
    <Screen scroll={false} contentStyle={styles.fill} noTint>
      <KeyboardAvoidingView style={styles.fill} behavior="padding">
        <View style={styles.header}>
          <Press
            onPress={nav.back}
            style={styles.back}
            accessibilityLabel="Back"
          >
            <Icon name="arrow-left" size={20} />
          </Press>
          <LogoMark size={40} style={styles.avatar} />
          <View style={styles.flex}>
            <T style={styles.name}>Builtglory Team</T>
            <View style={styles.statusRow}>
              <View style={styles.dot} />
              <T style={styles.status}>Negotiation desk</T>
            </View>
          </View>
          <Press
            disabled={!supportPhone}
            onPress={() => supportPhone && callPhone(supportPhone)}
            style={styles.headBtn}
            accessibilityLabel="Call Builtglory"
          >
            <Icon name="phone" size={14} />
          </Press>
          <Press
            onPress={() => setMenu(true)}
            style={styles.headBtn}
            accessibilityLabel="More options"
          >
            <Icon name="more-vertical" size={14} />
          </Press>
        </View>
        <ScrollView
          ref={scroller}
          style={styles.thread}
          contentContainerStyle={styles.threadContent}
          onContentSizeChange={() =>
            scroller.current?.scrollToEnd({ animated: false })
          }
          showsVerticalScrollIndicator={false}
        >
          {res.loading && !a ? (
            <LoadingState />
          ) : res.error && !a ? (
            <ErrorState compact message={res.error} onRetry={res.reload} />
          ) : messages.length === 0 ? (
            <T style={styles.emptyText}>
              No messages yet. Ask the Builtglory team anything about your offer
              or listing.
            </T>
          ) : (
            messages.map((m, i) => {
              const mine = m.sender === 'seller';
              const day = dayBucket(m.createdAt);
              const showDay = day !== lastDay;
              lastDay = day;
              return (
                <React.Fragment key={`${m.logId ?? m.threadId ?? 'm'}-${i}`}>
                  {showDay ? <T style={styles.day}>{day}</T> : null}
                  <View
                    style={[styles.msgRow, mine ? styles.right : styles.left]}
                  >
                    <View
                      style={[
                        styles.bubble,
                        mine ? styles.mine : styles.theirs,
                      ]}
                    >
                      {m.text ? (
                        <T style={[styles.msgText, mine && styles.white]}>
                          {m.text}
                        </T>
                      ) : null}
                      {m.offerAmount ? (
                        <View
                          style={[
                            styles.offer,
                            mine ? styles.offerMine : styles.offerTheirs,
                          ]}
                        >
                          <T
                            style={[
                              styles.offerText,
                              mine ? styles.white : styles.offerTextTheirs,
                            ]}
                          >
                            {mine ? '↩️ Counter: ' : '💰 Offer: '}
                            {formatINR(m.offerAmount)}
                            {m.offerStatus ? ` · ${m.offerStatus}` : ''}
                          </T>
                        </View>
                      ) : null}
                      <T
                        style={[
                          styles.time,
                          mine ? styles.timeMine : styles.timeTheirs,
                        ]}
                      >
                        {formatTime(m.createdAt)}
                      </T>
                    </View>
                  </View>
                </React.Fragment>
              );
            })
          )}
        </ScrollView>
        <View style={[styles.composer, { paddingBottom: 8 + insets.bottom }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
            keyboardShouldPersistTaps="handled"
          >
            <Chip
              icon="tag"
              onPress={() =>
                nav.go('acceptNegotiate', { id: params.id, mode: 'negotiate' })
              }
            >
              Send counter
            </Chip>
            <Chip
              icon="calendar"
              onPress={() => nav.go('sellVisitMgmt', { id: params.id })}
            >
              Suggest visit
            </Chip>
            <Chip
              icon="file-text"
              onPress={() => nav.go('reupload', { id: params.id })}
            >
              Share docs
            </Chip>
          </ScrollView>
          <View style={styles.inputRow}>
            <Press
              onPress={() => nav.go('reupload', { id: params.id })}
              style={styles.attach}
              accessibilityLabel="Share documents"
            >
              <Icon name="paperclip" size={14} />
            </Press>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Type a message…"
              placeholderTextColor={palette.ink[400]}
              style={styles.input}
              maxLength={2000}
              returnKeyType="send"
              onSubmitEditing={send}
            />
            <Press
              onPress={send}
              disabled={!draft.trim() || sending}
              style={styles.send}
              accessibilityLabel="Send message"
            >
              {sending ? (
                <Spin>
                  <Icon name="loader-2" size={14} color="#FFFFFF" />
                </Spin>
              ) : (
                <Icon name="send" size={14} color="#FFFFFF" />
              )}
            </Press>
          </View>
        </View>
      </KeyboardAvoidingView>
      <Sheet visible={menu} onClose={() => setMenu(false)} title="Chat options">
        <View style={styles.menu}>
          <Row
            icon="refresh-cw"
            label="Refresh messages"
            onPress={() => {
              setMenu(false);
              res.refresh();
            }}
          />
          <Row
            icon="hand-coins"
            label="View Builtglory offer"
            onPress={() => {
              setMenu(false);
              nav.go('offer', { id: params.id });
            }}
          />
          <Row
            icon="headphones"
            label="Customer support"
            onPress={() => {
              setMenu(false);
              nav.go('customerSupport');
            }}
          />
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: tw('flex-1'),
  header: tw(
    'px-4 pt-2 pb-3 flex items-center gap-3 border-b border-ink-200 bg-white',
  ),
  back: { ...tw('p-2 rounded-full'), marginLeft: -4 },
  avatar: { borderRadius: 20 },
  name: tw('text-[14px] font-semibold'),
  statusRow: tw('flex items-center gap-1'),
  dot: tw('w-1.5 h-1.5 rounded-full bg-emerald-500'),
  status: tw('text-[10.5px] text-emerald-600'),
  headBtn: tw('w-9 h-9 rounded-full bg-ink-100 items-center justify-center'),
  thread: tw('flex-1 bg-ink-50'),
  threadContent: { ...tw('px-3 py-3'), gap: 8 },
  emptyText: tw('text-[12.5px] text-ink-500 text-center py-10 px-6'),
  day: tw('text-center text-[10.5px] text-ink-500 mb-1'),
  msgRow: tw('flex'),
  right: { justifyContent: 'flex-end' },
  left: { justifyContent: 'flex-start' },
  bubble: { ...tw('px-3 py-2 rounded-2xl'), maxWidth: '78%' },
  mine: { ...tw('bg-brand-600'), borderBottomRightRadius: 6 },
  theirs: {
    ...tw('bg-white border border-ink-200'),
    borderBottomLeftRadius: 6,
  },
  msgText: tw('text-[13px]'),
  white: { color: '#FFFFFF' },
  offer: {
    ...tw('mt-1.5 px-2 py-1.5 rounded-md border'),
    marginHorizontal: -8,
    marginBottom: -4,
  },
  offerMine: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  offerTheirs: tw('bg-emerald-50 border-emerald-200'),
  offerText: tw('text-[12px] font-semibold'),
  offerTextTheirs: tw('text-emerald-700'),
  time: tw('text-[9.5px] mt-1'),
  timeMine: { color: 'rgba(255,255,255,0.7)' },
  timeTheirs: tw('text-ink-400'),
  composer: tw('px-3 pt-2 border-t border-ink-200 bg-white'),
  chips: tw('flex gap-2 mb-2'),
  inputRow: tw('flex items-end gap-2'),
  attach: tw('w-9 h-9 rounded-full bg-ink-100 items-center justify-center'),
  input: {
    ...tw('flex-1 px-3 py-2 rounded-full bg-ink-100 text-[14px] text-ink-900'),
    fontFamily: 'Inter-Regular',
    minHeight: 36,
  },
  send: tw('w-9 h-9 rounded-full bg-brand-600 items-center justify-center'),
  menu: tw('rounded-2xl overflow-hidden border border-ink-100'),
});
