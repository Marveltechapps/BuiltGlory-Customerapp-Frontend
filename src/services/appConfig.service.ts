import { apiRequest } from '../api';
import type { AppConfig } from '../types/appConfig';

/** GET /app/config (public): versions, maintenance, support contacts and escrow details. */
export const getAppConfig = (signal?: AbortSignal) =>
  apiRequest<AppConfig>('/app/config', { auth: false, signal });
