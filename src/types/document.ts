export type DocumentOwnerType =
  | 'user'
  | 'property'
  | 'sell_request'
  | 'acquisition'
  | 'sales_deal'
  | 'support_ticket'
  | 'payment';
export type DocumentPurpose =
  | 'kyc'
  | 'legal'
  | 'property_media'
  | 'payment_proof'
  | 'support_attachment';

/** Document record created by POST /documents (multipart). */
export interface UploadedDocument {
  _id: string;
  referenceId: string;
  ownerType: DocumentOwnerType;
  ownerId: string;
  purpose: DocumentPurpose;
  documentType?: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  url?: string;
  status: string;
  scanStatus?: string;
}

/** GET /documents/:id/read-url response. */
export interface DocumentReadUrl {
  documentId: string;
  readUrl: string;
  expiresInSeconds: number;
}
