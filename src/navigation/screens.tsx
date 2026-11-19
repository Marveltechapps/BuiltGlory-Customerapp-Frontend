import type React from 'react';
import { LocationUserTypeScreen } from '../screens/auth/LocationUserTypeScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';
import { PermissionsScreen } from '../screens/auth/PermissionsScreen';
import { ProfileSetupScreen } from '../screens/auth/ProfileSetupScreen';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { TermsScreen } from '../screens/auth/TermsScreen';
import { AdvancedFiltersScreen } from '../screens/buy/AdvancedFiltersScreen';
import { AdvantagesScreen } from '../screens/buy/AdvantagesScreen';
import { AerialScreen } from '../screens/buy/AerialScreen';
import { BuyListScreen } from '../screens/buy/BuyListScreen';
import { BuyTypeScreen } from '../screens/buy/BuyTypeScreen';
import { CancelEnquiryScreen } from '../screens/buy/CancelEnquiryScreen';
import { CompareScreen } from '../screens/buy/CompareScreen';
import { DocumentsSharedScreen } from '../screens/buy/DocumentsSharedScreen';
import { EnquiryScreen } from '../screens/buy/EnquiryScreen';
import { EnquirySuccessScreen } from '../screens/buy/EnquirySuccessScreen';
import { FavoritesScreen } from '../screens/buy/FavoritesScreen';
import { FilterScreen } from '../screens/buy/FilterScreen';
import { FloorPlanScreen } from '../screens/buy/FloorPlanScreen';
import { MapViewScreen } from '../screens/buy/MapViewScreen';
import { NriVideoCallScreen } from '../screens/buy/NriVideoCallScreen';
import { NriVideoConfirmScreen } from '../screens/buy/NriVideoConfirmScreen';
import { PaymentFailureScreen } from '../screens/buy/PaymentFailureScreen';
import { PaymentScreen } from '../screens/buy/PaymentScreen';
import { PropertyDetailScreen } from '../screens/buy/PropertyDetailScreen';
import { PropertyWithdrawnScreen } from '../screens/buy/PropertyWithdrawnScreen';
import { RegistrationDetailsScreen } from '../screens/buy/RegistrationDetailsScreen';
import { RescheduleVisitScreen } from '../screens/buy/RescheduleVisitScreen';
import { ShareScreen } from '../screens/buy/ShareScreen';
import { SoldOutScreen } from '../screens/buy/SoldOutScreen';
import { SpecsScreen } from '../screens/buy/SpecsScreen';
import { VisitCalendarScreen } from '../screens/buy/VisitCalendarScreen';
import { VisitConfirmationScreen } from '../screens/buy/VisitConfirmationScreen';
import { VrTourScreen } from '../screens/buy/VrTourScreen';
import {
  ForceUpdateScreen,
  MaintenanceScreen,
  OfflineScreen,
  SessionExpiryScreen,
} from '../screens/global/GlobalScreens';
import { FeaturedListScreen } from '../screens/home/FeaturedListScreen';
import { HelpScreen } from '../screens/home/HelpScreen';
import { CoachMarksScreen, HomeScreen } from '../screens/home/HomeScreen';
import { SearchScreen } from '../screens/home/SearchScreen';
import { UpcomingListScreen } from '../screens/home/UpcomingListScreen';
import { ChangePhoneScreen } from '../screens/profile/ChangePhoneScreen';
import {
  GeneralInfoScreen,
  HelpFeedbackScreen,
  NewsInsightsScreen,
  OffersScreen,
} from '../screens/profile/ContentScreens';
import { EnquiryDetailScreen } from '../screens/profile/EnquiryDetailScreen';
import { GuestProfileScreen } from '../screens/profile/GuestProfileScreen';
import { ListingDetailScreen } from '../screens/profile/ListingDetailScreen';
import { MyDealsScreen } from '../screens/profile/MyDealsScreen';
import {
  MyEnquiriesScreen,
  NoEnquiriesScreen,
} from '../screens/profile/MyEnquiriesScreen';
import {
  MyListingsScreen,
  NoListingsScreen,
} from '../screens/profile/MyListingsScreen';
import { MyVisitsScreen } from '../screens/profile/MyVisitsScreen';
import { NotificationsScreen } from '../screens/profile/NotificationsScreen';
import { PdfViewerScreen } from '../screens/profile/PdfViewerScreen';
import { ProfileEditScreen } from '../screens/profile/ProfileEditScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { AcceptNegotiateScreen } from '../screens/sell/AcceptNegotiateScreen';
import { DealCompleteScreen } from '../screens/sell/DealCompleteScreen';
import { DealConfirmedScreen } from '../screens/sell/DealConfirmedScreen';
import { DraftSuccessScreen } from '../screens/sell/DraftSuccessScreen';
import { EditListingScreen } from '../screens/sell/EditListingScreen';
import { OfferScreen } from '../screens/sell/OfferScreen';
import { PaymentScheduleScreen } from '../screens/sell/PaymentScheduleScreen';
import { RejectedListingScreen } from '../screens/sell/RejectedListingScreen';
import { ReuploadScreen } from '../screens/sell/ReuploadScreen';
import { SellAddressScreen } from '../screens/sell/SellAddressScreen';
import { SellAmenitiesScreen } from '../screens/sell/SellAmenitiesScreen';
import { SellChatScreen } from '../screens/sell/SellChatScreen';
import { SellDetailsScreen } from '../screens/sell/SellDetailsScreen';
import { SellEnquiriesScreen } from '../screens/sell/SellEnquiriesScreen';
import { SellIntentScreen } from '../screens/sell/SellIntentScreen';
import { SellPhotosScreen } from '../screens/sell/SellPhotosScreen';
import { SellPriceScreen } from '../screens/sell/SellPriceScreen';
import { SellRegistrationScreen } from '../screens/sell/SellRegistrationScreen';
import { SellSuccessScreen } from '../screens/sell/SellSuccessScreen';
import { SellTypeScreen } from '../screens/sell/SellTypeScreen';
import { SellVisitMgmtScreen } from '../screens/sell/SellVisitMgmtScreen';
import { VerificationStatusScreen } from '../screens/sell/VerificationStatusScreen';
import {
  AboutUsScreen,
  CallUsScreen,
  CustomerSupportScreen,
  FaqTopicScreen,
  HelpFaqsScreen,
} from '../screens/settings/HelpScreens';
import {
  AccountDeletionScreen,
  AccountSettingsScreen,
  AppSettingsScreen,
  NotificationSettingsScreen,
  SettingsMainScreen,
} from '../screens/settings/SettingsScreens';
import type { Flow, ScreenName } from './types';

