import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
  adRemoved: boolean;
  adSkipTickets: number;
  reviewLastRequestedAt: string | null;
  reviewLastRequestedSessionCount: number;
  setAdRemoved: (value: boolean) => void;
  addAdSkipTickets: (count: number) => void;
  clearAdSkipTickets: () => void;
  useAdSkipTicket: () => boolean;
  markReviewRequested: (sessionCount: number) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      adRemoved: false,
      adSkipTickets: 0,
      reviewLastRequestedAt: null,
      reviewLastRequestedSessionCount: 0,
      setAdRemoved: (value) => set({ adRemoved: value }),
      addAdSkipTickets: (count) => set((state) => ({
        adSkipTickets: Math.max(0, state.adSkipTickets + Math.floor(count)),
      })),
      clearAdSkipTickets: () => set({ adSkipTickets: 0 }),
      useAdSkipTicket: () => {
        let used = false;
        set((state) => {
          if (state.adSkipTickets <= 0) return state;
          used = true;
          return { adSkipTickets: state.adSkipTickets - 1 };
        });
        return used;
      },
      markReviewRequested: (sessionCount) => set({
        reviewLastRequestedAt: new Date().toISOString(),
        reviewLastRequestedSessionCount: sessionCount,
      }),
    }),
    { name: 'mc-settings' }
  )
);
