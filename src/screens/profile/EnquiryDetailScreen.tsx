import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Btn } from '../../components/Btn';
import { Timeline, type TimelineStep } from '../../components/Layout';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { Press } from '../../components/Press';
import { Screen, ScreenFooter } from '../../components/Screen';
import { ErrorState, LoadingState } from '../../components/States';
import { T } from '../../components/T';
import { useAuth } from '../../context/AuthContext';
import { useResource } from '../../lib/useResource';
import { useNav, useRefocus } from '../../navigation/NavContext';
import type { ScreenProps } from '../../navigation/types';
import { getMyEnquiry } from '../../services/enquiry.service';
import { getProperty } from '../../services/property.service';
import type { BuyEnquiry } from '../../types/enquiry';
import type { User } from '../../types/user';
import { tw } from '../../theme';
import {
  dateKey,
  formatDateTime,
  formatINR,
  formatLongDate,
  formatShortDate,
  fromIsoDate,
} from '../../utils/format';
import { toPropertyView } from '../../utils/property';
import { sharedDocuments } from '../buy/DocumentsSharedScreen';
import { enquiryBucket, nextVisit } from './enquiryShared';

type Action = { label: string; onPress: () => void };

/** The 10-step buyer pipeline derived from the enquiry, its visits and the linked sales deal. */
function buyerSteps(
  e: BuyEnquiry,
  user: User | null,
  act: (key: string) => Action | null,
): TimelineStep[] {
  const deal = e.deal;
  const visits = e.visits ?? [];
  const upcoming = nextVisit(e);
  const visited = visits.some(v => v.status === 'completed');
  const docs = sharedDocuments(e);
  const fin = deal?.financials;
  const reg = deal?.documentation?.registration;
  const closed = deal?.stage === 'closed';
  const raw: Array<
    Omit<TimelineStep, 'state'> & { done: boolean; key?: string }
  > = [
    {
      title: 'Enquiry Submitted',
      done: true,
      date: formatDateTime(e.submittedAt ?? e.createdAt),
    },
    {
      title: 'Verification Call',
      done: e.status !== 'new',
      detail: e.status !== 'new' ? 'Advisor confirmed your interest' : null,
    },
    {
      title: 'Visit Scheduled',
      done: visited || Boolean(deal),
      detail: upcoming
        ? `${formatShortDate(fromIsoDate(dateKey(upcoming.visitDate)))}${
            upcoming.visitTime ? ` · ${upcoming.visitTime}` : ''
          }`
        : null,
      key: 'visit',
    },
    { title: 'Deal Confirmed', done: Boolean(deal) },
    {
      title: 'Documents Shared',
      done: docs.length > 0,
      detail: docs.length
        ? `${docs.length} ${
            docs.length === 1 ? 'document' : 'documents'
          } shared`
        : null,
      key: docs.length ? 'docs' : undefined,
    },
    {
      title: 'KYC Verified',
      done: user?.kycStatus === 'verified',
      detail:
        user?.kycStatus === 'rejected'
          ? 'KYC was rejected — contact your advisor'
          : null,
    },
    {
      title: 'Token Payment',
      done: Boolean(fin?.tokenPaid),
      key: deal ? 'payment' : undefined,
    },
    {
      title: 'Payment Method',
      done: Boolean(fin?.paymentType),
      detail: fin?.paymentType
        ? fin.paymentType === 'full'
          ? 'Full payment'
          : 'Stage payments'
        : null,
    },
    {
      title: 'Registration',
      done: closed,
      detail: reg?.registrationDate
        ? formatLongDate(reg.registrationDate)
        : null,
      key: deal ? 'registration' : undefined,
    },
    {
      title: 'Completed',
      done: closed,
      date: closed && deal?.closedAt ? formatDateTime(deal.closedAt) : null,
    },
  ];
  const cancelled = enquiryBucket(e) === 'cancelled';
  const first = raw.findIndex(s => !s.done);
  return raw.map((s, i) => {
    const action = s.key ? act(s.key) : null;
    return {
      title: s.title,
      date: s.date,
      detail: s.detail,
      state: s.done
        ? 'done'
        : i === first
        ? cancelled
          ? 'alert'
          : 'current'
        : 'future',
      action: action ? (
        <Press
          onPress={action.onPress}
          pressScale={1}
          style={styles.stepAction}
        >
          <T style={styles.stepActionText}>{action.label} →</T>
        </Press>
      ) : undefined,
    };
  });
}

