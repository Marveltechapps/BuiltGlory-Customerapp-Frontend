// Buyer / seller journey state, buy filters and the compare list (the design's
// journey-store.jsx). The design persists this in localStorage; here it lives in
// memory for the session, since the app has no persistence layer.
import { useEffect, useState } from 'react';
import type { Property } from '../types/property';
import { getCachedProperty } from '../utils/propertyCache';

/** Legacy prototype cadence; API-driven sell listings ignore this for stage progress. */
export const J_AUTO = 6000;

export const BUY_STAGES: [string, string][] = [
  ['submitted', 'Enquiry submitted'], ['call', 'Advisor call'], ['visit', 'Site visit'], ['deal', 'Deal confirmed'],
  ['docs', 'Documents shared'], ['kyc', 'KYC & verification'], ['token', 'Token payment'], ['method', 'Payment method'],
  ['registration', 'Registration'], ['completed', 'Completed'],
];
export const SELL_STAGES: [string, string][] = [
  ['submitted', 'Submitted'], ['call', 'Verification call'], ['docs', 'Document verification'], ['inspection', 'Site inspection'],
  ['legal', 'Legal verification'], ['valuation', 'Valuation'], ['offer', 'Offer sent'], ['negotiation', 'Negotiation / accepted'],
  ['deal', 'Deal confirmed'], ['bank', 'Bank details'], ['schedule', 'Payment schedule'], ['registration', 'Registration'], ['sold', 'Sold'],
];

const DEFAULT_TOKEN_AMOUNT = 250000;
/** Prefer appConfig.payment.tokenAmount via setTokenAmount / getTokenAmount. */
export let TOKEN_AMOUNT = DEFAULT_TOKEN_AMOUNT;

export function setTokenAmount(amount?: number | null) {
  if (typeof amount === 'number' && amount > 0) TOKEN_AMOUNT = amount;
}

export function getTokenAmount(): number {
  return TOKEN_AMOUNT > 0 ? TOKEN_AMOUNT : DEFAULT_TOKEN_AMOUNT;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Visit {
  date: string;
  slot: string;
  at: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  ref: string;
  /** API visit id when booked against BG-Service */
  visitId?: string;
  visitDateIso?: string;
  rescheduled: boolean;
  doneAt?: number;
}
export interface BuyRecord {
  id: string;
  pid: string;
  stage: number;
  at: Record<string, number>;
  docsViewed: Record<string, boolean>;
  created: number;
  enquiry?: { at: number; [k: string]: any };
  visit?: Visit;
  direct?: boolean;
  cancelled?: boolean;
  cancelReason?: string;
  cancelledAt?: number;
  [k: string]: any;
}
export interface ListingRecord {
  id: string;
  pid?: string;
  title: string;
  location: string;
  city: string;
  price: number;
  area: number;
  type: string;
  bhk: number;
  photo: string;
  submittedAt: number;
  stage: number;
  at: Record<string, number>;
  rejected?: boolean;
  [k: string]: any;
}
export interface JourneyState {
  buys: BuyRecord[];
  compare: string[];
  activeBuy: string | null;
  activeListing: string | null;
  listings: ListingRecord[];
}

export const jFind = (pid: string): Property | undefined => getCachedProperty(pid);

let refSeq = 0;
export const jRef = (pre: string) => {
  refSeq += 1;
  return `${pre}-${Date.now().toString(36).toUpperCase()}-${refSeq}`;
};

const jSeed = (): JourneyState => ({
  buys: [],
  compare: [],
  activeBuy: null,
  activeListing: null,
  listings: [],
});

let J: JourneyState = jSeed();
const jSubs = new Set<(s: JourneyState) => void>();

export function getJ(): JourneyState {
  return J;
}

export function jSet(fn: JourneyState | ((s: JourneyState) => JourneyState)) {
  J = typeof fn === 'function' ? fn(J) : fn;
  jSubs.forEach(f => f(J));
}

/** Subscribe a component to journey state. */
export function useJ(): JourneyState {
  const [s, setS] = useState(J);
  useEffect(() => {
    jSubs.add(setS);
    setS(J);
    return () => { jSubs.delete(setS); };
  }, []);
  return s;
}

/** Re-render every `ms` while `on` (for time-based stage progress). */
export function useTick(on: boolean, ms = 1000) {
  const [, f] = useState(0);
  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => f(x => x + 1), ms);
    return () => clearInterval(t);
  }, [on, ms]);
}

// ─── Buyer records ───────────────────────────────────────────
export const jBuy = (pid?: string | null): BuyRecord | undefined => J.buys.find(b => b.pid === pid && !b.cancelled);

