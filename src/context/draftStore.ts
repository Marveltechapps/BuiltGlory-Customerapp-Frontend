// Local mirror of sell drafts for the My Drafts UI. Source of truth is
// GET /me/sell-requests?status=draft — this cache is filled after API saves.
import { formatDateShort } from '../utils/dates';

export interface Draft {
  id: string;
  title: string;
  type: string;
  step: number;
  photo: string;
  price: number | null;
  area: number | null;
  updated: string;
}

let drafts: Draft[] = [];

export function getDrafts(): Draft[] {
  return drafts;
}

export function setDrafts(next: Draft[]) {
  drafts = next;
}

export function saveDraft(d: Omit<Partial<Draft>, 'price' | 'area'> & { price?: number | string | null; area?: number | string | null }): Draft {
  const draft: Draft = {
    id: d.id || 'd' + Date.now(),
    title: d.title || 'Untitled property',
    type: d.type || 'apartment',
    step: d.step || 1,
    photo: d.photo || '',
    price: d.price ? Number(d.price) : null,
    area: d.area ? Number(d.area) : null,
    updated: formatDateShort(new Date()),
  };
  drafts = [draft, ...drafts.filter(x => x.id !== draft.id)];
  return draft;
}

export function deleteDraft(id: string) {
  drafts = drafts.filter(x => x.id !== id);
}
