import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { propertyTypeById } from '../config/catalog';
import { sellKind } from '../screens/sell/sellCategory';
import { uploadDocument } from '../services/document.service';
import {
  createSellDraft,
  submitMySellRequest,
  updateMySellRequest,
} from '../services/sellRequest.service';
import type { SellRequest, SellRequestPayload } from '../types/sellRequest';
import type { PickedFile } from '../utils/media';
import { errorMessage } from '../utils/errorMessage';
import { useAuth } from './AuthContext';

export interface SellPhoto {
  key: string;
  uri: string;
  url?: string;
  status: 'uploading' | 'done' | 'error';
  error?: string;
}

/** Everything collected across SL-02 … SL-07. Strings mirror the inputs; numbers are parsed on save. */
export interface SellForm {
  typeId: string;
  title: string;
  subType: string;
  /** '1'…'4', '5+', 'Studio' */
  bhk: string;
  builtUp: string;
  carpet: string;
  floor: string;
  totalFloors: string;
  unitNo: string;
  /** Canonical labels from SL-02: 'Under Construction', '0–1 year', '1–5 years', '5–10 years', '10+ years'. */
  age: string;
  building: string;
  locality: string;
  city: string;
  pin: string;
  ownership: string;
  facing: string;
  furnish: string;
  parking: number;
  parkingType: string;
  share: string;
  totalValue: string;
  scope: string;
  furnishDetails: string;
  suitableFor: string;
  plotArea: string;
  landArea: string;
  zoning: string;
  roadAccess: string;
  water: boolean;
  electricity: boolean;
  fencing: boolean;
  garden: boolean;
  terrace: boolean;
  borewell: boolean;
  amenities: string[];
  photos: SellPhoto[];
  price: string;
  negotiable: boolean;
}

export const EMPTY_SELL_FORM: SellForm = {
  typeId: 'apartment',
  title: '',
  subType: '',
  bhk: '',
  builtUp: '',
  carpet: '',
  floor: '',
  totalFloors: '',
  unitNo: '',
  age: '',
  building: '',
  locality: '',
  city: 'Chennai',
  pin: '',
  ownership: 'Freehold',
  facing: 'East',
  furnish: 'Unfurnished',
  parking: 1,
  parkingType: '',
  share: '',
  totalValue: '',
  scope: '',
  furnishDetails: '',
  suitableFor: '',
  plotArea: '',
  landArea: '',
  zoning: '',
  roadAccess: '',
  water: false,
  electricity: false,
  fencing: false,
  garden: false,
  terrace: false,
  borewell: false,
  amenities: ['Lift', 'Parking', 'Power Backup', 'Security'],
  photos: [],
  price: '',
  negotiable: true,
};

// Feature checkboxes on SL-04 have no `specifications` key in the backend, so they travel as amenities.
const FEATURE_AMENITIES: Array<[keyof SellForm, string]> = [
  ['water', 'Water source available'],
  ['electricity', 'Electricity connection'],
  ['fencing', 'Compound wall/fencing'],
  ['garden', 'Garden'],
  ['terrace', 'Terrace'],
  ['borewell', 'Borewell'],
];

