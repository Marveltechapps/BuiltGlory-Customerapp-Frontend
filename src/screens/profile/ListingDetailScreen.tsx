import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Btn } from '../../components/Btn';
import { Badge } from '../../components/Form';
import { Icon } from '../../components/Icon';
import { Divided, Grid } from '../../components/Layout';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { Press } from '../../components/Press';
import { Screen } from '../../components/Screen';
import { Sheet } from '../../components/Sheet';
import { ErrorState, LoadingState } from '../../components/States';
import { T } from '../../components/T';
import { useAuth } from '../../context/AuthContext';
import { useNav, useRefocus } from '../../navigation/NavContext';
import type { ScreenName, ScreenProps } from '../../navigation/types';
import type { AcquisitionStage, SellerActivity } from '../../types/sellRequest';
import type { User } from '../../types/user';
import { palette, tw } from '../../theme';
import { formatDateTime, formatINR, groupIN } from '../../utils/format';
import {
  listingTitle,
  SELL_STATUS_LABEL,
  useSellerActivity,
} from '../sell/sellShared';
import { verificationSteps } from '../sell/VerificationStatusScreen';

type State = 'done' | 'current' | 'alert' | 'future';
interface PipelineStep {
  title: string;
  state: State;
  date?: string;
  detail?: string;
  target?: ScreenName;
}

const STAGES: AcquisitionStage[] = [
  'pending_review',
  'site_inspection',
  'valuation',
  'negotiation',
  'token_to_seller',
  'documentation',
  'seller_payout',
  'acquired',
];
const ACCEPTED = [
  'seller_accepted',
  'accepted',
  'token_to_seller',
  'documentation',
  'seller_payout',
  'acquired',
];

/** The 13-step seller pipeline, derived from the seller activity. Only the first non-done step is "current". */
function pipeline(a: SellerActivity, user: User | null): PipelineStep[] {
  const req = a.sellRequest;
  const idx = a.acquisition?.stage ? STAGES.indexOf(a.acquisition.stage) : -1;
  const review = verificationSteps(a);
  const offer = a.offer;
  const accepted = offer ? ACCEPTED.includes(offer.status) : false;
  const paid =
    a.payoutSchedule.length > 0 &&
    a.payoutSchedule.every(p => p.status === 'paid');
  const sold = req.status === 'sold' || a.acquisition?.stage === 'acquired';
  const flag = (cond: boolean): State => (cond ? 'done' : 'future');
  const steps: PipelineStep[] = [
    {
      title: 'Submitted',
      state: req.status === 'draft' ? 'future' : 'done',
      date: req.submittedAt ? formatDateTime(req.submittedAt) : undefined,
    },
    { ...review[1], state: review[1].state === 'done' ? 'done' : 'future' },
    {
      ...review[2],
      state:
        review[2].state === 'alert'
          ? 'alert'
          : review[2].state === 'done'
          ? 'done'
          : 'future',
      target: review[2].state === 'alert' ? 'reupload' : undefined,
    },
    { title: 'Site Inspection', state: flag(idx > 1) },
    { title: 'Legal Verification', state: flag(idx > 2) },
    {
      title: 'Valuation',
      state: flag(Boolean(offer) || idx > 2),
      detail: offer
        ? undefined
        : idx === 2
        ? 'AI + field valuation underway'
        : undefined,
    },
    {
      title: 'Offer Sent',
      state: flag(Boolean(offer)),
      detail: offer ? formatINR(offer.amount) : undefined,
      target: offer ? 'offer' : undefined,
    },
    {
      title: 'Negotiation / Accepted',
      state: flag(accepted),
      detail:
        offer?.status === 'seller_countered'
          ? `Counter of ${formatINR(offer.counterAmount)} under review`
          : undefined,
      target: offer ? (accepted ? 'dealConfirmed' : 'offer') : undefined,
    },
    {
      title: 'Deal Confirmed',
      state: flag(accepted && idx >= 4),
      target: accepted ? 'dealConfirmed' : undefined,
    },
    {
      title: 'Bank Details',
      state: flag(Boolean(user?.bankDetails) && accepted),
      detail: user?.bankDetails
        ? `${user.bankDetails.bankName} ••${user.bankDetails.accountNumberLast4}`
        : undefined,
      target: accepted ? 'dealConfirmed' : undefined,
    },
    {
      title: 'Payment Schedule',
      state: flag(paid),
      target: a.payoutSchedule.length ? 'paymentSchedule' : undefined,
    },
    {
      title: 'Registration',
      state: flag(a.registration.status === 'completed'),
      target: accepted ? 'sellRegistration' : undefined,
    },
    {
      title: 'Sold / Withdrawn',
      state:
        req.status === 'rejected' || req.status === 'paused'
          ? 'alert'
          : flag(sold),
      target: sold
        ? 'dealComplete'
        : req.status === 'rejected'
        ? 'rejectedListing'
        : undefined,
    },
  ];
  const first = steps.findIndex(s => s.state !== 'done');
  if (first >= 0 && steps[first].state === 'future')
    steps[first] = { ...steps[first], state: 'current' };
  return steps;
}

