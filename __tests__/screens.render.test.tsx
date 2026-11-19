/**
 * Mounts every registered screen once with realistic params while the API is unavailable (503),
 * to catch render-time crashes in loading / error states. Navigation calls are recorded, not executed.
 */
import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppConfigProvider } from '../src/context/AppConfigContext';
import { AuthProvider } from '../src/context/AuthContext';
import { FavoritesProvider } from '../src/context/FavoritesContext';
import { SellFlowProvider } from '../src/context/SellFlowContext';
import { ToastProvider } from '../src/context/ToastContext';
import type { PropertyView } from '../src/interfaces/PropertyView';
import {
  NavContext,
  ScreenContext,
  type Navigator,
} from '../src/navigation/NavContext';
import { SCREENS } from '../src/navigation/screens';
import type { ScreenName, ScreenParamMap } from '../src/navigation/types';
import type { BuyEnquiry } from '../src/types/enquiry';
import type { SellRequest } from '../src/types/sellRequest';
import type { Visit } from '../src/types/visit';

const property: PropertyView = {
  id: '665f1c2e9b1e8a0012345678',
  referenceId: 'PR-1001',
  title: 'Sunrise Heights',
  type: 'apartment',
  typeTag: 'apartment',
  typeLabel: 'Apartment',
  status: 'available',
  price: 8500000,
  pricePerSqft: 5862,
  bhk: 3,
  bhkLabel: '3',
  area: 1450,
  floor: '7 of 12',
  age: '1–5 years',
  facing: 'East',
  furnishing: 'Semi-furnished',
  location: 'Adyar',
  city: 'Chennai',
  fullAddress: 'Adyar, Chennai',
  latitude: 13.0,
  longitude: 80.25,
  images: [],
  amenities: ['Lift'],
  highlights: [],
  description: '',
  verified: true,
  negotiable: true,
  featured: false,
  upcoming: false,
  launchDate: null,
  views: 0,
  enquiries: 0,
  savedCount: 0,
  posted: '2 days ago',
  createdAt: null,
  soldAt: null,
  floorPlanUrl: null,
  videoUrl: null,
  droneImageUrl: null,
  tour3dUrl: null,
  advantages: { investment: [], location: [], connectivity: [] },
  nearbyPlaces: [],
  savedByUsers: [],
};
const visit: Visit = {
  _id: '665f1c2e9b1e8a0012345679',
  referenceId: 'VS-1',
  buyerId: 'u1',
  propertyId: property.id,
  enquiryId: '665f1c2e9b1e8a0012345680',
  visitDate: '2026-12-24T00:00:00.000Z',
  visitTime: '11:00 AM',
  visitType: 'physical',
  status: 'scheduled',
};
const enquiry: BuyEnquiry = {
  _id: '665f1c2e9b1e8a0012345680',
  referenceId: 'BE-1',
  buyerId: 'u1',
  propertyId: property.id,
  propertySnapshot: {
    title: 'Sunrise Heights',
    price: 8500000,
    location: 'Adyar',
  },
  preferredContact: 'phone',
  interestType: 'schedule_visit',
  status: 'visit_scheduled',
  visits: [visit],
};
const request = {
  _id: '665f1c2e9b1e8a0012345681',
  referenceId: 'SR-1',
  sellerId: 'u1',
  status: 'draft',
  propertyTitle: 'Sunrise Heights',
} as SellRequest;
const id = request._id;

