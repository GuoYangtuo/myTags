import api from './client';
import type { Page } from '../types';

export const pageApi = {
  list: () => api.get<Page[]>('/pages').then(r => r.data),
  get: (id: number) => api.get<Page>(`/pages/${id}`).then(r => r.data),
  create: (data: { name: string; description?: string }) => api.post<Page>('/pages', data).then(r => r.data),
  update: (id: number, data: { name?: string; description?: string }) => api.put<Page>(`/pages/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/pages/${id}`).then(() => {}),
  // 保存页面内容（整个 content JSON）
  saveContent: (id: number, content: { categories: any[] }) =>
    api.put<Page>(`/pages/${id}`, { content }).then(r => r.data),
};
