import { useMemo } from 'react';
import { useUserProfileStore } from '../store/userProfileStore';
import { useHistoryStore } from '../store/historyStore';
import { getRecommendedTraining } from '../lib/recommendation';
import type { RecommendedTraining } from '../types/training';

export function useRecommendation(): RecommendedTraining {
  const profile = useUserProfileStore(s => s.profile);
  const sessions = useHistoryStore(s => s.sessions);

  return useMemo(() => {
    if (!profile) {
      return {
        moduleId: 'word-memory',
        difficulty: 'medium',
        reason: '오늘의 첫 훈련을 시작해보세요.',
        suggestDifficultyChange: null,
        profileLabel: '현재 수준: 중간',
        profileTone: 'balanced',
      };
    }
    return getRecommendedTraining(profile, sessions);
  }, [profile, sessions]);
}
