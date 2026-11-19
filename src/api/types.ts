/** Shared API DTOs matching BG-Service envelopes and common resources. */

export interface PaginationMeta {
  requestId?: string;
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface ApiMeta extends PaginationMeta {
  [key: string]: unknown;
}

export interface ApiSuccessEnvelope<T> {
  data: T;
  meta?: ApiMeta;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
  meta?: { requestId?: string };
}

export type PropertyStatus =
  | 'draft'
  | 'available'
  | 'reserved'
  | 'under_construction'
  | 'sold';

export type PropertyTypeEnum =
  | 'plot'
  | 'apartment'
  | 'villa'
  | 'residential'
  | 'commercial'
  | 'land'
  | 'fractional'
  | '3d_printing'
  | 'organic_home'
  | 'ceo_mansion'
  | 'holiday_home'
  | 'farmhouse'
  | 'nri'
  | 'interior'
  | string;

export interface PropertyAddressApi {
  line1?: string;
  street?: string;
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
}

export interface PropertySpecsApi {
  bhk?: string | number;
  builtUpArea?: number | null;
  carpetArea?: number | null;
  plotArea?: number | null;
  floor?: string | number | null;
  totalFloors?: number | null;
  facing?: string;
  unitNo?: string;
  furnishing?: string;
  propertyAge?: string;
  parking?: number;
}

export interface PropertyMediaApi {
  coverPhoto?: string | null;
  photos?: string[];
  videoUrl?: string | null;
  droneImageUrl?: string | null;
  tour3dUrl?: string | null;
  floorPlanUrl?: string | null;
}

export interface PropertyMetricsApi {
  views?: number;
  enquiries?: number;
  savedCount?: number;
}

export interface PropertyNearbyApi {
  name: string;
  type?: string;
  distance?: string;
}

export interface PropertyAdvantagesApi {
  investment?: string[];
  location?: string[];
  connectivity?: string[];
}

export interface PropertyApi {
  _id: string;
  referenceId?: string;
  title: string;
  description?: string;
  type: PropertyTypeEnum;
  status: PropertyStatus;
  isFeatured?: boolean;
  isUpcoming?: boolean;
  isVerified?: boolean;
  verified?: boolean;
  launchDate?: string | null;
  price: number;
  isNegotiable?: boolean;
  address?: PropertyAddressApi;
  specs?: PropertySpecsApi;
  amenities?: string[];
  media?: PropertyMediaApi;
  advantages?: PropertyAdvantagesApi;
  nearbyPlaces?: PropertyNearbyApi[];
  highlights?: string[];
  metrics?: PropertyMetricsApi;
  builder?: string;
  rating?: number;
  soldAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type UserRole = 'buyer' | 'seller' | 'both';
export type UserType = 'resident' | 'nri' | 'pio';
export type KycStatus = 'not_submitted' | 'pending' | 'verified' | 'rejected';

export interface BankDetailsApi {
  accountHolderName?: string;
  bankName?: string;
  accountNumberLast4?: string;
  ifsc?: string;
  branch?: string;
  upiId?: string;
}

export interface NotificationChannelPrefs {
  transactional?: boolean;
  marketing?: boolean;
}

export interface NotificationPreferencesApi {
  push?: NotificationChannelPrefs;
  whatsapp?: NotificationChannelPrefs;
  sms?: NotificationChannelPrefs;
  email?: NotificationChannelPrefs;
  in_app?: NotificationChannelPrefs;
}

export interface UserApi {
  _id: string;
  name?: string;
  mobileNumber?: string;
  phone?: string;
  email?: string;
  role?: UserRole;
  userType?: UserType;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  profilePhoto?: string | null;
  kycStatus?: KycStatus;
  bankDetails?: BankDetailsApi;
  notificationPreferences?: NotificationPreferencesApi;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthTokensApi {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds?: number;
}

export interface AuthSessionApi extends AuthTokensApi {
  user: Partial<UserApi> & { _id: string };
}

export interface OtpSendResultApi {
  requestId: string;
  expiresInSeconds: number;
  canResendAt: string;
}

export interface AppConfigApi {
  versions: {
    current: string;
    minimumSupported: string;
    latest: string;
  };
  storeUrls: {
    android?: string | null;
    ios?: string | null;
  };
  maintenance: {
    enabled: boolean;
    message?: string;
    expectedBackAt?: string | null;
  };
  featureFlags: {
    registration?: boolean;
    kycRequired?: boolean;
    showPrices?: boolean;
    virtualTours?: boolean;
    stagePayment?: boolean;
    interior?: boolean;
    [key: string]: boolean | undefined;
  };
  payment: {
    tokenAmount: number;
    escrow?: {
      accountHolder?: string;
      bankName?: string;
      accountNumber?: string;
      ifsc?: string;
      branch?: string;
      upiId?: string;
      chequePayee?: string;
      chequeInstructions?: string[];
    };
  };
  support: {
    phone?: string;
    supportEmail?: string;
    whatsappNumber?: string;
  };
  stats?: {
    cities?: number;
    appRating?: number;
  };
}

export interface DocumentApi {
  _id: string;
  referenceId?: string;
  url?: string | null;
  status?: string;
}

export type QueryPrimitive = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryPrimitive | QueryPrimitive[]>;