export const buyStage = (b?: BuyRecord | null): number => {
  if (!b) return -1;
  let s = b.stage;
  if (s === 1 && b.enquiry && Date.now() - b.enquiry.at > J_AUTO) s = 2;
  return s;
};

export const buyStepTime = (b: BuyRecord, k: number): number | null => {
  const key = BUY_STAGES[k][0];
  if (b.at && b.at[key]) return b.at[key];
  if (key === 'call' && b.enquiry && buyStage(b) > 1) return b.enquiry.at + J_AUTO;
  return null;
};

export const jUpsertBuy = (pid: string, patch: Partial<BuyRecord> | ((b: BuyRecord) => Partial<BuyRecord>)) => jSet(s => {
  const i = s.buys.findIndex(b => b.pid === pid && !b.cancelled);
  const base: BuyRecord = i >= 0 ? s.buys[i] : { id: jRef('BG'), pid, stage: 0, at: {}, docsViewed: {}, created: Date.now() };
  const next = { ...base, ...(typeof patch === 'function' ? patch(base) : patch) };
  const buys = [...s.buys];
  if (i >= 0) buys[i] = next; else buys.unshift(next);
  return { ...s, buys, activeBuy: pid };
});

export const jAdvanceBuy = (pid: string, to: number) => jUpsertBuy(pid, b => {
  const at = { ...b.at };
  for (let k = 0; k < to && k < BUY_STAGES.length; k++) if (!at[BUY_STAGES[k][0]]) at[BUY_STAGES[k][0]] = buyStepTime(b, k) || Date.now();
  return { stage: Math.max(buyStage(b), to), at };
});

export const jEnquire = (p: Property, info: Record<string, any>) => jUpsertBuy(p.id, b => ({
  enquiry: { at: Date.now(), ...info }, stage: Math.max(b.stage, 1), at: { ...b.at, submitted: b.at.submitted || Date.now() },
}));

export const jScheduleVisit = (
  p: Property,
  date: string,
  slot: string,
  rescheduled?: boolean,
  meta?: { visitId?: string; ref?: string; visitDateIso?: string },
) => jUpsertBuy(p.id, b => ({
  visit: {
    date,
    slot,
    at: Date.now(),
    status: 'scheduled',
    ref: meta?.ref || (b.visit && b.visit.ref) || jRef('VG'),
    visitId: meta?.visitId || b.visit?.visitId,
    visitDateIso: meta?.visitDateIso || b.visit?.visitDateIso,
    rescheduled: !!rescheduled,
  },
  direct: !b.enquiry, stage: Math.max(buyStage(b), 2),
  at: { ...b.at, submitted: b.at.submitted || Date.now(), call: b.at.call || buyStepTime(b, 1) || Date.now() },
}));

export const jCompleteVisit = (pid: string) => {
  jUpsertBuy(pid, b => ({ visit: b.visit ? { ...b.visit, status: 'completed', doneAt: Date.now() } : b.visit }));
  jAdvanceBuy(pid, 3);
};

export const jCancelBuy = (pid: string, reason: string) => jSet(s => ({
  ...s,
  buys: s.buys.map(b => (b.pid === pid && !b.cancelled)
    ? { ...b, cancelled: true, cancelReason: reason, cancelledAt: Date.now(), visit: b.visit ? { ...b.visit, status: 'cancelled' } : b.visit }
    : b),
}));

export const jVisitRef = (pid: string) => { const b = jBuy(pid); return b && b.visit ? '#' + b.visit.ref : '—'; };
export const jActiveBuyPid = (ctx?: Record<string, any> | null): string | null => (ctx && ctx.p && ctx.p.id) || (ctx && ctx.pid) || J.activeBuy;

// ─── Seller records ──────────────────────────────────────────
export const sellStage = (l?: ListingRecord | null): number => {
  if (!l) return 0;
  if (l.rejected) return l.stage || 2;
  return Math.max(0, l.stage || 0);
};

export const sellStepTime = (l: ListingRecord, k: number): number | null => {
  const key = SELL_STAGES[k][0];
  if (l.at && l.at[key]) return l.at[key];
  if (k === 0) return l.submittedAt || null;
  return null;
};

/** Upsert an API-backed sell listing into journey state. */
export const jUpsertListing = (rec: ListingRecord) => jSet(s => {
  const i = s.listings.findIndex(l => l.id === rec.id || l.sellRequestId === rec.id);
  const listings = [...s.listings];
  if (i >= 0) listings[i] = { ...listings[i], ...rec };
  else listings.unshift(rec);
  return { ...s, listings, activeListing: rec.id };
});

