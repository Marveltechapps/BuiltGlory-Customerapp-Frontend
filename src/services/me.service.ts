import { apiRequest, getDeviceId } from '../api';
import type { QueryParams, UserApi } from '../api/types';

export type AccountDeletionStatus = {
  status: 'none' | 'requested' | 'cancelled' | 'completed';
  requestedAt?: string | null;
  scheduledDeletionAt?: string | null;
};

export async function getMe(signal?: AbortSignal): Promise<UserApi> {
  const { data } = await apiRequest<UserApi>('/me', { signal });
  return data;
}

export async function patchMe(
  body: Partial<UserApi> & Record<string, unknown>,
  signal?: AbortSignal,
): Promise<UserApi> {
  const { data } = await apiRequest<UserApi>('/me', {
    method: 'PATCH',
    body,
    signal,
  });
  return data;
}

export async function setPassword(password: string): Promise<UserApi | { ok: boolean }> {
  const { data } = await apiRequest<UserApi | { ok: boolean }>('/me/password', {
    method: 'PUT',
    body: { password },
  });
  return data;
}

export async function putPushToken(input: {
  token: string;
  platform: 'android' | 'ios' | 'web';
  deviceId?: string;
}): Promise<{ ok?: boolean } | unknown> {
  const deviceId = input.deviceId || (await getDeviceId());
  const { data } = await apiRequest('/me/push-token', {
    method: 'PUT',
    body: {
      token: input.token,
      platform: input.platform,
      deviceId,
    },
  });
  return data;
}

export async function deletePushToken(token: string): Promise<{ ok?: boolean } | unknown> {
  const { data } = await apiRequest('/me/push-token', {
    method: 'DELETE',
    body: { token },
  });
  return data;
}

export async function getAccountDeletion(
  signal?: AbortSignal,
): Promise<AccountDeletionStatus> {
  const { data } = await apiRequest<AccountDeletionStatus>('/me/account-deletion', {
    signal,
  });
  return data;
}

export async function requestAccountDeletion(input: {
  confirmation: 'DELETE';
  reason?: string;
}): Promise<AccountDeletionStatus> {
  const { data } = await apiRequest<AccountDeletionStatus>('/me/account-deletion', {
    method: 'POST',
    body: input,
  });
  return data;
}

export async function cancelAccountDeletion(): Promise<AccountDeletionStatus> {
  const { data } = await apiRequest<AccountDeletionStatus>('/me/account-deletion', {
    method: 'DELETE',
  });
  return data;
}

/** Convenience for typed query helpers if screens need them later. */
export type MeQuery = QueryParams;