interface ScreenDef {
  /** Reference screen id (S-01 … G-04, "—" for the reference's "Extras"). */
  id: string;
  label: string;
  /** Background flow tint (`FLOW_OF(group)` in the reference). */
  flow: Flow;
  Comp: React.ComponentType<any>;
}

const def =
  (flow: Flow) =>
  (id: string, label: string, Comp: React.ComponentType<any>): ScreenDef => ({
    id,
    label,
    flow,
    Comp,
  });
// Auth, Home, Profile and Extras use the home tint; Settings and Global use the account tint.
const home = def('home');
const buy = def('buy');
const sell = def('sell');
const account = def('account');

/** Every route in the app, typed so a missing screen is a compile error. */
export const SCREENS: Record<ScreenName, ScreenDef> = {
  // Auth & Onboarding
  splash: home('S-01', 'Splash', SplashScreen),
  onboarding: home('S-02', 'Onboarding', OnboardingScreen),
  login: home('S-03', 'Login', LoginScreen),
  otp: home('S-04', 'OTP Verify', OtpScreen),
  profileSetup: home('S-05', 'Create Profile', ProfileSetupScreen),
  locationType: home('S-06', 'Location + Type', LocationUserTypeScreen),
  terms: home('S-07', 'Terms & Privacy', TermsScreen),
  permissions: home('S-08', 'App Permissions', PermissionsScreen),
  // Home & Navigation
  home: home('H-01', 'Home', HomeScreen),
  search: home('H-02', 'Search', SearchScreen),
  featured: home('H-03', 'Featured List', FeaturedListScreen),
  upcoming: home('H-04', 'Upcoming List', UpcomingListScreen),
  help: home('H-05', 'Help & Support', HelpScreen),
  coachMarks: home('H-06', 'Coach Marks', CoachMarksScreen),
  // Buy Flow
  buyTypes: buy('B-01', 'Property Type Selection', BuyTypeScreen),
  filters: buy('B-02', 'Filter', FilterScreen),
  buyList: buy('B-03', 'Listing Results', BuyListScreen),
  propertyDetail: buy('B-04', 'Property Detail', PropertyDetailScreen),
  floorPlan: buy('B-04a', 'Floor Plan', FloorPlanScreen),
  specs: buy('B-05', 'Specifications', SpecsScreen),
  advantages: buy('B-06', 'Advantages', AdvantagesScreen),
  vrTour: buy('B-07', 'Virtual Tour', VrTourScreen),
  aerial: buy('B-08', 'Aerial View', AerialScreen),
  shareProperty: buy('B-09', 'Share Property', ShareScreen),
  enquiry: buy('B-10', 'Submit Enquiry', EnquiryScreen),
  enquirySuccess: buy('B-11', 'Enquiry Success', EnquirySuccessScreen),
  visitCalendar: buy('B-12', 'Schedule Visit', VisitCalendarScreen),
  rescheduleVisit: buy('B-12a', 'Reschedule Visit', RescheduleVisitScreen),
  visitConfirmation: buy('B-13', 'Visit Confirmed', VisitConfirmationScreen),
  nriVideoCall: buy('B-13a', 'NRI Video Call', NriVideoCallScreen),
  nriVideoConfirm: buy('B-13b', 'NRI Video Confirm', NriVideoConfirmScreen),
  documentsShared: buy('B-14', 'Documents Shared', DocumentsSharedScreen),
  payment: buy('B-15', 'Payment', PaymentScreen),
  paymentFailure: buy('B-15a', 'Payment Failure', PaymentFailureScreen),
  registrationDetails: buy(
    'B-16',
    'Registration Details',
    RegistrationDetailsScreen,
  ),
  cancelEnquiry: buy('B-17', 'Cancel Enquiry', CancelEnquiryScreen),
  propertyWithdrawn: buy('B-18', 'Property Withdrawn', PropertyWithdrawnScreen),
  soldOut: buy('B-19', 'Sold Out', SoldOutScreen),
  // Sell Flow
  sellIntent: sell('SL-01', 'Sell Intent', SellIntentScreen),
  sellAddress: sell('SL-02', 'Address', SellAddressScreen),
  sellType: sell('SL-03', 'Property Type', SellTypeScreen),
  sellDetails: sell('SL-04', 'Property Details', SellDetailsScreen),
  sellAmenities: sell('SL-05', 'Amenities', SellAmenitiesScreen),
  sellPhotos: sell('SL-06', 'Photo Upload', SellPhotosScreen),
  sellPrice: sell('SL-07', 'Expected Price', SellPriceScreen),
  sellSuccess: sell('SL-08', 'Listing Success', SellSuccessScreen),
  draftSuccess: sell('SL-08a', 'Draft Save Success', DraftSuccessScreen),
  editListing: sell('SL-09', 'Edit Listing', EditListingScreen),
  verificationStatus: sell(
    'SL-10',
    'Verification Status',
    VerificationStatusScreen,
  ),
  reupload: sell('SL-11', 'Re-upload', ReuploadScreen),
  offer: sell('SL-12', 'Offer Screen', OfferScreen),
  acceptNegotiate: sell('SL-13', 'Accept / Negotiate', AcceptNegotiateScreen),
  dealConfirmed: sell('SL-14', 'Deal Confirmed + Bank', DealConfirmedScreen),
  paymentSchedule: sell('SL-15', 'Payment Schedule', PaymentScheduleScreen),
  sellRegistration: sell('SL-16', 'Registration', SellRegistrationScreen),
  dealComplete: sell('SL-17', 'Deal Complete', DealCompleteScreen),
  rejectedListing: sell('SL-18', 'Rejected Listing', RejectedListingScreen),
  // Profile & Account
  guestProfile: home('P-00', 'Guest Profile', GuestProfileScreen),
  profile: home('P-01', 'Profile', ProfileScreen),
  profileEdit: home('P-02', 'Edit Profile', ProfileEditScreen),
  changePhone: home('P-03', 'Change Phone', ChangePhoneScreen),
  myListings: home('P-04', 'My Listings', MyListingsScreen),
  myVisits: home('P-04a', 'My Visits', MyVisitsScreen),
  myDeals: home('P-04b', 'My Deals', MyDealsScreen),
  listingDetail: home('P-05', 'Listing Detail', ListingDetailScreen),
  noListings: home('P-06', 'No Listings (empty)', NoListingsScreen),
  myEnquiries: home('P-07', 'My Enquiries', MyEnquiriesScreen),
  enquiryDetail: home('P-08', 'Enquiry Detail', EnquiryDetailScreen),
  noEnquiries: home('P-09', 'No Enquiries (empty)', NoEnquiriesScreen),
  notifications: home('P-10', 'Notifications', NotificationsScreen),
  pdfViewer: home('P-11', 'Document Viewer', PdfViewerScreen),
  termsOfUse: home('P-12', 'Terms of Use', TermsScreen),
  // Settings & Help
  settingsMain: account('A-01', 'Settings Main', SettingsMainScreen),
  notificationSettings: account(
    'A-02',
    'Notification Settings',
    NotificationSettingsScreen,
  ),
  appSettings: account('A-03', 'App Settings', AppSettingsScreen),
  accountSettings: account('A-04', 'Account Settings', AccountSettingsScreen),
  accountDeletion: account('A-04a', 'Delete Account', AccountDeletionScreen),
  helpFaqs: account('A-05', 'Help & FAQs', HelpFaqsScreen),
  faqTopic: account('A-06', 'FAQ Topic', FaqTopicScreen),
  customerSupport: account('A-07', 'Customer Support', CustomerSupportScreen),
  callUs: account('A-07a', 'Call Us', CallUsScreen),
  aboutUs: account('A-08', 'About Us', AboutUsScreen),
  // Global
  offline: account('G-01', 'No Internet', OfflineScreen),
  forceUpdate: account('G-02', 'Force Update', ForceUpdateScreen),
  maintenance: account('G-03', 'Maintenance', MaintenanceScreen),
  sessionExpiry: account('G-04', 'Session Expiry', SessionExpiryScreen),
  // Extras (not in the reference document)
  favorites: home('—', 'Favorites', FavoritesScreen),
  compare: home('—', 'Compare', CompareScreen),
  advancedFilters: home('—', 'Advanced Filters', AdvancedFiltersScreen),
  mapView: home('—', 'Map View', MapViewScreen),
  sellEnquiries: home('—', 'Seller Enquiries', SellEnquiriesScreen),
  sellVisitMgmt: home('—', 'Seller Visits', SellVisitMgmtScreen),
  sellChat: home('—', 'Negotiation Chat', SellChatScreen),
  offers: home('—', 'Offers & Deals', OffersScreen),
  newsInsights: home('—', 'News & Insights', NewsInsightsScreen),
  generalInfo: home('—', 'General Info', GeneralInfoScreen),
  helpFeedback: home('—', 'Help & Feedback', HelpFeedbackScreen),
};
