import { api } from '@/lib/api/client';
import type { ChatMessage, ChatThread, ChatContextType, MessageType, Paginated } from '@/types';

export const chatService = {
  threads: () => api.get<ChatThread[]>('/chat/threads'),

  thread: (id: string) => api.get<ChatThread>(`/chat/threads/${id}`),

  /**
   * Resolves the thread for a given context, creating it if it does not exist.
   * Used when opening chat from a ride card, squad page or profile.
   */
  resolveThread: (contextType: ChatContextType, contextId: string) =>
    api.post<ChatThread>('/chat/threads/resolve', { contextType, contextId }),

  messages: (threadId: string, cursor?: string) =>
    api.get<Paginated<ChatMessage>>(`/chat/threads/${threadId}/messages`, {
      query: { cursor, limit: 40 },
    }),

  /**
   * HTTP fallback for sending. The socket path is preferred (instant echo to
   * other participants); this is used when the socket is disconnected so a
   * message is never silently lost on a flaky connection.
   */
  send: (
    threadId: string,
    input: {
      clientId: string;
      content: string;
      type?: MessageType;
      metadata?: Record<string, unknown>;
    },
  ) => api.post<ChatMessage>(`/chat/threads/${threadId}/messages`, input),

  markRead: (threadId: string) => api.post<void>(`/chat/threads/${threadId}/read`),
};
