import type { BadgeColor } from '../../components/Form';
import type { SalesDealStage } from '../../types/deal';
import type { BuyEnquiry } from '../../types/enquiry';
import type { Visit } from '../../types/visit';
import { dateKey, formatShortDate, fromIsoDate } from '../../utils/format';

export type EnquiryBucket = 'active' | 'completed' | 'cancelled';

/** A closed enquiry is "completed" when its deal closed, otherwise it was cancelled/withdrawn. */
export function enquiryBucket(e: BuyEnquiry): EnquiryBucket {
  if (e.status !== 'closed') return 'active';
  return e.deal?.stage === 'closed' ? 'completed' : 'cancelled';
}

const LABEL: Record<string, [string, BadgeColor]> = {
  new: ['awaiting', 'amber'],
  responded: ['responded', 'green'],
  visit_scheduled: ['visit scheduled', 'brand'],
  negotiating: ['negotiating', 'brand'],
  completed: ['completed', 'ink'],
  cancelled: ['cancelled', 'rose'],
};

export function enquiryBadge(e: BuyEnquiry): [string, BadgeColor] {
  const b = enquiryBucket(e);
  return LABEL[b === 'active' ? e.status : b] ?? [e.status, 'ink'];
}

const ACTIVE_VISIT = ['scheduled', 'confirmed', 'rescheduled'];

export function isUpcoming(v: Visit, today = new Date()) {
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  return (
    ACTIVE_VISIT.includes(v.status) &&
    fromIsoDate(dateKey(v.visitDate)) >= start
  );
}

/** Next upcoming visit of an enquiry, if any. */
export function nextVisit(e: BuyEnquiry): Visit | null {
  return (
    (e.visits ?? [])
      .filter(v => isUpcoming(v))
      .sort((a, b) => a.visitDate.localeCompare(b.visitDate))[0] ?? null
  );
}

/** One-line status note under each enquiry card. */
export function enquiryNote(e: BuyEnquiry): string {
  const v = nextVisit(e);
  if (v)
    return `Visit on ${formatShortDate(fromIsoDate(dateKey(v.visitDate)))}${
      v.visitTime ? ` · ${v.visitTime}` : ''
    }`;
  if (e.customerStageLabel) return e.customerStageLabel;
  const b = enquiryBucket(e);
  if (b === 'completed') return 'Deal completed';
  if (b === 'cancelled') return 'Enquiry closed — not pursuing';
  if (e.status === 'new') return 'Awaiting callback from advisor';
  if (e.status === 'responded') return 'Advisor has responded';
  if (e.status === 'negotiating') return 'Price negotiation in progress';
  return 'In progress';
}

/** Buyer deal stages in order, with the label and progress shown on My Deals. */
export const DEAL_STAGES: Array<[SalesDealStage, string]> = [
  ['active_leads', 'Lead'],
  ['site_visits', 'Site Visits'],
  ['negotiation', 'Negotiation'],
  ['token_payment', 'Token Payment'],
  ['full_payment', 'Full Payment'],
  ['stage_payment', 'Stage Payment'],
  ['interior_design', 'Interior Design'],
  ['documentation', 'Documentation'],
  ['closed', 'Completed'],
];

export function dealProgress(stage: SalesDealStage): {
  label: string;
  progress: number;
} {
  if (stage === 'lost') return { label: 'Lost', progress: 0 };
  if (stage === 're_engagement')
    return { label: 'Re-engagement', progress: 10 };
  const i = DEAL_STAGES.findIndex(([s]) => s === stage);
  return {
    label: DEAL_STAGES[i]?.[1] ?? stage,
    progress: i < 0 ? 0 : Math.round(((i + 1) / DEAL_STAGES.length) * 100),
  };
}
