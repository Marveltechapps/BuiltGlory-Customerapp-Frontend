export type UserType = 'resident' | 'nri' | 'pio';
export type CustomerRole = 'buyer' | 'seller' | 'both';
export type KycStatus = 'not_submitted' | 'pending' | 'verified' | 'rejected';

export interface ChannelPreference {
  transactional?: boolean;
  marketing?: boolean;
}
export type NotificationChannel =
  | 'sms'
  | 'whatsapp'
  | 'email'
  | 'push'
  | 'in_app';
export type NotificationPreferences = Partial<
  Record<NotificationChannel, ChannelPreference>
>;

export interface BankDetails {
  accountHolderName: string;
  bankName: string;
  accountNumberLast4: string;
  ifsc: string;
  branch?: string | null;
  upiId?: string | null;
  updatedAt?: string;
}

export interface AccountDeletionStatus {
  status: 'none' | 'requested' | 'cancelled' | 'completed';
  verificationStatus?: 'not_started' | 'pending' | 'verified' | 'failed';
  reason?: string | null;
  requestedAt?: string;
  scheduledDeletionAt?: string;
  cancelledAt?: string;
}

/** GET /me (users schema + `profileComplete` virtual). */
export interface User {
  _id: string;
  id?: string;
  referenceId: string;
  name?: string;
  mobileNumber?: string;
  phone?: string;
  phoneNormalized?: string;
  email?: string;
  isVerified?: boolean;
  isEmailVerified?: boolean;
  userType: UserType;
  role: CustomerRole;
  profilePhoto?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  bankDetails?: BankDetails;
  kycStatus?: KycStatus;
  notificationPreferences?: NotificationPreferences;
  accountDeletion?: AccountDeletionStatus;
  totalEnquiries?: number;
  totalVisits?: number;
  totalDeals?: number;
  totalListings?: number;
  profileComplete?: boolean;
  createdAt?: string;
}

/** PATCH /me body (users updateValidator). */
export interface UpdateMeRequest {
  name?: string;
  email?: string | null;
  mobileNumber?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  profilePhoto?: string | null;
  userType?: UserType;
  role?: CustomerRole;
  bankDetails?: Omit<BankDetails, 'updatedAt'>;
  notificationPreferences?: NotificationPreferences;
}
