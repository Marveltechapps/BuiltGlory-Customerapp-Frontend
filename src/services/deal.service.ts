import { apiRequestPage } from '../api';
import type { CustomerDealSummary } from '../types/deal';

/** GET /me/deals — one page. Screens call this again for the next page. */
export const listMyDeals = (
  query: { page?: number; limit?: number } = {},
  signal?: AbortSignal,
) =>
  apiRequestPage<CustomerDealSummary>('/me/deals', {
    query: { limit: 20, ...query },
    signal,
  });
