import api from './client';
import type { Tag } from '../types';

export interface CreateTagPayload {
  pageId: number;
  categoryId: number;
  name: string;
  description?: string;
  confidence?: number;
  confidenceLabel?: string;
  navUrl?: string | null;
}

export const tagApi = {
  create: (data: CreateTagPayload) => api.post<Tag>('/tags', data).then(r => r.data),
  update: (id: number, data: Partial<Pick<Tag, 'name' | 'description' | 'confidence' | 'confidenceLabel' | 'navUrl' | 'categoryId' | 'sortOrder'>>) =>
    api.put<Tag>(`/tags/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/tags/${id}`).then(() => {}),
  reorder: (items: { id: number; categoryId: number; afterId: number | null }[]) =>
    api.put<{ success: boolean; tags: { id: number; categoryId: number; sortOrder: number }[] }>('/tags/reorder', { items }).then(r => r.data),
};
