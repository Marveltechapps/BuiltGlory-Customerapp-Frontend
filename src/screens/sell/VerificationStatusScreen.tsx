import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Btn } from '../../components/Btn';
import { Icon } from '../../components/Icon';
import { Press } from '../../components/Press';
import { Screen } from '../../components/Screen';
import { Sheet } from '../../components/Sheet';
import { ErrorState, LoadingState } from '../../components/States';
import { T } from '../../components/T';
import { useNav, useRefocus } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import type { AcquisitionStage, SellerActivity } from '../../types/sellRequest';
import { palette, tw } from '../../theme';
import { formatDateTime } from '../../utils/format';
import { listingTitle, useSellerActivity } from './sellShared';

type StepState = 'done' | 'current' | 'alert' | 'future';
interface Step {
  title: string;
  state: StepState;
  date?: string;
  detail?: string;
  action: 'view' | 'reupload' | 'offer';
}

const STAGE_ORDER: AcquisitionStage[] = [
  'pending_review',
  'site_inspection',
  'valuation',
  'negotiation',
  'token_to_seller',
  'documentation',
  'seller_payout',
  'acquired',
];

/** Derive the six review steps from the sell request status, its documents and the acquisition stage. */
export function verificationSteps(a: SellerActivity): Step[] {
  const req = a.sellRequest;
  const stage = a.acquisition?.stage;
  const idx = stage ? STAGE_ORDER.indexOf(stage) : -1;
  const flaggedDocs = (req.documents ?? []).filter(
    d => d.status === 'rejected' || d.status === 'missing',
  );
  const needsChanges =
    req.status === 'changes_requested' || flaggedDocs.length > 0;
  const reviewed = req.status !== 'new' || idx >= 0;
  const docsDone =
    !needsChanges &&
    (idx >= 1 ||
      ['approved', 'active', 'negotiating', 'sold'].includes(req.status));
  const at = (s: AcquisitionStage) =>
    a.acquisition?.stageHistory?.find(h => h.to === s)?.changedAt;
  const step = (i: number, current: boolean): StepState =>
    idx > i ? 'done' : current ? 'current' : 'future';
  return [
    {
      title: 'Submitted',
      state: 'done',
      date: req.submittedAt ? formatDateTime(req.submittedAt) : undefined,
      action: 'view',
    },
    {
      title: 'Verification Call',
      state: reviewed ? 'done' : 'current',
      date:
        reviewed && at('pending_review')
          ? formatDateTime(at('pending_review'))
          : undefined,
      detail: reviewed
        ? 'Confirmed by the Builtglory team'
        : 'Our advisor will call you to confirm the details.',
      action: 'view',
    },
    {
      title: 'Document Verification',
      state: needsChanges
        ? 'alert'
        : docsDone
        ? 'done'
        : reviewed
        ? 'current'
        : 'future',
      detail: needsChanges
        ? `Action needed — ${
            flaggedDocs.length || req.changeRequests?.length || 1
          } ${
            (flaggedDocs.length || req.changeRequests?.length || 1) === 1
              ? 'item'
              : 'items'
          } flagged`
        : undefined,
      action: needsChanges ? 'reupload' : 'view',
    },
    {
      title: 'Site Inspection',
      state: step(1, idx === 1),
      date: at('valuation') ? formatDateTime(at('valuation')) : undefined,
      action: 'view',
    },
    { title: 'Legal Verification', state: step(2, idx === 2), action: 'view' },
    {
      title: 'Valuation',
      state: a.offer ? 'done' : step(2, idx === 2),
      detail: a.offer ? 'Offer ready to review' : undefined,
      action: a.offer ? 'offer' : 'view',
    },
  ];
}

const DOT: Record<
  StepState,
  { bg: string; fg: string; label: (n: number) => string }
> = {
  done: { bg: palette.emerald[500], fg: '#FFFFFF', label: () => '✓' },
  alert: { bg: palette.amber[500], fg: '#FFFFFF', label: () => '!' },
  current: { bg: palette.brand[600], fg: '#FFFFFF', label: () => '◐' },
  // text-ink-600 is not in the reference palette, so the number inherits the body ink-900.
  future: { bg: palette.ink[200], fg: palette.ink[900], label: n => String(n) },
};

