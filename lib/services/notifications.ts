import { api } from '@/lib/api/client';
import type { AppNotification, Paginated } from '@/types';

export const notificationsService = {
  list: (cursor?: string) =>
    api.get<Paginated<AppNotification>>('/notifications', {
      query: { cursor, limit: 30 },
    }),

  unreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),

  markRead: (id: string) => api.post<void>(`/notifications/${id}/read`),

  markAllRead: () => api.post<void>('/notifications/read-all'),
};
