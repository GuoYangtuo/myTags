import api from './client';
import type { FavoriteItem } from '../types';

export const favoriteApi = {
  add: (shareCode: string) =>
    api.post<{ success: boolean; favorited: boolean }>('/favorites', { shareCode }).then(r => r.data),

  remove: (shareCode: string) =>
    api.delete(`/favorites/${shareCode}`).then(() => {}),

  list: () =>
    api.get<FavoriteItem[]>('/favorites').then(r => r.data),

  check: (shareCode: string) =>
    api.get<{ favorited: boolean }>(`/favorites/check/${shareCode}`).then(r => r.data),
};
