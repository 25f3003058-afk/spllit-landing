import { api } from '@/lib/api/client';
import type { ComingSoonService } from '@/types';

export const waitlistService = {
  join: (service: ComingSoonService, email: string, note?: string) =>
    api.post<{ id: string; service: ComingSoonService }>('/waitlist', {
      service,
      email,
      note,
    }),

  status: (service: ComingSoonService) =>
    api.get<{ joined: boolean; count: number }>(`/waitlist/${service}/status`),
};
