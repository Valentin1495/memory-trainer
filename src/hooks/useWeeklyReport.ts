import { useMemo } from 'react';
import { useHistoryStore } from '../store/historyStore';
import type { WeeklyStats } from '../types/training';

export function useWeeklyReport(): WeeklyStats {
  const getWeeklyStats = useHistoryStore(s => s.getWeeklyStats);
  const sessions = useHistoryStore(s => s.sessions);

  return useMemo(() => getWeeklyStats(), [sessions, getWeeklyStats]);
}
