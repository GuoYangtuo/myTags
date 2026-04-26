import { create } from 'zustand';
import { authApi } from '../api/auth';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  lastAuthChange: number;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nickname?: string) => Promise<void>;
  updateProfile: (nickname: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('mytags_token'),
  loading: true,
  lastAuthChange: 0,

  login: async (email, password) => {
    const data = await authApi.login({ email, password });
    localStorage.setItem('mytags_token', data.token);
    set({ user: data.user, token: data.token, lastAuthChange: Date.now() });
  },

  register: async (email, password, nickname) => {
    const data = await authApi.register({ email, password, nickname });
    localStorage.setItem('mytags_token', data.token);
    set({ user: data.user, token: data.token, lastAuthChange: Date.now() });
  },

  updateProfile: async (nickname) => {
    const updated = await authApi.updateProfile(nickname);
    set((state) => ({ user: state.user ? { ...state.user, nickname: updated.nickname } : null }));
  },

  logout: () => {
    localStorage.removeItem('mytags_token');
    set({ user: null, token: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('mytags_token');
    if (!token) {
      set({ loading: false });
      return;
    }
    try {
      const user = await authApi.me();
      set({ user, token, loading: false });
    } catch {
      localStorage.removeItem('mytags_token');
      set({ user: null, token: null, loading: false });
    }
  },
}));
