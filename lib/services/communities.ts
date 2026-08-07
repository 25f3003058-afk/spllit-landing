import { api } from '@/lib/api/client';
import type { Channel, ChatMessage, Community, Paginated } from '@/types';

export const communitiesService = {
  discover: (query: { college?: string; cursor?: string } = {}) =>
    api.get<Paginated<Community>>('/communities/discover', {
      query: { college: query.college, cursor: query.cursor, limit: 20 },
    }),

  mine: () => api.get<Community[]>('/communities/mine'),

  byId: (id: string) => api.get<Community>(`/communities/${id}`),

  channels: (communityId: string) =>
    api.get<Channel[]>(`/communities/${communityId}/channels`),

  join: (id: string) => api.post<Community>(`/communities/${id}/join`),

  leave: (id: string) => api.post<void>(`/communities/${id}/leave`),

  /** Paginated history — newest first, `cursor` walks backwards in time. */
  messages: (channelId: string, cursor?: string) =>
    api.get<Paginated<ChatMessage>>(`/channels/${channelId}/messages`, {
      query: { cursor, limit: 40 },
    }),

  markRead: (channelId: string) => api.post<void>(`/channels/${channelId}/read`),
};
