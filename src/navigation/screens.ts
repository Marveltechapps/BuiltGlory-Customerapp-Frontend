import type React from 'react';
import type { Flow } from '../theme';
import type { ScreenName, ScreenProps } from './types';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';
import { ProfileSetupScreen } from '../screens/auth/ProfileSetupScreen';
import { LocationUserTypeScreen } from '../screens/auth/LocationUserTypeScreen';
import { TermsScreen } from '../screens/auth/TermsScreen';
import { PermissionsScreen } from '../screens/auth/PermissionsScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { SearchScreen } from '../screens/home/SearchScreen';
import { FeaturedListScreen } from '../screens/home/FeaturedListScreen';
import { UpcomingListScreen } from '../screens/home/UpcomingListScreen';
import { HelpScreen } from '../screens/home/HelpScreen';
import { BuyTypeScreen } from '../screens/buy/BuyTypeScreen';
import { FilterScreen } from '../screens/buy/FilterScreen';
import { BuyListScreen } from '../screens/buy/BuyListScreen';
import { PropertyDetailScreen } from '../screens/buy/PropertyDetailScreen';
import { FloorPlanScreen } from '../screens/buy/FloorPlanScreen';
import { AdvantagesScreen, LocationScreen, SpecsScreen } from '../screens/buy/PropertyInfoScreens';
import { AerialScreen, VRTourScreen } from '../screens/buy/MediaScreens';
import { ShareScreen } from '../screens/buy/ShareScreen';
import { EnquiryScreen } from '../screens/buy/EnquiryScreen';
import { EnquirySuccessScreen } from '../screens/buy/EnquirySuccessScreen';
import { RescheduleScreen, VisitGateScreen } from '../screens/buy/VisitScreens';
import { VisitConfirmationScreen } from '../screens/buy/VisitConfirmationScreen';
import { NRIVideoCallConfirmScreen, NRIVideoCallScreen } from '../screens/buy/NriVideoScreens';
import { BuyerDealScreen, BuyerKycScreen, PaymentSuccessScreen } from '../screens/buy/BuyerDealScreens';
import {
  CancelEnquiryScreen, DocsGateScreen, PaymentFailureScreen, PaymentGateScreen, PropertyWithdrawnScreen, RegGateScreen, SoldOutScreen,
} from '../screens/buy/TransactionScreens';
import { CompareScreen } from '../screens/buy/CompareScreen';
import { AdvancedFiltersScreen, FavoritesScreen, MapViewScreen } from '../screens/buy/BrowseExtrasScreens';
import { SellAddressScreen, SellIntentScreen, SellTypeScreen } from '../screens/sell/SellStartScreens';
import { SellAmenitiesScreen, SellDetailsScreen, SellPhotosScreen, SellPriceScreen, SellSuccessScreen } from '../screens/sell/SellFormScreens';
import { NegotiationStatusScreen, OfferAcceptedScreen, SellTrackerScreen, SellVerifyScreen } from '../screens/sell/SellTrackerScreens';
import {
  AcceptNegotiateScreen, DealCompleteScreen, DealConfirmedScreen, DraftSuccessScreen, EditListingScreen, OfferScreen,
  PaymentScheduleScreen, RejectedListingScreen, ReuploadScreen, SellRegistrationScreen,
} from '../screens/sell/SellDealScreens';
import { SellChatScreen, SellEnquiriesScreen, SellVisitMgmtScreen } from '../screens/sell/SellerToolsScreens';
import { GuestProfileScreen } from '../screens/profile/GuestScreens';
import { BuyTrackerScreen } from '../screens/profile/BuyTrackerScreen';
import { MyDealsScreen, MyEnquiriesScreen, MyVisitsScreen } from '../screens/profile/MyJourneyListsScreens';
import { MyDraftsScreen, MyListingsScreen } from '../screens/profile/MyListingsScreens';
import { NotificationsScreen, ProfileEditScreen, ProfileScreen } from '../screens/profile/ProfileScreens';
import { ChangePhoneScreen, DocumentViewerScreen, NoEnquiriesScreen, NoListingsScreen } from '../screens/profile/ProfileMiscScreens';
import { GeneralInfoScreen, HelpFeedbackScreen, NewsInsightsScreen, OffersScreen } from '../screens/profile/InfoScreens';
import {
  AboutUsScreen, AccountDeletionScreen, AccountSettingsScreen, AppSettingsScreen, CallUsScreen,
  CustomerSupportScreen, FaqTopicScreen, HelpFaqsScreen, NotificationSettingsScreen, SettingsMainScreen,
} from '../screens/settings/SettingsScreens';
import { ForceUpdateScreen, MaintenanceScreen, OfflineScreen, SessionExpiryScreen } from '../screens/global/GlobalScreens';

