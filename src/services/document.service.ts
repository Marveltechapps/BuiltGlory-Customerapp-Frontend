import { apiRequest } from '../api';
import type {
  DocumentOwnerType,
  DocumentPurpose,
  DocumentReadUrl,
  UploadedDocument,
} from '../types/document';
import type { PickedFile } from '../utils/media';

/** POST /documents (multipart `file`): stores the file and returns its document record and URL. */
export function uploadDocument(
  file: PickedFile,
  meta: {
    ownerType: DocumentOwnerType;
    ownerId: string;
    purpose: DocumentPurpose;
    documentType?: string;
  },
): Promise<UploadedDocument> {
  const form = new FormData();
  form.append('ownerType', meta.ownerType);
  form.append('ownerId', meta.ownerId);
  form.append('purpose', meta.purpose);
  if (meta.documentType) form.append('documentType', meta.documentType);
  // React Native's FormData accepts a { uri, name, type } descriptor for file parts.
  form.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);
  return apiRequest<UploadedDocument>('/documents', {
    method: 'POST',
    formData: form,
  });
}

/** GET /documents/:documentId/read-url: short-lived signed URL for private files. */
export const getDocumentReadUrl = (documentId: string) =>
  apiRequest<DocumentReadUrl>(`/documents/${documentId}/read-url`);
