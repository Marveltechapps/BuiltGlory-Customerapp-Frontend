/** In-app notification (GET /me/notifications). */
export interface AppNotification {
  _id: string;
  referenceId: string;
  event: string;
  channel: string;
  title?: string;
  message?: string;
  notificationType?: string;
  screen?: string;
  entityId?: string;
  entityType?: string;
  listingId?: string;
  enquiryId?: string;
  propertyId?: string;
  dealId?: string;
  image?: string;
  isRead?: boolean;
  readAt?: string;
  createdAt: string;
}
