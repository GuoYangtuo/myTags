import api from './client';
import type { Share, CreateSharePayload } from '../types';

export const shareApi = {
  create: (data: CreateSharePayload) => api.post<{ id: number; shareCode: string; expiresAt: string | null; createdAt: string }>('/shares', data).then(r => r.data),
  list: () => api.get<Share[]>('/shares').then(r => r.data),
  delete: (id: number) => api.delete(`/shares/${id}`).then(() => {}),
};