/** P-08 Enquiry detail / buyer status tracker (GET /me/buy-enquiries/:id). */
export function EnquiryDetailScreen({ params }: ScreenProps<'enquiryDetail'>) {
  const nav = useNav();
  const { user } = useAuth();
  const res = useResource(
    signal => getMyEnquiry(params.id, signal),
    [params.id],
  );
  useRefocus(res.refresh);
  const e = res.data;
  // The property may have been withdrawn since the enquiry: GET /properties/:id → 404 shows B-18.
  const prop = useResource(
    signal => getProperty(e!.propertyId, signal).then(toPropertyView),
    [e?.propertyId],
    Boolean(e),
  );

  useEffect(() => {
    if (e && prop.errorStatus === 404)
      nav.replace('propertyWithdrawn', { enquiry: e });
  }, [e, prop.errorStatus, nav]);

  const act = (key: string): Action | null => {
    if (!e) return null;
    const visit = nextVisit(e);
    if (key === 'visit' && visit)
      return {
        label: 'Reschedule',
        onPress: () =>
          nav.go('rescheduleVisit', {
            visit,
            property: prop.data ?? undefined,
            propertyTitle: e.propertySnapshot?.title,
          }),
      };
    if (key === 'visit' && !visit && enquiryBucket(e) === 'active' && prop.data)
      return {
        label: 'Schedule visit',
        onPress: () =>
          nav.go('visitCalendar', { property: prop.data!, enquiryId: e._id }),
      };
    if (key === 'docs')
      return {
        label: 'View documents',
        onPress: () => nav.go('documentsShared', { enquiryId: e._id }),
      };
    if (key === 'payment' && !e.deal?.financials?.tokenPaid)
      return {
        label: 'Pay token',
        onPress: () => nav.go('payment', { enquiryId: e._id }),
      };
    if (
      key === 'registration' &&
      e.deal?.documentation?.registration?.registrationDate
    )
      return {
        label: 'View details',
        onPress: () => nav.go('registrationDetails', { enquiryId: e._id }),
      };
    return null;
  };

  const canCancel = e
    ? ['new', 'responded', 'visit_scheduled'].includes(e.status)
    : false;
  const snap = e?.propertySnapshot ?? {};
  const p = prop.data;

  return (
    <Screen
      topBar={{ title: 'Enquiry Status', sub: '10-step pipeline', back: true }}
      padBottom={canCancel}
      refreshing={res.refreshing}
      onRefresh={res.refresh}
      footer={
        canCancel && e ? (
          <ScreenFooter>
            <Press
              onPress={() =>
                nav.go('cancelEnquiry', { enquiryId: e._id, title: snap.title })
              }
              pressScale={0.99}
              style={styles.cancel}
            >
              <T style={styles.cancelText}>Cancel Enquiry</T>
            </Press>
          </ScreenFooter>
        ) : undefined
      }
    >
      <View style={styles.body}>
        {res.loading ? (
          <LoadingState />
        ) : res.error ? (
          <ErrorState message={res.error} onRetry={res.reload} />
        ) : e ? (
          <>
            <Press
              onPress={() =>
                nav.go('propertyDetail', {
                  id: e.propertyId,
                  property: p ?? undefined,
                })
              }
              pressScale={0.99}
              style={styles.card}
            >
              <PhotoPlaceholder
                tag={e.propertyId}
                src={p?.images[0]}
                style={styles.thumb}
              />
              <View style={styles.flex}>
                <T style={styles.title} numberOfLines={1}>
                  {snap.title || p?.title || 'Property'}
                </T>
                <T style={styles.place} numberOfLines={1}>
                  {p
                    ? [p.location, p.city].filter(Boolean).join(', ')
                    : snap.location}
                </T>
                <T style={styles.price}>{formatINR(snap.price ?? p?.price)}</T>
                <T style={styles.ref}>Ref ID: {e.referenceId}</T>
              </View>
            </Press>
            <Timeline steps={buyerSteps(e, user, act)} />
            {p && p.status === 'sold' ? (
              <Btn
                variant="outline"
                style={styles.soldBtn}
                icon="search"
                onPress={() => nav.go('soldOut', { property: p })}
              >
                This property has been sold
              </Btn>
            ) : null}
          </>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: tw('flex-1 min-w-0'),
  body: tw('px-4'),
  card: tw(
    'rounded-card border border-ink-200 overflow-hidden mb-5 flex gap-3 p-3 bg-white',
  ),
  thumb: { ...tw('rounded-md shrink-0'), width: 72, height: 72 },
  title: tw('text-[14px] font-semibold'),
  place: tw('text-[11.5px] text-ink-500'),
  price: tw('text-[14px] font-bold text-brand-600 mt-1'),
  ref: tw('text-[10.5px] text-ink-400 mt-0.5'),
  stepAction: tw('mt-1.5'),
  stepActionText: tw('text-[12px] font-semibold text-brand-600'),
  cancel: tw('w-full h-12 rounded-xl items-center justify-center'),
  cancelText: tw('font-medium text-[14px] text-rose-600'),
  soldBtn: tw('w-full mt-4'),
});
