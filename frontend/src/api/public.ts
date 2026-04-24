import api from './client';
import type { ShareData, PublicUser } from '../types';

export const publicApi = {
  getUser: (username: string) => api.get<PublicUser>(`/public/user/${encodeURIComponent(username)}`).then(r => r.data),
  getShare: (code: string) => api.get<ShareData>(`/public/share/${code}`).then(r => r.data),
  getPage: (pageId: number) => api.get(`/public/page/${pageId}`).then(r => r.data),
};