/** SL-10 Verification & inspection status. */
export function VerificationStatusScreen({
  params,
}: ScreenProps<'verificationStatus'>) {
  const nav = useNav();
  const res = useSellerActivity(params.id);
  useRefocus(res.refresh);
  const [detail, setDetail] = useState<Step | null>(null);
  const a = res.data;
  const steps = a ? verificationSteps(a) : [];
  const done = steps.filter(s => s.state === 'done').length;

  const onStep = (s: Step) => {
    if (s.action === 'reupload') nav.go('reupload', { id: params.id });
    else if (s.action === 'offer') nav.go('offer', { id: params.id });
    else setDetail(s);
  };

  return (
    <Screen
      topBar={{
        title: 'Verification Status',
        sub: a ? listingTitle(a.sellRequest) : undefined,
        back: true,
      }}
      refreshing={res.refreshing}
      onRefresh={res.refresh}
    >
      <View style={styles.body}>
        {res.loading ? (
          <LoadingState />
        ) : res.error || !a ? (
          <ErrorState
            message={res.error ?? 'Could not load the status.'}
            onRetry={res.reload}
          />
        ) : (
          <>
            {a.sellRequest.status === 'rejected' ? (
              <Press
                onPress={() => nav.go('rejectedListing', { id: params.id })}
                style={[styles.summary, styles.summaryRejected]}
              >
                <View
                  style={[
                    styles.summaryIcon,
                    { backgroundColor: palette.rose[100] },
                  ]}
                >
                  <Icon name="circle-x" size={20} color="#E11D48" />
                </View>
                <View style={styles.flex}>
                  <T style={styles.summaryTitle}>
                    Listing could not be approved
                  </T>
                  <T style={styles.summarySub}>Tap to see the reason</T>
                </View>
              </Press>
            ) : (
              <View style={styles.summary}>
                <View style={styles.summaryIcon}>
                  <Icon name="clock" size={20} color="#D97706" />
                </View>
                <View style={styles.flex}>
                  <T style={styles.summaryTitle}>
                    {done === steps.length
                      ? 'Verification complete'
                      : `In review · ${done} of ${steps.length} complete`}
                  </T>
                  <T style={styles.summarySub}>
                    Most listings verify within 24–48 hrs
                  </T>
                </View>
              </View>
            )}
            <View style={styles.list}>
              {steps.map((s, i) => {
                const dot = DOT[s.state];
                return (
                  <Press
                    key={s.title}
                    onPress={() => onStep(s)}
                    pressScale={0.99}
                    style={[styles.step, stepStyle[s.state]]}
                  >
                    <View style={[styles.dot, { backgroundColor: dot.bg }]}>
                      <T style={[styles.dotText, { color: dot.fg }]}>
                        {dot.label(i + 1)}
                      </T>
                    </View>
                    <View style={styles.flex}>
                      <T style={styles.stepTitle}>{s.title}</T>
                      {s.date ? <T style={styles.stepDate}>{s.date}</T> : null}
                      {s.detail ? (
                        <T style={styles.stepDetail}>{s.detail}</T>
                      ) : null}
                    </View>
                    <Icon
                      name="chevron-right"
                      size={16}
                      color="#94A3B8"
                      style={styles.mt1}
                    />
                  </Press>
                );
              })}
            </View>
          </>
        )}
      </View>
      <Sheet
        visible={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.title}
      >
        <T style={styles.sheetText}>
          {detail?.detail ||
            (detail?.state === 'future'
              ? 'This step has not started yet. We will notify you when it begins.'
              : detail?.state === 'current'
              ? 'This step is in progress.'
              : 'Completed.')}
        </T>
        <Btn
          variant="outline"
          style={styles.full}
          onPress={() => setDetail(null)}
        >
          Close
        </Btn>
      </Sheet>
    </Screen>
  );
}

const stepStyle = StyleSheet.create({
  done: tw('border-emerald-200 bg-emerald-50'),
  alert: tw('border-amber-200 bg-amber-50'),
  current: tw('border-brand-300 bg-brand-50'),
  future: tw('border-ink-200 bg-white'),
});

const styles = StyleSheet.create({
  flex: tw('flex-1 min-w-0'),
  body: tw('px-4 pb-6'),
  summary: tw('rounded-card bg-ink-50 p-3 mb-5 flex items-center gap-3'),
  summaryRejected: tw('bg-rose-50'),
  summaryIcon: tw(
    'w-11 h-11 rounded-full bg-amber-100 items-center justify-center',
  ),
  summaryTitle: tw('text-[13px] font-semibold'),
  summarySub: tw('text-[11.5px] text-ink-500'),
  list: { gap: 8 },
  step: tw('w-full p-4 rounded-card border flex items-start gap-3'),
  dot: tw('w-7 h-7 rounded-full items-center justify-center shrink-0'),
  dotText: tw('text-[12px] font-bold'),
  stepTitle: tw('text-[14px] font-semibold text-ink-900'),
  stepDate: tw('text-[11px] text-ink-500 mt-0.5'),
  stepDetail: tw('text-[12px] text-ink-700 mt-1'),
  mt1: { marginTop: 4 },
  sheetText: tw('text-[12.5px] text-ink-500 mb-4'),
  full: tw('w-full'),
});
