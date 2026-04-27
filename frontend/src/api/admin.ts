import api from './client';

export interface AdminUser {
  id: number;
  email: string;
  nickname: string;
  avatarSeed: string;
  createdAt: string;
}

export const adminApi = {
  listUsers: async (): Promise<AdminUser[]> => {
    const res = await api.get('/admin/users');
    return res.data;
  },

  updateUser: async (id: number, data: { nickname?: string; password?: string }): Promise<AdminUser> => {
    const res = await api.put(`/admin/users/${id}`, data);
    return res.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/admin/users/${id}`);
  },

  impersonate: async (id: number): Promise<{ token: string; user: AdminUser }> => {
    const res = await api.post(`/admin/users/${id}/impersonate`);
    return res.data;
  },
};
