import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SessionRecord, WeeklyStats } from '../types/training';
import { TRAINING_REGISTRY } from '../training/registry';

const MAX_SESSIONS = 500;
const MAX_DAYS = 90;

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function todayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function dateStrNDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function trimSessions(sessions: SessionRecord[]): SessionRecord[] {
  const cutoff = dateStrNDaysAgo(MAX_DAYS);
  const filtered = sessions.filter(s => s.completedAt.slice(0, 10) >= cutoff);
  if (filtered.length > MAX_SESSIONS) {
    return filtered.slice(filtered.length - MAX_SESSIONS);
  }
  return filtered;
}

interface HistoryStore {
  sessions: SessionRecord[];
  addSession: (record: Omit<SessionRecord, 'id'>) => SessionRecord;
  getRecentSessions: (days: number) => SessionRecord[];
  getTodaySessions: () => SessionRecord[];
  getStreakDays: () => number;
  getWeeklyStats: () => WeeklyStats;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set, get) => ({
      sessions: [],

      addSession: (record) => {
        const newSession: SessionRecord = { ...record, id: generateId() };
        set((state) => ({
          sessions: trimSessions([...state.sessions, newSession]),
        }));
        return newSession;
      },

      getRecentSessions: (days) => {
        const cutoff = dateStrNDaysAgo(days);
        return get().sessions.filter(s => s.completedAt.slice(0, 10) >= cutoff);
      },

      getTodaySessions: () => {
        const today = todayStr();
        return get().sessions.filter(s => s.completedAt.slice(0, 10) === today);
      },

      getStreakDays: () => {
        const sessions = get().sessions;
        if (sessions.length === 0) return 0;

        const days = new Set(sessions.map(s => s.completedAt.slice(0, 10)));
        let streak = 0;
        const today = new Date();

        for (let i = 0; i < 365; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          if (days.has(key)) {
            streak++;
          } else if (i > 0) {
            break;
          }
        }
        return streak;
      },

      getWeeklyStats: () => {
        const today = new Date();
        const dailyCounts: number[] = [];
        const dailyAvgScores: (number | null)[] = [];
        const dailyAccuracies: (number | null)[] = [];

        for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          const daySessions = get().sessions.filter(s => s.completedAt.slice(0, 10) === key);
          dailyCounts.push(daySessions.length);
          if (daySessions.length > 0) {
            dailyAvgScores.push(Math.round(daySessions.reduce((sum, s) => sum + s.score, 0) / daySessions.length));
            const avgAcc = daySessions.reduce((sum, s) => sum + s.accuracy, 0) / daySessions.length;
            dailyAccuracies.push(Math.round(avgAcc * 100) / 100);
          } else {
            dailyAvgScores.push(null);
            dailyAccuracies.push(null);
          }
        }

        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 6);
        const weekStartStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;

        const recent7 = get().getRecentSessions(7);
        const totalSessions = recent7.length;
        const avgScore = totalSessions > 0
          ? Math.round(recent7.reduce((sum, s) => sum + s.score, 0) / totalSessions)
          : 0;
        const avgAccuracy = totalSessions > 0
          ? Math.round((recent7.reduce((sum, s) => sum + s.accuracy, 0) / totalSessions) * 100) / 100
          : 0;

        const moduleStats = TRAINING_REGISTRY.map(def => {
          const modSessions = recent7.filter(s => s.moduleId === def.id);
          const count = modSessions.length;
          return {
            moduleId: def.id,
            name: def.name,
            icon: def.icon,
            sessions: count,
            avgScore: count > 0
              ? Math.round(modSessions.reduce((sum, s) => sum + s.score, 0) / count)
              : 0,
            avgAccuracy: count > 0
              ? Math.round((modSessions.reduce((sum, s) => sum + s.accuracy, 0) / count) * 100) / 100
              : 0,
          };
        }).filter(m => m.sessions > 0)
          .sort((a, b) => b.sessions - a.sessions);

        return {
          weekStart: weekStartStr,
          totalSessions,
          avgScore,
          avgAccuracy,
          streakDays: get().getStreakDays(),
          dailyCounts,
          dailyAvgScores,
          dailyAccuracies,
          moduleStats,
        };
      },

      clearHistory: () => set({ sessions: [] }),
    }),
    {
      name: 'mc-session-history',
    }
  )
);
