import { apiRequest, apiUpload } from '../api';
import type { DocumentApi } from '../api/types';

export type DocumentUploadFields = {
  ownerType: string;
  ownerId: string;
  purpose: string;
  documentType: string;
};

export type UploadFileInput = {
  uri: string;
  name: string;
  type: string;
};

export type DocumentReadUrlApi = {
  readUrl: string;
  expiresInSeconds?: number;
};

export type UploadIntentApi = {
  document: DocumentApi;
  uploadUrl: string;
  expiresInSeconds: number;
};

export async function uploadDocument(
  file: UploadFileInput,
  fields: DocumentUploadFields,
  signal?: AbortSignal,
): Promise<DocumentApi> {
  const { data } = await apiUpload<DocumentApi>('/documents', file, fields, {
    signal,
  });
  return data;
}

export async function createUploadIntent(
  body: DocumentUploadFields & {
    fileName?: string;
    contentType?: string;
    byteSize?: number;
  },
): Promise<UploadIntentApi> {
  const { data } = await apiRequest<UploadIntentApi>('/documents/upload-intents', {
    method: 'POST',
    body,
  });
  return data;
}

export async function getDocumentReadUrl(
  documentId: string,
  signal?: AbortSignal,
): Promise<DocumentReadUrlApi> {
  const { data } = await apiRequest<DocumentReadUrlApi>(
    `/documents/${documentId}/read-url`,
    { signal },
  );
  return data;
}