export type ScreenGroup =
  | 'Auth & Onboarding' | 'Home & Navigation' | 'Buy Flow' | 'Sell Flow'
  | 'Profile & Account' | 'Settings & Help' | 'Global' | 'Extras';

export interface ScreenEntry {
  id: string;
  label: string;
  group: ScreenGroup;
  Comp: React.ComponentType<ScreenProps> | null;
}

const S = (id: string, label: string, group: ScreenGroup, Comp: React.ComponentType<ScreenProps> | null): ScreenEntry => ({ id, label, group, Comp });

/** Screen registry, mirroring the design's screen index (IDs from the spec). */
export const SCREENS: Partial<Record<ScreenName, ScreenEntry>> = {
  // Auth & Onboarding
  splash: S('S-01', 'Splash', 'Auth & Onboarding', SplashScreen),
  onboarding: S('S-02', 'Onboarding', 'Auth & Onboarding', OnboardingScreen),
  login: S('S-03', 'Login', 'Auth & Onboarding', LoginScreen),
  otp: S('S-04', 'OTP Verify', 'Auth & Onboarding', OtpScreen),
  profileSetup: S('S-05', 'Create Profile', 'Auth & Onboarding', ProfileSetupScreen),
  locationType: S('S-06', 'Location + Type', 'Auth & Onboarding', LocationUserTypeScreen),
  terms: S('S-07', 'Terms & Privacy', 'Auth & Onboarding', TermsScreen),
  permissions: S('S-08', 'App Permissions', 'Auth & Onboarding', PermissionsScreen),
  // Home & Navigation
  home: S('H-01', 'Home', 'Home & Navigation', HomeScreen),
  search: S('H-02', 'Search', 'Home & Navigation', SearchScreen),
  featured: S('H-03', 'Featured List', 'Home & Navigation', FeaturedListScreen),
  upcoming: S('H-04', 'Upcoming List', 'Home & Navigation', UpcomingListScreen),
  help: S('H-05', 'Help & Support', 'Home & Navigation', HelpScreen),
  coachMarks: S('H-06', 'Coach Marks', 'Home & Navigation', null),
  // Buy Flow
  buyTypes: S('B-01', 'Property Type Selection', 'Buy Flow', BuyTypeScreen),
  filters: S('B-02', 'Filter', 'Buy Flow', FilterScreen),
  buyList: S('B-03', 'Listing Results', 'Buy Flow', BuyListScreen),
  propertyDetail: S('B-04', 'Property Detail', 'Buy Flow', PropertyDetailScreen),
  floorPlan: S('B-04a', 'Floor Plan', 'Buy Flow', FloorPlanScreen),
  specs: S('B-05', 'Specifications', 'Buy Flow', SpecsScreen),
  locationView: S('B-06a', 'Location & Nearby', 'Buy Flow', LocationScreen),
  advantages: S('B-06', 'Advantages', 'Buy Flow', AdvantagesScreen),
  vrTour: S('B-07', 'Virtual Tour', 'Buy Flow', VRTourScreen),
  aerial: S('B-08', 'Aerial View', 'Buy Flow', AerialScreen),
  shareProperty: S('B-09', 'Share Property', 'Buy Flow', ShareScreen),
  enquiry: S('B-10', 'Submit Enquiry', 'Buy Flow', EnquiryScreen),
  enquirySuccess: S('B-11', 'Enquiry Success', 'Buy Flow', EnquirySuccessScreen),
  visitCalendar: S('B-12', 'Schedule Visit', 'Buy Flow', VisitGateScreen),
  rescheduleVisit: S('B-12a', 'Reschedule Visit', 'Buy Flow', RescheduleScreen),
  visitConfirmation: S('B-13', 'Visit Confirmed', 'Buy Flow', VisitConfirmationScreen),
  nriVideoCall: S('B-13a', 'NRI Video Call', 'Buy Flow', NRIVideoCallScreen),
  nriVideoConfirm: S('B-13b', 'NRI Video Confirm', 'Buy Flow', NRIVideoCallConfirmScreen),
  buyerDeal: S('B-13c', 'Deal Confirmed', 'Buy Flow', BuyerDealScreen),
  documentsShared: S('B-14', 'Documents Shared', 'Buy Flow', DocsGateScreen),
  buyerKyc: S('B-14a', 'KYC Verification', 'Buy Flow', BuyerKycScreen),
  payment: S('B-15', 'Payment', 'Buy Flow', PaymentGateScreen),
  paymentSuccess: S('B-15b', 'Payment Success', 'Buy Flow', PaymentSuccessScreen),
  paymentFailure: S('B-15a', 'Payment Failure', 'Buy Flow', PaymentFailureScreen),
  registrationDetails: S('B-16', 'Registration Details', 'Buy Flow', RegGateScreen),
  cancelEnquiry: S('B-17', 'Cancel Enquiry', 'Buy Flow', CancelEnquiryScreen),
  propertyWithdrawn: S('B-18', 'Property Withdrawn', 'Buy Flow', PropertyWithdrawnScreen),
  soldOut: S('B-19', 'Sold Out', 'Buy Flow', SoldOutScreen),
  // Sell Flow
  sellIntent: S('SL-01', 'Sell Intent', 'Sell Flow', SellIntentScreen),
  sellAddress: S('SL-02', 'Address', 'Sell Flow', SellAddressScreen),
  sellType: S('SL-03', 'Property Type', 'Sell Flow', SellTypeScreen),
  sellDetails: S('SL-04', 'Property Details', 'Sell Flow', SellDetailsScreen),
  sellAmenities: S('SL-05', 'Amenities', 'Sell Flow', SellAmenitiesScreen),
  sellPhotos: S('SL-06', 'Photo Upload', 'Sell Flow', SellPhotosScreen),
  sellPrice: S('SL-07', 'Expected Price', 'Sell Flow', SellPriceScreen),
  sellSuccess: S('SL-08', 'Listing Success', 'Sell Flow', SellSuccessScreen),
  draftSuccess: S('SL-08a', 'Draft Save Success', 'Sell Flow', DraftSuccessScreen),
  editListing: S('SL-09', 'Edit Listing', 'Sell Flow', EditListingScreen),
  verificationStatus: S('SL-10', 'Verification Status', 'Sell Flow', SellVerifyScreen),
  reupload: S('SL-11', 'Re-upload', 'Sell Flow', ReuploadScreen),
  offer: S('SL-12', 'Offer Screen', 'Sell Flow', OfferScreen),
  acceptNegotiate: S('SL-13', 'Accept / Negotiate', 'Sell Flow', AcceptNegotiateScreen),
  negotiationStatus: S('SL-13a', 'Negotiation Status', 'Sell Flow', NegotiationStatusScreen),
  offerAccepted: S('SL-13b', 'Offer Accepted', 'Sell Flow', OfferAcceptedScreen),
  dealConfirmed: S('SL-14', 'Deal Confirmed + Bank', 'Sell Flow', DealConfirmedScreen),
  paymentSchedule: S('SL-15', 'Payment Schedule', 'Sell Flow', PaymentScheduleScreen),
  sellRegistration: S('SL-16', 'Registration', 'Sell Flow', SellRegistrationScreen),
  dealComplete: S('SL-17', 'Deal Complete', 'Sell Flow', DealCompleteScreen),
  rejectedListing: S('SL-18', 'Rejected Listing', 'Sell Flow', RejectedListingScreen),
  // Profile & Account
  guestProfile: S('P-00', 'Guest Profile', 'Profile & Account', GuestProfileScreen),
  profile: S('P-01', 'Profile', 'Profile & Account', ProfileScreen),
  profileEdit: S('P-02', 'Edit Profile', 'Profile & Account', ProfileEditScreen),
  changePhone: S('P-03', 'Change Phone', 'Profile & Account', ChangePhoneScreen),
  myListings: S('P-04', 'My Listings', 'Profile & Account', MyListingsScreen),
  myDrafts: S('P-04c', 'My Drafts', 'Profile & Account', MyDraftsScreen),
  myVisits: S('P-04a', 'My Visits', 'Profile & Account', MyVisitsScreen),
  myDeals: S('P-04b', 'My Deals', 'Profile & Account', MyDealsScreen),
  listingDetail: S('P-05', 'Listing Detail', 'Profile & Account', SellTrackerScreen),
  noListings: S('P-06', 'No Listings (empty)', 'Profile & Account', NoListingsScreen),
  myEnquiries: S('P-07', 'My Enquiries', 'Profile & Account', MyEnquiriesScreen),
  enquiryDetail: S('P-08', 'Enquiry Detail', 'Profile & Account', BuyTrackerScreen),
  noEnquiries: S('P-09', 'No Enquiries (empty)', 'Profile & Account', NoEnquiriesScreen),
  notifications: S('P-10', 'Notifications', 'Profile & Account', NotificationsScreen),
  pdfViewer: S('P-11', 'Document Viewer', 'Profile & Account', DocumentViewerScreen),
  termsOfUse: S('P-12', 'Terms of Use', 'Profile & Account', TermsScreen),
  // Settings & Help
  settingsMain: S('A-01', 'Settings Main', 'Settings & Help', SettingsMainScreen),
  notificationSettings: S('A-02', 'Notification Settings', 'Settings & Help', NotificationSettingsScreen),
  appSettings: S('A-03', 'App Settings', 'Settings & Help', AppSettingsScreen),
  accountSettings: S('A-04', 'Account Settings', 'Settings & Help', AccountSettingsScreen),
  accountDeletion: S('A-04a', 'Delete Account', 'Settings & Help', AccountDeletionScreen),
  helpFaqs: S('A-05', 'Help & FAQs', 'Settings & Help', HelpFaqsScreen),
  faqTopic: S('A-06', 'FAQ Topic', 'Settings & Help', FaqTopicScreen),
  customerSupport: S('A-07', 'Customer Support', 'Settings & Help', CustomerSupportScreen),
  callUs: S('A-07a', 'Call Us', 'Settings & Help', CallUsScreen),
  aboutUs: S('A-08', 'About Us', 'Settings & Help', AboutUsScreen),
  // Global
  offline: S('G-01', 'No Internet', 'Global', OfflineScreen),
  forceUpdate: S('G-02', 'Force Update', 'Global', ForceUpdateScreen),
  maintenance: S('G-03', 'Maintenance', 'Global', MaintenanceScreen),
  sessionExpiry: S('G-04', 'Session Expiry', 'Global', SessionExpiryScreen),
  // Extras
  favorites: S('—', 'Favorites', 'Extras', FavoritesScreen),
  compare: S('—', 'Compare', 'Extras', CompareScreen),
  advancedFilters: S('—', 'Advanced Filters', 'Extras', AdvancedFiltersScreen),
  mapView: S('—', 'Map View', 'Extras', MapViewScreen),
  sellEnquiries: S('—', 'Seller Enquiries', 'Extras', SellEnquiriesScreen),
  sellVisitMgmt: S('—', 'Seller Visits', 'Extras', SellVisitMgmtScreen),
  sellChat: S('—', 'Negotiation Chat', 'Extras', SellChatScreen),
  offers: S('—', 'Offers & Deals', 'Extras', OffersScreen),
  newsInsights: S('—', 'News & Insights', 'Extras', NewsInsightsScreen),
  generalInfo: S('—', 'General Info', 'Extras', GeneralInfoScreen),
  helpFeedback: S('—', 'Help & Feedback', 'Extras', HelpFeedbackScreen),
};

/** Ambient colour family per group (the design's FLOW_OF). */
export function flowOf(group?: ScreenGroup): Flow {
  const g = group ?? '';
  if (/Sell/.test(g)) return 'sell';
  if (/Settings|Global/.test(g)) return 'account';
  if (/Buy/.test(g)) return 'buy';
  return 'home';
}
