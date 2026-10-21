export type SellRequestStatus =
  | 'draft'
  | 'new'
  | 'under_review'
  | 'accepted'
  | 'approved'
  | 'active'
  | 'negotiating'
  | 'paused'
  | 'sold'
  | 'rejected'
  | 'changes_requested';

export interface SellAddress {
  street?: string | null;
  locality?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  landmark?: string | null;
  latitude?: number;
  longitude?: number;
}

/** Keys accepted by the sellRequests validators under `specifications` (unknown keys are stripped). */
export interface SellSpecifications {
  subType?: string | null;
  title?: string | null;
  bhk?: string | null;
  builtUpArea?: number | null;
  plotArea?: number | null;
  area?: number | null;
  totalArea?: number | null;
  carpetArea?: number | null;
  floor?: string | number | null;
  totalFloors?: number | null;
  unitNo?: string | null;
  age?: string | null;
  facing?: string | null;
  furnishing?: string | null;
  furnishDetails?: string | null;
  parking?: number | null;
  parkingType?: string | null;
}

export interface SellDocument {
  documentId?: string;
  name: string;
  status: 'uploaded' | 'missing' | 'pending' | 'verified' | 'rejected';
  fileUrl?: string;
  scanStatus?: string;
}

/** Body for POST /sell-requests, POST /sell-requests/drafts and PATCH /me/sell-requests/:id. */
export interface SellRequestPayload {
  propertyType?: string;
  propertyTitle?: string;
  askingPrice?: number;
  negotiable?: boolean;
  address?: SellAddress;
  specifications?: SellSpecifications;
  amenities?: string[];
  ownershipType?: string | null;
  possessionStatus?: string | null;
  description?: string | null;
  photos?: string[];
  documents?: SellDocument[];
  draftStep?: number;
}

export interface SellRequest extends SellRequestPayload {
  _id: string;
  referenceId: string;
  sellerId: string;
  status: SellRequestStatus;
  isDraft?: boolean;
  photosCount?: number;
  documentsCount?: number;
  completenessPercent?: number;
  rejectionReason?: string;
  pauseReason?: string;
  changeRequests?: string[];
  metrics?: {
    views?: number;
    enquiryCount?: number;
    visitCount?: number;
    saveCount?: number;
  };
  sale?: { salePrice?: number; saleDate?: string; buyerName?: string };
  submittedAt?: string;
  draftSavedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AcquisitionStage =
  | 'pending_review'
  | 'site_inspection'
  | 'valuation'
  | 'negotiation'
  | 'token_to_seller'
  | 'documentation'
  | 'seller_payout'
  | 'acquired'
  | 'rejected'
  | 'on_hold';

export interface Acquisition {
  _id: string;
  referenceId?: string;
  stage: AcquisitionStage;
  agreedPrice?: number;
  negotiation?: Record<string, unknown>;
  documentation?: Record<string, unknown>;
  token?: { amount?: number; paid?: boolean };
  payout?: { completed?: boolean };
  stageHistory?: Array<{
    from: string;
    to: string;
    changedAt: string;
    notes?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface SellerMessage {
  threadId?: string;
  logId?: string;
  sender: string;
  type: string;
  text?: string;
  offerAmount?: number;
  offerStatus?: string;
  createdAt?: string;
}

export interface SellerEnquiry {
  _id: string;
  referenceId: string;
  buyerSnapshot?: {
    name?: string;
    phone?: string;
    email?: string;
    userType?: string;
  };
  interestType: string;
  preferredContact: string;
  preferredVisitDate?: string;
  preferredVisitTimeSlot?: string;
  status: string;
  submittedAt?: string;
}

export interface SellerVisit {
  _id: string;
  referenceId: string;
  buyerId: string;
  visitDate: string;
  visitTime?: string;
  visitType: string;
  status: string;
  rescheduleCount?: number;
}

export interface SellerOffer {
  amount: number;
  status: string;
  expiresAt: string | null;
  counterAmount: number | null;
  notes: string | null;
}

export interface PayoutScheduleItem {
  key: string;
  label: string;
  amount: number;
  dueLabel: string;
  status: string;
}

/** GET /me/sell-requests/:id/activity response. */
export interface SellerActivity {
  sellRequest: SellRequest;
  acquisition: Acquisition | null;
  property: { _id: string; title?: string; status?: string } | null;
  assignedAdvisor?: { name: string | null; phone: string | null } | null;
  availability?: string[];
  offer: SellerOffer | null;
  enquiries: SellerEnquiry[];
  visits: SellerVisit[];
  chatThreads: Array<{
    _id: string;
    referenceId: string;
    status: string;
    lastMessageAt?: string;
    messageCount: number;
  }>;
  messages: SellerMessage[];
  payoutSchedule: PayoutScheduleItem[];
  registration: { appointment: unknown; status: string; checklist: string[] };
  metrics: {
    enquiryCount: number;
    visitCount: number;
    chatCount: number;
    payoutCount: number;
  };
}

/** POST /me/sell-requests/:id/valuation-estimate response. */
export interface ValuationEstimate {
  sellRequestId: string;
  source: 'comparables' | 'baseline';
  confidence: 'high' | 'medium' | 'low' | 'baseline';
  estimatedPrice: number;
  low: number;
  high: number;
  pricePerSqft: number;
  area: number;
  comparableCount: number;
  basis: string;
  askingPriceDeltaPercent: number | null;
  comparables: Array<{
    _id: string;
    title: string;
    price: number;
    status: string;
    locality?: string;
    city?: string;
    area: number;
    pricePerSqft: number;
  }>;
}
