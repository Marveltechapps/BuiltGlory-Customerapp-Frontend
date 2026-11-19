// Stage-based next steps for a buyer record (journey-buy2.jsx).
import { buzz } from '../ui/Press';
import { BUY_STAGES, buyStage, jAdvanceBuy, jCompleteVisit, type BuyRecord } from '../../context/journeyStore';
import type { Ctx, ScreenName } from '../../navigation/types';
import type { Property } from '../../types/property';
import type { BadgeColor } from '../ui/Badge';

type Go = (s: ScreenName, ctx?: Ctx) => void;

export const buyNext = (b: BuyRecord): { label: string; key: ScreenName | null } | null => {
  const s = buyStage(b);
  if (b.cancelled) return null;
  const steps: ({ label: string; key: ScreenName | null } | null)[] = [
    null, null,
    b.visit ? (b.visit.status === 'scheduled' ? { label: 'Visit booked', key: null } : null) : { label: 'Schedule visit', key: 'visitCalendar' },
    { label: 'Confirm deal', key: 'buyerDeal' },
    { label: 'Review documents', key: 'documentsShared' },
    { label: 'Complete KYC', key: 'buyerKyc' },
    { label: 'Pay token', key: 'payment' },
    { label: 'Pay token', key: 'payment' },
    { label: 'Registration', key: 'registrationDetails' },
    null,
  ];
  return steps[s] || null;
};

export interface JourneyAction { label: string; icon: string; fn: () => void; primary?: boolean }

/** One set of actions per stage, used on My Enquiries cards and the tracker dock. */
export const enquiryActions = (b: BuyRecord, p: Property, go: Go): JourneyAction[] => {
  const st = buyStage(b);
  const A = (label: string, icon: string, fn: () => void, primary?: boolean): JourneyAction => ({ label, icon, fn, primary });
  if (b.cancelled) return [A('Enquire again', 'rotate-ccw', () => go('enquiry', { p }), true), A('Similar', 'search', () => go('buyList', { type: p.type }))];
  switch (st) {
    case 0: case 1: return [A('Schedule visit', 'calendar-plus', () => go('visitCalendar', { p }), true), A('Call advisor', 'phone', () => go('callUs'))];
    case 2: return b.visit && b.visit.status === 'scheduled'
      ? [A('Mark visited', 'check-circle-2', () => { jCompleteVisit(p.id); buzz(12); }, true), A('Reschedule', 'calendar-clock', () => go('rescheduleVisit', { p }))]
      : [A('Schedule visit', 'calendar-plus', () => go('visitCalendar', { p }), true), A('Call advisor', 'phone', () => go('callUs'))];
    case 3: return [A('Confirm deal', 'handshake', () => go('buyerDeal', { p }), true), A('Term sheet', 'file-text', () => go('pdfViewer', { title: 'Term Sheet' }))];
    case 4: return [A('Review docs', 'folder-open', () => go('documentsShared', { p }), true), A('View deal', 'handshake', () => go('buyerDeal', { p }))];
    case 5: return [A('Complete KYC', 'shield-check', () => go('buyerKyc', { p }), true), A('Documents', 'folder-open', () => go('documentsShared', { p }))];
    case 6: case 7: return [A('Pay token', 'credit-card', () => go('payment', { p }), true), A('KYC details', 'id-card', () => go('buyerKyc', { p }))];
    case 8: return [A('Registered', 'badge-check', () => { jAdvanceBuy(p.id, 9); buzz(14); }, true), A('Appointment', 'map-pin', () => go('registrationDetails', { p }))];
    default: return [A('Sale deed', 'file-down', () => go('pdfViewer', { title: 'Sale Deed' }), true), A('Receipt', 'receipt', () => go('pdfViewer', { title: 'Token Receipt' }))];
  }
};

export const buyStatus = (b: BuyRecord): [string, BadgeColor] =>
  b.cancelled ? ['Cancelled', 'rose'] : buyStage(b) >= 9 ? ['Completed', 'green'] : [BUY_STAGES[buyStage(b)][1], 'brand'];