const DOT: Record<State, { bg: string; fg: string }> = {
  done: { bg: palette.emerald[500], fg: '#FFFFFF' },
  current: { bg: palette.brand[600], fg: '#FFFFFF' },
  alert: { bg: palette.amber[500], fg: '#FFFFFF' },
  future: { bg: palette.ink[200], fg: palette.ink[900] },
};

/** P-05 Listing detail / seller status tracker. */
export function ListingDetailScreen({ params }: ScreenProps<'listingDetail'>) {
  const nav = useNav();
  const { user } = useAuth();
  const res = useSellerActivity(params.id);
  useRefocus(res.refresh);
  const [detail, setDetail] = useState<PipelineStep | null>(null);
  const a = res.data;
  const req = a?.sellRequest;
  const steps = a ? pipeline(a, user) : [];
  const currentIdx = steps.findIndex(s => s.state !== 'done');
  const current = currentIdx >= 0 ? steps[currentIdx] : null;
  const editable = req
    ? ['draft', 'changes_requested'].includes(req.status)
    : false;

  const onStep = (s: PipelineStep) => {
    if (s.target) nav.go(s.target, { id: params.id } as never);
    else setDetail(s);
  };

  return (
    <Screen
      topBar={{
        title: 'Listing Status',
        sub: `${steps.length || 13}-step pipeline`,
        back: true,
        right: editable ? (
          <Press
            onPress={() => nav.go('editListing', { id: params.id })}
            pressScale={1}
          >
            <T style={styles.edit}>Edit</T>
          </Press>
        ) : undefined,
      }}
      refreshing={res.refreshing}
      onRefresh={res.refresh}
    >
      <View style={styles.body}>
        {res.loading ? (
          <LoadingState />
        ) : res.error || !a || !req ? (
          <ErrorState
            message={res.error ?? 'Listing not found.'}
            onRetry={res.reload}
          />
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.head}>
                <PhotoPlaceholder
                  tag={req._id}
                  src={req.photos?.[0]}
                  style={styles.thumb}
                >
                  <View style={styles.badge}>
                    <Badge color="brand">
                      {SELL_STATUS_LABEL[req.status] ?? req.status}
                    </Badge>
                  </View>
                </PhotoPlaceholder>
                <View style={styles.flex}>
                  <T style={styles.title} numberOfLines={1}>
                    {listingTitle(req)}
                  </T>
                  <T style={styles.place} numberOfLines={1}>
                    {[req.address?.locality, req.address?.city]
                      .filter(Boolean)
                      .join(', ') || req.referenceId}
                  </T>
                  <T style={styles.price}>
                    {req.askingPrice ? formatINR(req.askingPrice) : '—'}
                  </T>
                </View>
              </View>
              <Grid cols={3} gap={0} style={styles.stats}>
                {[
                  [groupIN(req.metrics?.views ?? 0), 'Views'],
                  [String(a.metrics.enquiryCount), 'Enquiries'],
                  [
                    current ? `Step ${currentIdx + 1}` : 'Done',
                    `of ${steps.length}`,
                  ],
                ].map(([v, l], i) => (
                  <View
                    key={l}
                    style={[styles.stat, i > 0 && styles.statDivider]}
                  >
                    <T style={styles.statValue}>{v}</T>
                    <T style={styles.statLabel}>{l}</T>
                  </View>
                ))}
              </Grid>
              <Divided horizontal style={styles.actions}>
                {(
                  [
                    ['Enquiries', 'sellEnquiries', styles.actionInk],
                    ['Visits', 'sellVisitMgmt', styles.actionInk],
                    ['Chat', 'sellChat', styles.actionBrand],
                    ['Status', 'verificationStatus', styles.actionMuted],
                  ] as const
                ).map(([label, target, tone]) => (
                  <Press
                    key={label}
                    pressScale={1}
                    onPress={() => nav.go(target, { id: params.id })}
                    style={styles.action}
                  >
                    <T style={[styles.actionText, tone]}>{label}</T>
                  </Press>
                ))}
              </Divided>
            </View>
            {current ? (
              <View style={styles.progress}>
                <View style={styles.progressIcon}>
                  <Icon name="zap" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.flex}>
                  <T style={styles.progressTitle}>
                    Step {currentIdx + 1} of {steps.length} · {current.title}
                  </T>
                  <T style={styles.progressSub}>
                    {current.detail ??
                      (current.state === 'alert'
                        ? 'Action needed from you'
                        : 'In progress')}
                  </T>
                </View>
              </View>
            ) : null}
            <View style={styles.list}>
              {steps.map((s, i) => (
                <Press
                  key={s.title}
                  onPress={() => onStep(s)}
                  pressScale={0.99}
                  style={[styles.step, stepTone[s.state]]}
                >
                  <View
                    style={[styles.dot, { backgroundColor: DOT[s.state].bg }]}
                  >
                    <T style={[styles.dotText, { color: DOT[s.state].fg }]}>
                      {s.state === 'done'
                        ? '✓'
                        : s.state === 'current'
                        ? '◐'
                        : s.state === 'alert'
                        ? '!'
                        : i + 1}
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
                    style={styles.chev}
                  />
                </Press>
              ))}
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
              ? 'This step has not started yet.'
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

const stepTone = StyleSheet.create({
  done: tw('border-emerald-200 bg-emerald-50'),
  current: tw('border-brand-300 bg-brand-50'),
  alert: tw('border-amber-200 bg-amber-50'),
  future: tw('border-ink-200 bg-white'),
});

const styles = StyleSheet.create({
  flex: tw('flex-1 min-w-0'),
  full: tw('w-full'),
  body: tw('px-4 pb-6'),
  edit: tw('text-brand-600 text-[13px] font-semibold'),
  card: tw('rounded-card border border-ink-200 overflow-hidden mb-5 bg-white'),
  head: tw('flex gap-3 p-3'),
  thumb: { ...tw('rounded-md shrink-0'), width: 72, height: 72 },
  badge: tw('absolute top-1 left-1'),
  title: tw('text-[14px] font-semibold'),
  place: tw('text-[11.5px] text-ink-500'),
  price: tw('text-[14px] font-bold text-brand-600 mt-1'),
  stats: tw('border-t border-ink-100'),
  stat: tw('py-2.5 items-center'),
  statDivider: tw('border-l border-ink-100'),
  statValue: tw('text-[14px] font-bold'),
  statLabel: tw('text-[10px] text-ink-500'),
  actions: tw('border-t border-ink-100'),
  action: tw('py-2 items-center'),
  actionText: tw('text-[11.5px] font-semibold'),
  actionInk: tw('text-ink-700'),
  actionBrand: tw('text-brand-700'),
  actionMuted: tw('text-ink-500'),
  progress: tw('rounded-card bg-brand-50 p-3 mb-5 flex items-center gap-3'),
  progressIcon: tw(
    'w-11 h-11 rounded-full bg-brand-600 items-center justify-center',
  ),
  progressTitle: tw('text-[13px] font-semibold'),
  progressSub: tw('text-[11.5px] text-brand-700'),
  list: { gap: 8 },
  step: tw('w-full p-4 rounded-card border flex items-start gap-3'),
  dot: tw('w-7 h-7 rounded-full items-center justify-center shrink-0'),
  dotText: tw('text-[12px] font-bold'),
  stepTitle: tw('text-[14px] font-semibold text-ink-900'),
  stepDate: tw('text-[11px] text-ink-500 mt-0.5'),
  stepDetail: tw('text-[12px] text-ink-700 mt-1'),
  chev: { marginTop: 4 },
  sheetText: tw('text-[12.5px] text-ink-500 mb-4'),
});
