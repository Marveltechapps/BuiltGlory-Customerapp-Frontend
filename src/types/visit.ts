export type VisitStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'missed'
  | 'rescheduled';
export type VisitType = 'physical' | 'virtual';
export type VirtualPlatform =
  | 'zoom'
  | 'google_meet'
  | 'teams'
  | 'whatsapp_video';

export interface Visit {
  _id: string;
  referenceId: string;
  buyerId: string;
  propertyId: string;
  enquiryId?: string;
  visitDate: string;
  visitTime?: string;
  visitType: VisitType;
  virtualPlatform?: VirtualPlatform | null;
  meetingLink?: string;
  status: VisitStatus;
  assignedAdmin?: string | null;
  rescheduleCount?: number;
  cancelReason?: string;
  propertySnapshot?: {
    title?: string;
    location?: string;
    price?: number | null;
  };
  feedback?: {
    buyerInterest?: string | null;
    notes?: string;
    nextAction?: string | null;
  };
  createdAt?: string;
}

export interface AvailabilitySlot {
  time: string;
  available: boolean;
  status: 'available' | 'booked';
  remainingCapacity: number;
  bookedCount: number;
}

/** GET /visits/availability response. */
export interface VisitAvailability {
  propertyId: string;
  visitType: VisitType;
  timezone: string;
  from: string;
  to: string;
  days: Array<{ date: string; slots: AvailabilitySlot[] }>;
}

/** POST /visits body (visits createValidator). */
export interface CreateVisitRequest {
  propertyId: string;
  enquiryId?: string;
  visitDate: string;
  visitTime: string;
  visitType: VisitType;
  language?: string | null;
  preferredLanguage?: 'English' | 'Tamil' | 'Hindi' | 'Kannada' | null;
  virtualPlatform?: VirtualPlatform | null;
  meetingLink?: string | null;
}

/** PATCH /visits/:visitId/reschedule and /cancel body (visits updateValidator). */
export interface UpdateVisitRequest {
  visitDate?: string;
  visitTime?: string;
  reason?: string | null;
}
