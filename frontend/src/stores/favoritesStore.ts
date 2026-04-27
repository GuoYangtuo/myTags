import { create } from 'zustand';
import { favoriteApi } from '../api/favorites';
import type { FavoriteItem } from '../types';

interface FavoritesState {
  favorites: FavoriteItem[];
  loading: boolean;

  fetchFavorites: () => Promise<void>;
  addFavorite: (shareCode: string) => void;
  removeFavorite: (shareCode: string) => void;
  isFavorited: (shareCode: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  loading: false,

  fetchFavorites: async () => {
    set({ loading: true });
    try {
      const favorites = await favoriteApi.list();
      set({ favorites, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addFavorite: (shareCode: string) => {
    const stub: FavoriteItem = {
      shareCode,
      createdAt: new Date().toISOString(),
      page: null as any,
      shareUser: null as any,
      expiresAt: null,
    };
    set((state) => ({
      favorites: [stub, ...state.favorites.filter(f => f.shareCode !== shareCode)],
    }));
    favoriteApi.add(shareCode).catch(() => {
      set((state) => ({
        favorites: state.favorites.filter(f => f.shareCode !== shareCode),
      }));
    });
  },

  removeFavorite: (shareCode: string) => {
    const prev = get().favorites;
    set((state) => ({
      favorites: state.favorites.filter(f => f.shareCode !== shareCode),
    }));
    favoriteApi.remove(shareCode).catch(() => {
      set({ favorites: prev });
    });
  },

  isFavorited: (shareCode: string) => {
    return get().favorites.some(f => f.shareCode === shareCode);
  },
}));