const num = (v: string) => {
  const n = Number(String(v).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};
const text = (v: string) => (v && v.trim() ? v.trim() : undefined);

export function toSellPayload(
  form: SellForm,
  step?: number,
): SellRequestPayload {
  const type = propertyTypeById(form.typeId);
  const kind = sellKind(form.typeId);
  const features = FEATURE_AMENITIES.filter(([k]) => form[k]).map(
    ([, label]) => label,
  );
  const extras = [
    form.zoning ? `Zoning: ${form.zoning.trim()}` : '',
    form.roadAccess ? `Road access: ${form.roadAccess}` : '',
  ].filter(Boolean);
  const amenities = [...new Set([...form.amenities, ...features, ...extras])];
  const furnished =
    form.furnish && form.furnish.toLowerCase() !== 'unfurnished';
  const homeSpecs = {
    subType: text(form.subType),
    bhk: text(form.bhk),
    builtUpArea: num(form.builtUp),
    carpetArea: num(form.carpet),
    plotArea: num(form.plotArea) ?? num(form.landArea),
    floor: text(form.floor),
    totalFloors: num(form.totalFloors),
    unitNo: text(form.unitNo),
    age: text(form.age),
    facing: text(form.facing),
    furnishing: text(form.furnish),
    furnishDetails: furnished ? text(form.furnishDetails) : undefined,
    parking: form.parking >= 0 ? form.parking : undefined,
    parkingType: form.parking > 0 ? text(form.parkingType) : undefined,
  };
  const specs =
    kind === 'home'
      ? homeSpecs
      : kind === 'plot'
        ? {
            subType: text(form.subType),
            plotArea: num(form.plotArea) ?? num(form.landArea),
            facing: text(form.facing),
          }
        : kind === 'commercial'
          ? {
              subType: text(form.subType),
              commercialType: text(form.suitableFor),
              builtUpArea: num(form.builtUp),
              plotArea: num(form.plotArea),
              floor: text(form.floor),
              facing: text(form.facing),
              parking: form.parking >= 0 ? form.parking : undefined,
              parkingType: form.parking > 0 ? text(form.parkingType) : undefined,
            }
          : kind === 'fractional'
            ? {
                sharePercentage: num(form.share),
                totalPropertyValue: num(form.totalValue),
              }
            : { scopeOfWork: text(form.scope) };
  const payload: SellRequestPayload = {
    propertyType: type?.apiType ?? form.typeId,
    propertyTitle: form.title.trim(),
    askingPrice: num(form.price),
    negotiable: form.negotiable,
    address: {
      street: text(form.building),
      locality: text(form.locality),
      city: text(form.city),
      pincode: text(form.pin),
    },
    specifications: Object.fromEntries(
      Object.entries(specs).filter(([, v]) => v !== undefined),
    ),
    amenities,
    ...(kind === 'interior' ? {} : { ownershipType: text(form.ownership) }),
    photos: form.photos.filter(p => p.url).map(p => p.url as string),
    draftStep: step,
  };
  if (!payload.askingPrice) delete payload.askingPrice;
  return payload;
}

const AGE_FROM_API: Record<string, string> = {
  New: '0–1 year',
  '1-5y': '1–5 years',
  '5-10y': '5–10 years',
  '10+y': '10+ years',
};

/** Load an existing sell request back into the form (edit / resume draft). */
export function fromSellRequest(req: SellRequest): SellForm {
  const s = (req.specifications ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));
  const amenities = req.amenities ?? [];
  const has = (label: string) => amenities.includes(label);
  const option = propertyTypeById(req.propertyType ?? '');
  return {
    ...EMPTY_SELL_FORM,
    typeId: option?.id ?? req.propertyType ?? 'apartment',
    title: req.propertyTitle ?? '',
    subType: str(s.subType),
    bhk: str(s.bhk),
    builtUp: str(s.builtUpArea),
    carpet: str(s.carpetArea),
    floor: str(s.floor),
    totalFloors: str(s.totalFloors),
    unitNo: str(s.unitNo),
    age: AGE_FROM_API[str(s.age)] ?? str(s.age),
    building: req.address?.street ?? '',
    locality: req.address?.locality ?? '',
    city: req.address?.city ?? '',
    pin: req.address?.pincode ?? '',
    ownership: req.ownershipType ?? 'Freehold',
    facing: str(s.facing) || 'East',
    furnish: str(s.furnishing) || 'Unfurnished',
    parking: typeof s.parking === 'number' ? s.parking : 1,
    parkingType: str(s.parkingType),
    share: str(s.sharePercentage),
    totalValue: str(s.totalPropertyValue),
    scope: str(s.scopeOfWork),
    furnishDetails: str(s.furnishDetails),
    suitableFor: str(s.commercialType),
    plotArea: str(s.plotArea),
    zoning: amenities.find(a => a.startsWith('Zoning: '))?.slice(8) ?? '',
    roadAccess:
      amenities.find(a => a.startsWith('Road access: '))?.slice(13) ?? '',
    water: has('Water source available'),
    electricity: has('Electricity connection'),
    fencing: has('Compound wall/fencing'),
    garden: has('Garden'),
    terrace: has('Terrace'),
    borewell: has('Borewell'),
    amenities: amenities.filter(
      a =>
        !FEATURE_AMENITIES.some(([, l]) => l === a) &&
        !a.startsWith('Zoning: ') &&
        !a.startsWith('Road access: '),
    ),
    photos: (req.photos ?? []).map((url, i) => ({
      key: `p${i}-${url}`,
      uri: url,
      url,
      status: 'done' as const,
    })),
    price: req.askingPrice ? String(req.askingPrice) : '',
    negotiable: req.negotiable ?? true,
  };
}

interface SellFlowValue {
  form: SellForm;
  draftId: string | null;
  set<K extends keyof SellForm>(key: K, value: SellForm[K]): void;
  patch(values: Partial<SellForm>): void;
  /** Start a new listing of the given reference type id. */
  start(typeId: string): void;
  /** Continue editing an existing request. */
  load(req: SellRequest): void;
  /** POST /sell-requests/drafts the first time, PATCH /me/sell-requests/:id afterwards. */
  saveDraft(step?: number): Promise<SellRequest>;
  ensureDraft(): Promise<string>;
  uploadPhotos(files: PickedFile[]): Promise<void>;
  removePhoto(key: string): void;
  /** Saves everything and submits (POST /me/sell-requests/:id/submit). */
  submit(): Promise<SellRequest>;
}

