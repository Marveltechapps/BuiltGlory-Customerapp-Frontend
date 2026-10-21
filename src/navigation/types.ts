import type { PropertyView } from '../interfaces/PropertyView';
import type { BuyFilters } from '../interfaces/BuyFilters';
import type { Visit } from '../types/visit';
import type { BuyEnquiry, CreateBuyEnquiryRequest } from '../types/enquiry';
import type { SellRequest } from '../types/sellRequest';

/** A screen to return to after signing in (guest gate, session expiry). */
export interface ResumeTarget {
  name: ScreenName;
  params?: unknown;
}

export interface DocumentRef {
  name: string;
  url?: string | null;
  documentId?: string;
  meta?: string;
}

/** Route params per screen. Screens without params map to `undefined`. */
export interface ScreenParamMap {
  // Auth & onboarding (S-01…S-08)
  splash: undefined;
  onboarding: undefined;
  login: { fromGuest?: boolean; resume?: ResumeTarget | null } | undefined;
  otp: {
    phone: string;
    requestId: string;
    expiresInSeconds?: number;
    canResendAt?: string;
    fromGuest?: boolean;
    resume?: ResumeTarget | null;
  };
  profileSetup: undefined;
  locationType: undefined;
  terms: undefined;
  permissions: undefined;
  // Home (H-01…H-06)
  home: undefined;
  search: { q?: string } | undefined;
  featured: undefined;
  upcoming: undefined;
  help: undefined;
  coachMarks: undefined;
  // Buy flow (B-01…B-19)
  buyTypes: undefined;
  filters: { filters: BuyFilters };
  buyList: { filters: BuyFilters };
  propertyDetail: { id: string; property?: PropertyView };
  floorPlan: { property: PropertyView };
  specs: { property: PropertyView };
  advantages: { property: PropertyView };
  vrTour: { property: PropertyView };
  aerial: { property: PropertyView };
  shareProperty: { property: PropertyView };
  enquiry: { property: PropertyView };
  enquirySuccess: { property: PropertyView; enquiry: BuyEnquiry };
  visitCalendar: {
    property: PropertyView;
    enquiryId?: string;
    pendingEnquiry?: CreateBuyEnquiryRequest;
  };
  rescheduleVisit: {
    visit: Visit;
    property?: PropertyView;
    propertyTitle?: string;
  };
  visitConfirmation: {
    visit: Visit;
    property?: PropertyView;
    propertyTitle?: string;
    rescheduled?: boolean;
  };
  nriVideoCall: { property: PropertyView; enquiryId?: string };
  nriVideoConfirm: { property: PropertyView; visit: Visit; language: string };
  documentsShared: { enquiryId: string };
  payment: { enquiryId: string };
  paymentFailure: { enquiryId: string; reason: string };
  registrationDetails: { enquiryId: string };
  cancelEnquiry: { enquiryId?: string; visit?: Visit; title?: string };
  propertyWithdrawn: { enquiry: BuyEnquiry };
  soldOut: { property: PropertyView };
  favorites: undefined;
  compare: { property: PropertyView };
  advancedFilters: { filters: BuyFilters };
  mapView: { filters?: BuyFilters; property?: PropertyView } | undefined;
  // Sell flow (SL-01…SL-18)
  sellType: undefined;
  sellIntent: { type: string };
  sellAddress: undefined;
  sellDetails: undefined;
  sellAmenities: undefined;
  sellPhotos: { editId?: string } | undefined;
  sellPrice: undefined;
  sellSuccess: { request?: SellRequest } | undefined;
  draftSuccess: { request: SellRequest };
  editListing: { id: string };
  verificationStatus: { id: string };
  reupload: { id: string };
  offer: { id: string };
  acceptNegotiate: { id: string; mode: 'accept' | 'negotiate' };
  dealConfirmed: { id: string };
  paymentSchedule: { id: string };
  sellRegistration: { id: string };
  dealComplete: { id: string };
  rejectedListing: { id: string };
  sellEnquiries: { id: string };
  sellVisitMgmt: { id: string };
  sellChat: { id: string };
  // Profile & account (P-00…P-12)
  guestProfile: undefined;
  profile: undefined;
  profileEdit: undefined;
  changePhone: undefined;
  myListings: undefined;
  myVisits: undefined;
  myDeals: undefined;
  listingDetail: { id: string };
  noListings: undefined;
  myEnquiries: undefined;
  enquiryDetail: { id: string };
  noEnquiries: undefined;
  notifications: undefined;
  pdfViewer: { doc: DocumentRef };
  termsOfUse: { slug?: string } | undefined;
  offers: undefined;
  newsInsights: undefined;
  generalInfo: undefined;
  helpFeedback: undefined;
  // Settings & help (A-01…A-08)
  settingsMain: undefined;
  notificationSettings: undefined;
  appSettings: undefined;
  accountSettings: undefined;
  accountDeletion: undefined;
  helpFaqs: undefined;
  faqTopic: { topicId: string };
  customerSupport: undefined;
  callUs: undefined;
  aboutUs: undefined;
  // Global states (G-01…G-04)
  offline: undefined;
  forceUpdate: undefined;
  maintenance: undefined;
  sessionExpiry: { resume?: ResumeTarget | null } | undefined;
}

export type ScreenName = keyof ScreenParamMap;

/** Flow tint applied to screen backgrounds (`[data-flow]` in the reference). */
export type Flow = 'home' | 'buy' | 'sell' | 'account';

export type ScreenProps<N extends ScreenName> = { params: ScreenParamMap[N] };
