export type SalesDealStage =
  | 'active_leads'
  | 'site_visits'
  | 'negotiation'
  | 'token_payment'
  | 'full_payment'
  | 'stage_payment'
  | 'interior_design'
  | 'documentation'
  | 'closed'
  | 'lost'
  | 're_engagement';

/** File inside deal.documentation.documents[] (shape written by the admin dashboard). */
export interface DealDocumentFile {
  id: string;
  fileName: string;
  uploadedAt: string;
  status: string;
  notes: string | null;
  url: string | null;
  description?: string;
}

export interface DealDocumentItem {
  id: string;
  name: string;
  required?: boolean;
  files: DealDocumentFile[];
  sentToBuyerAt?: string | null;
}

export interface DealRegistration {
  registrationDate?: string;
  registrationOffice?: string;
  subRegistrarName?: string;
  stampDuty?: number;
  registrationFee?: number;
  notes?: string;
}

/** Sales deal embedded in a buy enquiry (`enquiry.deal`). */
export interface Deal {
  _id: string;
  referenceId: string;
  stage: SalesDealStage;
  buyerId: string;
  propertyId: string;
  propertySnapshot?: {
    title?: string;
    price?: number;
    type?: string;
    location?: string;
  };
  financials?: {
    offeredPrice?: number;
    agreedPrice?: number;
    tokenAmount?: number;
    tokenPaid?: boolean;
    totalPaid?: number;
    paymentType?: 'full' | 'stage' | null;
  };
  documentation?: {
    documents?: DealDocumentItem[];
    customDocs?: DealDocumentItem[];
    registration?: DealRegistration;
    [key: string]: unknown;
  };
  stageHistory?: Array<{
    from: string;
    to: string;
    changedAt: string;
    notes?: string;
  }>;
  closedAt?: string;
  createdAt?: string;
}

/** `GET /me/deals` row from salesDeals/customerDeals.js. */
export interface CustomerDealSummary {
  side: 'buyer' | 'seller';
  id: string;
  title: string;
  price: number | null;
  stage: string;
  stageLabel: string;
  progressPercent: number;
  enquiryId: string | null;
  sellRequestId: string | null;
  updatedAt: string | null;
}
