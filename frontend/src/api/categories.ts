import api from './client';
import type { Category } from '../types';

export interface CreateCategoryPayload {
  pageId: number;
  parentId?: number | null;
  name: string;
  description?: string;
  confidence?: number;
  confidenceLabel?: string;
}

export const categoryApi = {
  create: (data: CreateCategoryPayload) => api.post<Category>('/categories', data).then(r => r.data),
  update: (id: number, data: { name?: string; parentId?: number | null; description?: string; confidence?: number; confidenceLabel?: string }) => api.put<Category>(`/categories/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/categories/${id}`).then(() => {}),
  reorder: (items: { id: number; parentId: number | null; sortOrder: number }[]) =>
    api.put('/categories/reorder', { items }).then(() => {}),
};
