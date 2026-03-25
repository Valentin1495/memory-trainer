import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, TrainingGoal } from '../types/training';
import type { Difficulty } from '../types';

interface UserProfileStore {
  profile: UserProfile | null;
  isOnboarded: boolean;
  isDiagnosed: boolean;
  setProfile: (profile: UserProfile) => void;
  updateDifficulty: (difficulty: Difficulty) => void;
  updateLastModule: (moduleId: string) => void;
  updateGoal: (goal: TrainingGoal) => void;
  updateDailyGoal: (minutes: number) => void;
  completeDiagnosis: (baselineScore: number, difficulty: Difficulty) => void;
  resetProfile: () => void;
}

export const useUserProfileStore = create<UserProfileStore>()(
  persist(
    (set, get) => ({
      profile: null,
      isOnboarded: false,
      isDiagnosed: false,

      setProfile: (profile) => set({
        profile,
        isOnboarded: profile.onboardingComplete,
        isDiagnosed: profile.diagnosisComplete,
      }),

      updateDifficulty: (difficulty) => {
        const { profile } = get();
        if (!profile) return;
        set({ profile: { ...profile, currentDifficulty: difficulty } });
      },

      updateLastModule: (moduleId) => {
        const { profile } = get();
        if (!profile) return;
        set({ profile: { ...profile, lastModuleId: moduleId } });
      },

      updateGoal: (goal) => {
        const { profile } = get();
        if (!profile) return;
        set({ profile: { ...profile, goal } });
      },

      updateDailyGoal: (dailyGoalMinutes) => {
        const { profile } = get();
        if (!profile) return;
        set({ profile: { ...profile, dailyGoalMinutes } });
      },

      completeDiagnosis: (baselineScore, difficulty) => {
        const { profile } = get();
        if (!profile) return;
        const updated = {
          ...profile,
          diagnosisComplete: true,
          baselineScore,
          currentDifficulty: difficulty,
        };
        set({ profile: updated, isDiagnosed: true });
      },

      resetProfile: () => set({ profile: null, isOnboarded: false, isDiagnosed: false }),
    }),
    {
      name: 'mc-user-profile',
    }
  )
);
