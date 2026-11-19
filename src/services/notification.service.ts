import { apiRequest, apiRequestPage } from '../api';
import type { AppNotification } from '../types/notification';

/** GET /me/notifications (in-app channel). */
export const listNotifications = (
  query: { page?: number; limit?: number; status?: 'unread' | 'read' } = {},
  signal?: AbortSignal,
) =>
  apiRequestPage<AppNotification>('/me/notifications', {
    query: { limit: 50, ...query },
    signal,
  });

/** GET /me/notifications/unread-count */
export const getUnreadCount = (signal?: AbortSignal) =>
  apiRequest<{ count: number }>('/me/notifications/unread-count', { signal });

/** PATCH /me/notifications/read (marks the given ids, or all when `ids` is empty). */
export const markNotificationsRead = (ids: string[] = []) =>
  apiRequest<AppNotification[]>('/me/notifications/read', {
    method: 'PATCH',
    body: { ids },
  });

/** PATCH /me/notifications/:id/read */
export const markNotificationRead = (id: string) =>
  apiRequest<AppNotification>(`/me/notifications/${id}/read`, {
    method: 'PATCH',
    body: {},
  });

/** DELETE /me/notifications/:id (archives it for the customer). */
export const deleteNotification = (id: string) =>
  apiRequest<{ deleted: boolean; id: string }>(`/me/notifications/${id}`, {
    method: 'DELETE',
  });
