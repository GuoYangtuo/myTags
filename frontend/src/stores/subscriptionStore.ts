import { create } from 'zustand';
import { subscriptionApi, type SubscriptionStatus } from '../api/subscription';

interface SubscriptionState {
  status: SubscriptionStatus | null;
  loading: boolean;
  error: string | null;
  fetchStatus: () => Promise<void>;
  refreshUser: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  status: null,
  loading: false,
  error: null,

  fetchStatus: async () => {
    set({ loading: true, error: null });
    try {
      const status = await subscriptionApi.getStatus();
      set({ status, loading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取会员状态失败';
      set({ error: message, loading: false });
    }
  },

  // Call this after a successful payment to refresh user VIP state
  refreshUser: () => {
    get().fetchStatus();
  },
}));
