import api from './client';
import type { User } from '../types';

export interface LoginPayload { identifier: string; password: string }
export interface RegisterPayload { email: string; password: string; nickname?: string }

export const authApi = {
  login: (data: LoginPayload) => api.post<{ token: string; user: User }>('/auth/login', data).then(r => r.data),
  register: (data: RegisterPayload) => api.post<{ token: string; user: User }>('/auth/register', data).then(r => r.data),
  me: () => api.get<User>('/auth/me').then(r => r.data),
  updateProfile: (nickname: string) => api.put<User>('/auth/profile', { nickname }).then(r => r.data),
};