const SellFlowContext = createContext<SellFlowValue | null>(null);

export function SellFlowProvider({ children }: { children: React.ReactNode }) {
  const { user, saveProfile } = useAuth();
  const [form, setForm] = useState<SellForm>(EMPTY_SELL_FORM);
  const [draftId, setDraftId] = useState<string | null>(null);
  const formRef = useRef(form);
  formRef.current = form;
  const draftRef = useRef<string | null>(draftId);
  draftRef.current = draftId;
  const creating = useRef<Promise<SellRequest> | null>(null);

  const set = useCallback(
    <K extends keyof SellForm>(key: K, value: SellForm[K]) =>
      setForm(f => ({ ...f, [key]: value })),
    [],
  );
  const patch = useCallback(
    (values: Partial<SellForm>) => setForm(f => ({ ...f, ...values })),
    [],
  );

  const start = useCallback((typeId: string) => {
    // Re-entering the same type keeps an unfinished draft; any other type starts fresh.
    if (draftRef.current && formRef.current.typeId === typeId) return;
    setForm({ ...EMPTY_SELL_FORM, typeId });
    setDraftId(null);
  }, []);

  const load = useCallback((req: SellRequest) => {
    setForm(fromSellRequest(req));
    setDraftId(req._id);
  }, []);

  const saveDraft = useCallback(async (step?: number) => {
    const payload = toSellPayload(formRef.current, step);
    if (draftRef.current) return updateMySellRequest(draftRef.current, payload);
    if (!creating.current) {
      creating.current = createSellDraft(payload).finally(() => {
        creating.current = null;
      });
    }
    const created = await creating.current;
    setDraftId(created._id);
    draftRef.current = created._id;
    return created;
  }, []);

  const ensureDraft = useCallback(async () => {
    if (draftRef.current) return draftRef.current;
    const created = await saveDraft();
    return created._id;
  }, [saveDraft]);

  const uploadPhotos = useCallback(
    async (files: PickedFile[]) => {
      const id = await ensureDraft();
      const entries: SellPhoto[] = files.map((f, i) => ({
        key: `${Date.now()}-${i}-${f.name}`,
        uri: f.uri,
        status: 'uploading',
      }));
      setForm(f => ({ ...f, photos: [...f.photos, ...entries] }));
      await Promise.all(
        files.map(async (file, i) => {
          const key = entries[i].key;
          try {
            const doc = await uploadDocument(file, {
              ownerType: 'sell_request',
              ownerId: id,
              purpose: 'property_media',
              documentType: 'photo',
            });
            setForm(f => ({
              ...f,
              photos: f.photos.map(p =>
                p.key === key ? { ...p, status: 'done', url: doc.url } : p,
              ),
            }));
          } catch (e) {
            setForm(f => ({
              ...f,
              photos: f.photos.map(p =>
                p.key === key
                  ? { ...p, status: 'error', error: errorMessage(e) }
                  : p,
              ),
            }));
          }
        }),
      );
    },
    [ensureDraft],
  );

  const removePhoto = useCallback(
    (key: string) =>
      setForm(f => ({ ...f, photos: f.photos.filter(p => p.key !== key) })),
    [],
  );

  const submit = useCallback(async () => {
    // The backend only accepts submissions from customers with the seller (or both) role.
    if (user && user.role === 'buyer') await saveProfile({ role: 'both' });
    const id = await ensureDraft();
    await updateMySellRequest(id, toSellPayload(formRef.current, 7));
    const submitted = await submitMySellRequest(id);
    setDraftId(null);
    setForm(EMPTY_SELL_FORM);
    return submitted;
  }, [ensureDraft, saveProfile, user]);

  const value = useMemo<SellFlowValue>(
    () => ({
      form,
      draftId,
      set,
      patch,
      start,
      load,
      saveDraft,
      ensureDraft,
      uploadPhotos,
      removePhoto,
      submit,
    }),
    [
      form,
      draftId,
      set,
      patch,
      start,
      load,
      saveDraft,
      ensureDraft,
      uploadPhotos,
      removePhoto,
      submit,
    ],
  );
  return (
    <SellFlowContext.Provider value={value}>
      {children}
    </SellFlowContext.Provider>
  );
}

export function useSellFlow(): SellFlowValue {
  const ctx = useContext(SellFlowContext);
  if (!ctx) throw new Error('useSellFlow must be used inside SellFlowProvider');
  return ctx;
}
