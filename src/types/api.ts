// Envelope used by every /api/v1 JSON response: { data, meta: { requestId, ...pagination } }.
export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  value?: unknown;
}

/** Common query params accepted by list validators. */
export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}
