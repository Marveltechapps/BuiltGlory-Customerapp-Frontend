import { apiRequest } from '../api';
import type { AppConfigApi } from '../api/types';

export async function getAppConfig(signal?: AbortSignal): Promise<AppConfigApi> {
  const { data } = await apiRequest<AppConfigApi>('/app/config', {
    signal,
    skipAuthRefresh: true,
  });
  return data;
}
