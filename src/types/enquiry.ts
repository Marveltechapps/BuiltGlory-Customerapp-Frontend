import type { PropertyType } from './property';
import type { Deal } from './deal';
import type { Visit } from './visit';

export type BuyEnquiryStatus =
  | 'new'
  | 'responded'
  | 'visit_scheduled'
  | 'negotiating'
  | 'closed';
export type PreferredContact = 'phone' | 'whatsapp' | 'email';
export type InterestType =
  | 'schedule_visit'
  | 'price_negotiation'
  | 'more_details';
export type PreferredVisitTime =
  | 'tomorrow_morning'
  | 'tomorrow_afternoon'
  | 'this_weekend_morning'
  | 'this_weekend_afternoon'
  | 'custom';

/** POST /buy-enquiries body (buyEnquiries createValidator). */
export interface CreateBuyEnquiryRequest {
  propertyId: string;
  enquiryTypes?: string[];
  preferredContact: PreferredContact;
  interestType: InterestType;
  preferredVisitTime?: PreferredVisitTime | null;
  preferredVisitDate?: string | null;
  preferredVisitTimeSlot?: string | null;
  additionalMessage?: string | null;
}

/** Buy enquiry as returned by /me/buy-enquiries (enriched with its visits and linked deal). */
export interface BuyEnquiry {
  _id: string;
  referenceId: string;
  buyerId: string;
  propertyId: string;
  propertySnapshot?: {
    title?: string;
    price?: number;
    type?: PropertyType;
    location?: string;
  };
  enquiryTypes?: string[];
  preferredContact: PreferredContact;
  interestType: InterestType;
  preferredVisitTime?: PreferredVisitTime | null;
  preferredVisitDate?: string | null;
  preferredVisitTimeSlot?: string | null;
  additionalMessage?: string | null;
  status: BuyEnquiryStatus;
  customerStage?: string | null;
  customerStageLabel?: string | null;
  visits?: Visit[];
  deal?: Deal | null;
  submittedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}
