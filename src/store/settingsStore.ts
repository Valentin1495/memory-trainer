import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
  adRemoved: boolean;
  reviewLastRequestedAt: string | null;
  reviewLastRequestedSessionCount: number;
  setAdRemoved: (value: boolean) => void;
  markReviewRequested: (sessionCount: number) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      adRemoved: false,
      reviewLastRequestedAt: null,
      reviewLastRequestedSessionCount: 0,
      setAdRemoved: (value) => set({ adRemoved: value }),
      markReviewRequested: (sessionCount) => set({
        reviewLastRequestedAt: new Date().toISOString(),
        reviewLastRequestedSessionCount: sessionCount,
      }),
    }),
    { name: 'mc-settings' }
  )
);
