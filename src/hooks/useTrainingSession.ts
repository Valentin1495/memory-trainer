import { useCallback } from 'react';
import { useHistoryStore } from '../store/historyStore';
import { useUserProfileStore } from '../store/userProfileStore';
import type { TrainingSessionResult } from '../types/training';

export function useTrainingSession() {
  const addSession = useHistoryStore(s => s.addSession);
  const updateLastModule = useUserProfileStore(s => s.updateLastModule);

  const saveSession = useCallback((result: TrainingSessionResult) => {
    const record = addSession({
      moduleId: result.moduleId,
      score: result.score,
      accuracy: result.accuracy,
      timeMs: result.timeMs,
      difficulty: result.difficulty,
      completedAt: result.completedAt,
      metadata: result.metadata,
    });
    updateLastModule(result.moduleId);
    return record;
  }, [addSession, updateLastModule]);

  return { saveSession };
}
