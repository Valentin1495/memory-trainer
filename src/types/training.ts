import type { Difficulty } from './index';

export type TrainingGoal = 'focus' | 'memory' | 'health';

export interface UserProfile {
  userId: string;
  nickname: string;
  goal: TrainingGoal;
  dailyGoalMinutes: number;
  currentDifficulty: Difficulty;
  lastModuleId: string;
  onboardingComplete: boolean;
  diagnosisComplete: boolean;
  baselineScore: number;
  createdAt: string;
}

export interface SessionRecord {
  id: string;
  moduleId: string;
  score: number;
  accuracy: number;
  timeMs: number;
  difficulty: Difficulty;
  completedAt: string;
  metadata: {
    missedWords?: string[];
    wrongCount?: number;
    reviewCount?: number;
    categoryName?: string;
    mode?: string;
    isDiagnosis?: boolean;
  };
}

export interface TrainingModuleProps {
  difficulty: Difficulty;
  mode?: string;
  onComplete: (result: TrainingSessionResult) => void;
  onExit: () => void;
}

export interface TrainingSessionResult {
  moduleId: string;
  score: number;
  accuracy: number;
  timeMs: number;
  difficulty: Difficulty;
  metadata: Record<string, unknown>;
  completedAt: string;
}

export interface TrainingModuleDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  supportedDifficulties: Difficulty[];
  component: React.ComponentType<TrainingModuleProps>;
}

export interface RecommendedTraining {
  moduleId: string;
  difficulty: Difficulty;
  reason: string;
  suggestDifficultyChange: 'up' | 'down' | null;
}

export interface WeeklyStats {
  weekStart: string;
  totalSessions: number;
  avgScore: number;
  avgAccuracy: number;
  weakWords: string[];
  streakDays: number;
  dailyCounts: number[];
  dailyAvgScores: (number | null)[];
}
