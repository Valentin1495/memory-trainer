import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
  adRemoved: boolean;
  setAdRemoved: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      adRemoved: false,
      setAdRemoved: (value) => set({ adRemoved: value }),
    }),
    { name: 'mc-settings' }
  )
);
