import { apiRequest } from '../api';
import type {
  AccountDeletionStatus,
  UpdateMeRequest,
  User,
} from '../types/user';

/** GET /me */
export const getMe = (signal?: AbortSignal) =>
  apiRequest<User>('/me', { signal });

/** PATCH /me */
export const updateMe = (body: UpdateMeRequest) =>
  apiRequest<User>('/me', { method: 'PATCH', body });

/** GET /me/account-deletion */
export const getAccountDeletion = (signal?: AbortSignal) =>
  apiRequest<AccountDeletionStatus>('/me/account-deletion', { signal });

/** POST /me/account-deletion — `confirmation` must be the literal "DELETE". */
export const requestAccountDeletion = (reason?: string) =>
  apiRequest<AccountDeletionStatus>('/me/account-deletion', {
    method: 'POST',
    body: { confirmation: 'DELETE', reason: reason || null },
  });

/** DELETE /me/account-deletion — cancel during the 30-day grace period. */
export const cancelAccountDeletion = () =>
  apiRequest<AccountDeletionStatus>('/me/account-deletion', {
    method: 'DELETE',
  });