export const jListing = (id?: string | null) => J.listings.find(l => l.id === id);
export const jActiveListing = (ctx?: Record<string, any> | null): ListingRecord | null =>
  jListing((ctx && ctx.lid) || J.activeListing) || J.listings[0] || null;

export const jAddListing = (rec: Partial<ListingRecord>): string => {
  const id = jRef('L');
  jSet(s => ({ ...s, activeListing: id, listings: [{ id, submittedAt: Date.now(), stage: 1, at: {}, ...rec } as ListingRecord, ...s.listings] }));
  return id;
};

export const jSetListingStage = (id: string, to: number, patch: Partial<ListingRecord> = {}) => jSet(s => ({
  ...s,
  listings: s.listings.map(l => {
    if (l.id !== id) return l;
    const at = { ...l.at };
    for (let k = 0; k < to && k < SELL_STAGES.length; k++) if (!at[SELL_STAGES[k][0]]) at[SELL_STAGES[k][0]] = sellStepTime(l, k) || Date.now();
    return { ...l, ...patch, stage: Math.max(sellStage(l), to), at };
  }),
}));

export const jAdvanceActiveListing = (to: number, patch?: Partial<ListingRecord>) => {
  const l = jActiveListing();
  if (l) jSetListingStage(l.id, to, patch);
};

// ─── Compare ─────────────────────────────────────────────────
export const jToggleCompare = (pid: string): boolean => {
  const has = J.compare.includes(pid);
  if (!has && J.compare.length >= 3) return false;
  jSet(s => ({ ...s, compare: has ? s.compare.filter(x => x !== pid) : [...s.compare, pid] }));
  return true;
};

// ─── Buy filters ─────────────────────────────────────────────
export interface BuyFilters {
  types: string[];
  budget: [number, number];
  area: [number, number];
  bhk: (number | string)[];
  sort: string;
  location: string;
}
export const BF_DEFAULT: BuyFilters = { types: [], budget: [10, 300], area: [0, 4000], bhk: [], sort: 'relevance', location: '' };
let BF: BuyFilters = { ...BF_DEFAULT };
const bfSubs = new Set<(f: BuyFilters) => void>();

export function getBF(): BuyFilters {
  return BF;
}

export function setBF(v: BuyFilters) {
  BF = v;
  bfSubs.forEach(f => f(v));
}

export function useBF(): BuyFilters {
  const [f, setF] = useState(BF);
  useEffect(() => {
    bfSubs.add(setF);
    setF(BF);
    return () => { bfSubs.delete(setF); };
  }, []);
  return f;
}

export const bfCount = (f: BuyFilters) => (f.types.length ? 1 : 0) + ((f.budget[0] !== 10 || f.budget[1] !== 300) ? 1 : 0)
  + ((f.area[0] !== 0 || f.area[1] !== 4000) ? 1 : 0) + (f.bhk.length ? 1 : 0) + (f.sort !== 'relevance' ? 1 : 0) + (f.location.trim() ? 1 : 0);

const daysAgo = (s: string) => {
  const m = String(s || '').match(/(\d+)\s*(day|week|month)/);
  if (!m) return 0;
  return +m[1] * (m[2] === 'week' ? 7 : m[2] === 'month' ? 30 : 1);
};

export const applyBF = (list: Property[], f: BuyFilters): Property[] => {
  const q = f.location.trim().toLowerCase();
  const r = list.filter(p =>
    (!f.types.length || f.types.includes(p.type)) &&
    p.price >= f.budget[0] * 1e5 && (f.budget[1] >= 300 || p.price <= f.budget[1] * 1e5) &&
    p.area >= f.area[0] && (f.area[1] >= 4000 || p.area <= f.area[1]) &&
    (!f.bhk.length || f.bhk.some(b => (b === '5+' ? p.bhk >= 5 : p.bhk === b))) &&
    (!q || (p.location + ' ' + p.city + ' ' + p.title).toLowerCase().includes(q)));
  if (f.sort === 'price-asc') r.sort((a, b) => a.price - b.price);
  if (f.sort === 'price-desc') r.sort((a, b) => b.price - a.price);
  if (f.sort === 'new') r.sort((a, b) => daysAgo(a.posted) - daysAgo(b.posted));
  return r;
};

export const QUICK: Record<string, (p: Property) => boolean> = {
  Verified: p => p.verified,
  'Under ₹1Cr': p => p.price < 1e7,
  '3+ BHK': p => p.bhk >= 3,
  Negotiable: p => p.negotiable,
};

export const applyQuick = (list: Property[], chips: Set<string>) => list.filter(p => [...chips].every(c => !QUICK[c] || QUICK[c](p)));
