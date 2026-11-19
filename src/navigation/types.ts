// Every screen the navigator can show. 'samples' is the starter feature that
// reads GET /api/samples; the rest are the Builtglory design screens.
export type ScreenName =
  | 'samples'
  // Auth & Onboarding
  | 'splash' | 'onboarding' | 'login' | 'otp' | 'profileSetup' | 'locationType' | 'terms' | 'permissions'
  // Home & Navigation
  | 'home' | 'search' | 'featured' | 'upcoming' | 'help' | 'coachMarks'
  // Buy Flow
  | 'buyTypes' | 'filters' | 'buyList' | 'propertyDetail' | 'floorPlan' | 'specs' | 'locationView' | 'advantages'
  | 'vrTour' | 'aerial' | 'shareProperty' | 'enquiry' | 'enquirySuccess' | 'visitCalendar' | 'rescheduleVisit'
  | 'visitConfirmation' | 'nriVideoCall' | 'nriVideoConfirm' | 'buyerDeal' | 'documentsShared' | 'buyerKyc'
  | 'payment' | 'paymentSuccess' | 'paymentFailure' | 'registrationDetails' | 'cancelEnquiry' | 'propertyWithdrawn' | 'soldOut'
  // Sell Flow
  | 'sellIntent' | 'sellAddress' | 'sellType' | 'sellDetails' | 'sellAmenities' | 'sellPhotos' | 'sellPrice'
  | 'sellSuccess' | 'draftSuccess' | 'editListing' | 'verificationStatus' | 'reupload' | 'offer' | 'acceptNegotiate'
  | 'negotiationStatus' | 'offerAccepted' | 'dealConfirmed' | 'paymentSchedule' | 'sellRegistration' | 'dealComplete' | 'rejectedListing'
  // Profile & Account
  | 'guestProfile' | 'profile' | 'profileEdit' | 'changePhone' | 'myListings' | 'myDrafts' | 'myVisits' | 'myDeals'
  | 'listingDetail' | 'noListings' | 'myEnquiries' | 'enquiryDetail' | 'noEnquiries' | 'notifications' | 'pdfViewer' | 'termsOfUse'
  // Settings & Help
  | 'settingsMain' | 'notificationSettings' | 'appSettings' | 'accountSettings' | 'accountDeletion' | 'helpFaqs'
  | 'faqTopic' | 'customerSupport' | 'callUs' | 'aboutUs'
  // Global
  | 'offline' | 'forceUpdate' | 'maintenance' | 'sessionExpiry'
  // Extras
  | 'favorites' | 'compare' | 'advancedFilters' | 'mapView' | 'sellEnquiries' | 'sellVisitMgmt' | 'sellChat'
  | 'offers' | 'newsInsights' | 'generalInfo' | 'helpFeedback';

export type TabId = 'home' | 'buy' | 'sell' | 'profile';

/** Free-form context passed between screens (selected property, origin, form values). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Ctx = Record<string, any>;

export interface NavEntry {
  screen: ScreenName;
  ctx: Ctx;
}

export interface GateInfo {
  reason: string;
  target?: ScreenName;
  ctx?: Ctx;
}

/** Props every design screen receives from the navigator. */
export interface ScreenProps {
  go: (screen: ScreenName, ctx?: Ctx) => void;
  back: () => void;
  jump: (screen: ScreenName) => void;
  ctx: Ctx;
  fav: Set<string>;
  toggleFav: (id: string) => void;
  onNav: (tab: TabId) => void;
  guest: boolean;
  signIn: (resume?: GateInfo) => void;
  onGuest: () => void;
  onNext: () => void;
  onDone: () => void;
}
