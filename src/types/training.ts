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
  diagnosisDeferred?: boolean;
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
    rawTrainingScore?: number;
    diagnosisScore?: number;
  };
}

export interface TrainingModuleProps {
  difficulty: Difficulty;
  mode?: string;
  skipReadyScreen?: boolean;
  isDiagnosis?: boolean;
  diagnosisLabel?: string;
  diagnosisColor?: string;
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
  profileLabel?: string;
  profileTone?: 'calm' | 'balanced' | 'challenging';
  goalLabel?: string;
}

export interface ModuleStat {
  moduleId: string;
  name: string;
  icon: string;
  sessions: number;
  avgScore: number;
  avgAccuracy: number;
}

export interface WeeklyStats {
  weekStart: string;
  totalSessions: number;
  avgScore: number;
  avgAccuracy: number;
  streakDays: number;
  dailyCounts: number[];
  dailyAvgScores: (number | null)[];
  dailyAccuracies: (number | null)[];
  moduleStats: ModuleStat[];
}
