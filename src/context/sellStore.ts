// Sell-flow state: the in-progress listing WIP, negotiation helpers, and
// My Listings link helpers. Drafts / listings are persisted via sellRequests APIs.
import { SELL_STEPS, type MyListing } from '../config/myListings';
import { PROPERTY_TYPES } from '../config/sampleData';
import * as sellRequests from '../services/sellRequests.service';
import { buildSellWizardPayload } from '../utils/sellApi';
import { errorMessage } from '../utils/errorMessage';
import { formatDateShort } from '../utils/dates';
import { saveDraft } from './draftStore';
import {
  SELL_STAGES, getJ, jActiveListing, jFind, jListing, jSet, jSetListingStage, jUpsertListing, sellStage, type ListingRecord,
} from './journeyStore';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type SellDraft = Record<string, any>;

let SD: SellDraft = {};

export function getSD(): SellDraft {
  return SD;
}

export function sdSet(patch: SellDraft) {
  SD = { ...SD, ...patch };
}

export function sdReset() {
  SD = {};
}

/** Local draft mirror + API createDraft / patch. */
export async function sellSaveDraft(currentScreen: string) {
  const idx = Math.max(1, SELL_STEPS.findIndex(s => s[0] === currentScreen) + 1 || 1);
  const d = SD.details || {}, pr = SD.price || {};
  const title = d.title || (SD.address && SD.address.area
    ? `${(PROPERTY_TYPES.find(t => t.id === SD.type) || { label: '' }).label || 'Property'}, ${SD.address.area}`
    : 'Untitled property');
  const payload = buildSellWizardPayload(SD, { draftStep: Math.min(7, Math.max(1, idx)) });
  let sellRequestId = String(SD.sellRequestId || SD.draftId || '');
  try {
    if (sellRequestId) {
      const updated = await sellRequests.patchSellRequest(sellRequestId, payload);
      sellRequestId = updated._id;
    } else {
      const created = await sellRequests.createDraft(payload);
      sellRequestId = created._id;
    }
  } catch (err) {
    throw new Error(errorMessage(err));
  }
  const dr = saveDraft({
    id: sellRequestId,
    title,
    type: SD.type || 'apartment',
    step: idx,
    price: pr.price || pr.expected || payload.askingPrice,
    area: d.builtUp || d.area || d.landArea,
    photo: Array.isArray(SD.photos) && SD.photos[0] ? String(SD.photos[0]) : '',
  });
  sdSet({ draftId: sellRequestId, sellRequestId });
  return { ...dr, stepLabel: SELL_STEPS[Math.min(idx, SELL_STEPS.length) - 1]?.[1] || 'Draft' };
}

// ─── Negotiation model (API-backed; no fake auto-replies) ─────
export const BASE_OFFER = 8250000;
export const MAX_ROUNDS = 3;

export interface Round { by: 'bg' | 'you'; amount: number; at: number; note?: string; accepted?: boolean; final?: boolean }
export interface Nego { rounds: Round[]; cur: Round; waiting: boolean; youCount: number; closed?: 'agreed' | 'declined' }

export const negoOf = (l?: ListingRecord | null): Nego => {
  const amount = (l && (l.offer || l.finalPrice)) || BASE_OFFER;
  const n = (l && l.nego) || {
    rounds: [{ by: 'bg' as const, amount, at: (l && l.at && l.at.valuation) || l?.submittedAt || Date.now() }],
  };
  const rounds: Round[] = [...n.rounds];
  const cur = rounds[rounds.length - 1] || { by: 'bg' as const, amount, at: Date.now() };
  return {
    ...n,
    rounds,
    cur,
    waiting: cur.by === 'you' && !n.closed,
    youCount: rounds.filter(r => r.by === 'you').length,
  };
};

export const jCounter = (lid: string, amount: number, note?: string) => jSet(s => ({
  ...s,
  listings: s.listings.map(l => {
    if (l.id !== lid) return l;
    const n = negoOf(l);
    return {
      ...l, counter: amount, stage: Math.max(sellStage(l), 7), at: { ...l.at, offer: l.at.offer || Date.now() },
      nego: { rounds: [...n.rounds, { by: 'you', amount, note, at: Date.now() }] },
    };
  }),
}));

export const jAgree = (lid: string, amount: number) => {
  jSet(s => ({ ...s, listings: s.listings.map(l => (l.id === lid ? { ...l, finalPrice: amount, nego: { ...negoOf(l), closed: 'agreed' } } : l)) }));
  jSetListingStage(lid, 8);
};

export const jDeclineOffer = (lid: string) => jSet(s => ({
  ...s,
  listings: s.listings.map(l => (l.id === lid ? { ...l, withdrawn: true, withdrawnAt: Date.now(), nego: { ...negoOf(l), closed: 'declined' } } : l)),
}));

// ─── My Listings reflect live journey state ──────────────────
export const sellLabel = (l: ListingRecord) => {
  if (l.rejected) return 'Rejected';
  const stage = sellStage(l);
  if (stage >= 12) return 'Sold';
  return (SELL_STAGES[stage]?.[1] || 'In progress') + (stage < 6 ? ' in progress' : '');
};

export function linkListing(l?: ListingRecord | null, into?: MyListing[]) {
  if (!l) return;
  const list = into;
  if (!list) return;
  let rec = list.find(x => x.id === (l.pid || l.id));
  if (!rec) {
    rec = {
      id: l.id, title: l.title, location: l.location, city: l.city, price: l.price, area: l.area, type: l.type, bhk: l.bhk,
      images: l.photo ? [l.photo] : [], verified: false, status: 'active', views: 0, enquiries: 0, date: formatDateShort(l.submittedAt),
      floor: '', flatNo: '', amenities: [], negotiable: true, posted: '', rating: 0, sqftPrice: 0, builder: '', desc: '', badge: '',
    } as MyListing;
    list.unshift(rec);
  }
  Object.defineProperty(rec, 'stage', { get: () => { const x = jListing(l.id); return x ? sellLabel(x) : ''; }, configurable: true });
  Object.defineProperty(rec, 'lid', { value: l.id, configurable: true });
}

export const listingFromCtx = (ctx?: Record<string, any> | null): ListingRecord | null | undefined => {
  if (ctx?.lid) return jListing(ctx.lid) || jListing(ctx.sellRequestId);
  if (ctx?.sellRequestId) return jListing(ctx.sellRequestId);
  if (ctx?.p) return getJ().listings.find(l => l.pid === ctx.p.id || l.id === ctx.p.id || l.id === ctx.p.lid);
  return jActiveListing();
};

export { jFind, jUpsertListing };