const PARAMS: { [N in ScreenName]: ScreenParamMap[N] } = {
  splash: undefined,
  onboarding: undefined,
  login: undefined,
  otp: { phone: '9876543210', requestId: 'req' },
  profileSetup: undefined,
  locationType: undefined,
  terms: undefined,
  permissions: undefined,
  home: undefined,
  search: undefined,
  featured: undefined,
  upcoming: undefined,
  help: undefined,
  coachMarks: undefined,
  buyTypes: undefined,
  filters: { filters: {} },
  buyList: { filters: { typeId: 'apartment', apiType: 'apartment' } },
  propertyDetail: { id: property.id, property },
  floorPlan: { property },
  specs: { property },
  advantages: { property },
  vrTour: { property },
  aerial: { property },
  shareProperty: { property },
  enquiry: { property },
  enquirySuccess: { property, enquiry },
  visitCalendar: { property, enquiryId: enquiry._id },
  rescheduleVisit: { visit, property },
  visitConfirmation: { visit, property },
  nriVideoCall: { property },
  nriVideoConfirm: { property, visit, language: 'tamil' },
  documentsShared: { enquiryId: enquiry._id },
  payment: { enquiryId: enquiry._id },
  paymentFailure: {
    enquiryId: enquiry._id,
    reason: 'Bank declined the transaction.',
  },
  registrationDetails: { enquiryId: enquiry._id },
  cancelEnquiry: { visit, title: 'Sunrise Heights' },
  propertyWithdrawn: { enquiry },
  soldOut: { property },
  favorites: undefined,
  compare: { property },
  advancedFilters: { filters: {} },
  mapView: { property },
  sellType: undefined,
  sellIntent: { type: 'apartment' },
  sellAddress: undefined,
  sellDetails: undefined,
  sellAmenities: undefined,
  sellPhotos: undefined,
  sellPrice: undefined,
  sellSuccess: { request },
  draftSuccess: { request },
  editListing: { id },
  verificationStatus: { id },
  reupload: { id },
  offer: { id },
  acceptNegotiate: { id, mode: 'negotiate' },
  dealConfirmed: { id },
  paymentSchedule: { id },
  sellRegistration: { id },
  dealComplete: { id },
  rejectedListing: { id },
  sellEnquiries: { id },
  sellVisitMgmt: { id },
  sellChat: { id },
  guestProfile: undefined,
  profile: undefined,
  profileEdit: undefined,
  changePhone: undefined,
  myListings: undefined,
  myVisits: undefined,
  myDeals: undefined,
  listingDetail: { id },
  noListings: undefined,
  myEnquiries: undefined,
  enquiryDetail: { id: enquiry._id },
  noEnquiries: undefined,
  notifications: undefined,
  pdfViewer: {
    doc: { name: 'Sale Deed', url: 'https://example.com/sale-deed.pdf' },
  },
  termsOfUse: undefined,
  offers: undefined,
  newsInsights: undefined,
  generalInfo: undefined,
  helpFeedback: undefined,
  settingsMain: undefined,
  notificationSettings: undefined,
  appSettings: undefined,
  accountSettings: undefined,
  accountDeletion: undefined,
  helpFaqs: undefined,
  faqTopic: { topicId: 'buying' },
  customerSupport: undefined,
  callUs: undefined,
  aboutUs: undefined,
  offline: undefined,
  forceUpdate: undefined,
  maintenance: undefined,
  sessionExpiry: undefined,
};

const nav: Navigator = {
  go: jest.fn(),
  back: jest.fn(),
  jump: jest.fn(),
  reset: jest.fn(),
  replace: jest.fn(),
  popTo: jest.fn(),
  onNav: jest.fn(),
  signIn: jest.fn(),
  finishSignIn: jest.fn(),
  stack: [],
};

jest.setTimeout(30000);

const metrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 44, left: 0, right: 0, bottom: 34 },
};

beforeAll(() => {
  (globalThis as any).fetch = jest.fn(() =>
    Promise.resolve({
      status: 503,
      ok: false,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            error: { code: 'UNAVAILABLE', message: 'Service unavailable' },
          }),
        ),
    }),
  );
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

const flush = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
};

describe('screen registry', () => {
  it('registers a component for every route', () => {
    for (const name of Object.keys(PARAMS) as ScreenName[]) {
      expect(SCREENS[name]?.Comp).toBeTruthy();
    }
    expect(Object.keys(SCREENS).sort()).toEqual(Object.keys(PARAMS).sort());
  });

  it.each(Object.keys(PARAMS) as ScreenName[])('renders %s', async name => {
    const { Comp, flow } = SCREENS[name];
    let tree: ReactTestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={metrics}>
          <AppConfigProvider>
            <AuthProvider>
              <FavoritesProvider>
                <SellFlowProvider>
                  <ToastProvider>
                    <NavContext.Provider value={nav}>
                      <ScreenContext.Provider
                        value={{
                          name,
                          key: name,
                          focused: true,
                          flow,
                          firstVisit: false,
                        }}
                      >
                        <Comp params={PARAMS[name]} />
                      </ScreenContext.Provider>
                    </NavContext.Provider>
                  </ToastProvider>
                </SellFlowProvider>
              </FavoritesProvider>
            </AuthProvider>
          </AppConfigProvider>
        </SafeAreaProvider>,
      );
      await flush();
    });
    expect(tree!.toJSON()).toBeTruthy();
    await act(async () => {
      tree!.unmount();
    });
  });
});
