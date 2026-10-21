import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Btn } from '../../components/Btn';
import { StatusHero } from '../../components/Hero';
import { Divided } from '../../components/Layout';
import { Press } from '../../components/Press';
import { Screen } from '../../components/Screen';
import { ErrorState, LoadingState } from '../../components/States';
import { StatusMark } from '../../components/StatusMark';
import { T } from '../../components/T';
import { useNav, useRefocus } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import type { SellerActivity } from '../../types/sellRequest';
import { palette, tw, twh } from '../../theme';
import { listingTitle, useSellerActivity } from './sellShared';

/** Sale deed among the seller's documents, if the team has uploaded it. */
function saleDeed(a: SellerActivity) {
  return (
    (a.sellRequest.documents ?? []).find(
      d => /sale[\s_-]*deed/i.test(d.name) && d.fileUrl,
    ) ?? null
  );
}

/** SL-17 Deal complete: shows the real payout and registration state from the seller activity. */
export function DealCompleteScreen({ params }: ScreenProps<'dealComplete'>) {
  const nav = useNav();
  const res = useSellerActivity(params.id);
  useRefocus(res.refresh);
  const a = res.data;

  if (res.loading || res.error || !a) {
    return (
      <Screen fill>
        <View style={styles.center}>
          {res.loading ? (
            <LoadingState />
          ) : (
            <ErrorState
              message={res.error ?? 'Could not load the deal.'}
              onRetry={res.reload}
            />
          )}
        </View>
      </Screen>
    );
  }

  const paid =
    a.payoutSchedule.length > 0 &&
    a.payoutSchedule.every(p => p.status === 'paid');
  const registered = a.registration.status === 'completed';
  const sold =
    a.sellRequest.status === 'sold' || a.acquisition?.stage === 'acquired';
  const deed = saleDeed(a);
  const rows: Array<[string, boolean, string, string]> = [
    ['Payment', paid, 'Received', 'Pending'],
    ['Registration', registered, 'Completed', 'Pending'],
  ];

  return (
    <Screen fill>
      <View style={styles.center}>
        <View style={styles.inner}>
          <StatusHero
            icon={sold ? 'party-popper' : 'clock'}
            tone={sold ? 'success' : 'info'}
          />
          <T style={styles.title}>
            {sold ? 'Your property has been sold' : 'Final steps in progress'}
          </T>
          <T style={styles.body}>
            {sold
              ? `Congratulations! The deal for ${listingTitle(
                  a.sellRequest,
                )} is complete.`
              : `We'll mark ${listingTitle(
                  a.sellRequest,
                )} as sold once payment and registration are complete.`}
          </T>
          <Divided style={styles.card}>
            {rows.map(([label, ok, yes, no]) => (
              <View key={label} style={styles.row}>
                <T style={styles.rowLabel}>{label}</T>
                <View style={styles.rowState}>
                  <StatusMark kind={ok ? 'success' : 'warn'} size={16} />
                  <T
                    style={[
                      styles.rowValue,
                      { color: ok ? palette.emerald[700] : palette.amber[700] },
                    ]}
                  >
                    {ok ? yes : no}
                  </T>
                </View>
              </View>
            ))}
          </Divided>
          <Btn
            style={styles.cta}
            icon="file-text"
            disabled={!deed}
            onPress={() =>
              deed &&
              nav.go('pdfViewer', {
                doc: {
                  name: deed.name,
                  url: deed.fileUrl,
                  documentId: deed.documentId,
                },
              })
            }
          >
            {deed ? 'Download Sale Deed' : 'Sale deed not shared yet'}
          </Btn>
          <Press
            onPress={() => nav.go('help')}
            pressScale={1}
            style={styles.contact}
          >
            <T style={styles.contactText}>Contact Builtglory</T>
          </Press>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: tw('flex-1 items-center justify-center px-6'),
  inner: { width: '100%', alignItems: 'center' },
  title: { ...twh('text-[22px] font-bold text-center') },
  body: tw(
    'text-ink-500 mt-2 text-[13px] max-w-[250px] leading-relaxed text-center',
  ),
  card: tw('mt-6 rounded-card border border-ink-200 w-full'),
  row: tw('flex items-center justify-between px-4 py-3'),
  rowLabel: tw('text-[13px] font-medium'),
  rowState: tw('flex items-center gap-1'),
  rowValue: tw('text-[12px] font-semibold'),
  cta: tw('w-full mt-5'),
  contact: tw('mt-4'),
  contactText: tw('text-[13px] text-brand-600 font-semibold'),
});
