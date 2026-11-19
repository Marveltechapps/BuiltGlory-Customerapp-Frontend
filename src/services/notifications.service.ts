import { apiRequest } from '../api';
import type { ApiMeta, QueryParams } from '../api/types';

export type NotificationApi = {
  _id: string;
  event?: string;
  title: string;
  message: string;
  notificationType?: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  createdAt?: string;
  [key: string]: unknown;
};

export async function listNotifications(
  query: QueryParams = {},
  signal?: AbortSignal,
): Promise<{ items: NotificationApi[]; meta?: ApiMeta }> {
  const { data, meta } = await apiRequest<NotificationApi[]>('/me/notifications', {
    query,
    signal,
  });
  return { items: data || [], meta };
}

export async function getUnreadCount(
  signal?: AbortSignal,
): Promise<{ count: number }> {
  const { data } = await apiRequest<{ count: number }>(
    '/me/notifications/unread-count',
    { signal },
  );
  return data;
}

export async function markAllNotificationsRead(): Promise<unknown> {
  const { data } = await apiRequest('/me/notifications/read', {
    method: 'PATCH',
    body: {},
  });
  return data;
}

export async function markNotificationRead(id: string): Promise<NotificationApi> {
  const { data } = await apiRequest<NotificationApi>(
    `/me/notifications/${id}/read`,
    { method: 'PATCH', body: {} },
  );
  return data;
}

export async function deleteNotification(id: string): Promise<unknown> {
  const { data } = await apiRequest(`/me/notifications/${id}`, {
    method: 'DELETE',
  });
  return data;
}
