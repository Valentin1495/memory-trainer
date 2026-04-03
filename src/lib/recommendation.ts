import type { UserProfile, SessionRecord, RecommendedTraining } from '../types/training';
import type { Difficulty } from '../types';

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard'];
const GOAL_LABEL: Record<UserProfile['goal'], string> = {
  focus: '집중력',
  memory: '기억력',
  health: '두뇌 건강',
};
const GOAL_MODULES: Record<UserProfile['goal'], string[]> = {
  focus: ['color-sequence', 'number-sequence'],
  memory: ['shape-location', 'word-memory'],
  health: ['path-memory', 'shape-location'],
};

export interface UserLevelSummary {
  label: string;
  shortLabel: string;
  description: string;
  tone: 'calm' | 'balanced' | 'challenging';
}

function getDifficultyLevel(difficulty: Difficulty): number {
  return DIFFICULTY_ORDER.indexOf(difficulty);
}

function lowerDifficulty(difficulty: Difficulty): Difficulty {
  const idx = getDifficultyLevel(difficulty);
  return DIFFICULTY_ORDER[Math.max(0, idx - 1)];
}

function higherDifficulty(difficulty: Difficulty): Difficulty {
  const idx = getDifficultyLevel(difficulty);
  return DIFFICULTY_ORDER[Math.min(DIFFICULTY_ORDER.length - 1, idx + 1)];
}

function getBaselineBand(score: number): 'low' | 'mid' | 'high' {
  if (score >= 720) return 'high';
  if (score >= 460) return 'mid';
  return 'low';
}

function getFirstTrainingModule(goal: UserProfile['goal']): string {
  return GOAL_MODULES[goal][0];
}

function getGoalWeightedModule(goal: UserProfile['goal'], recent: SessionRecord[], fallback?: string): string {
  const preferredModules = GOAL_MODULES[goal];

  if (fallback && preferredModules.includes(fallback)) {
    return fallback;
  }

  const latestGoalSession = recent.find(session => preferredModules.includes(session.moduleId));
  if (latestGoalSession) {
    return latestGoalSession.moduleId;
  }

  return preferredModules[0] ?? fallback ?? 'word-memory';
}

export function getUserLevelSummary(score: number): UserLevelSummary {
  const band = getBaselineBand(score);

  if (band === 'high') {
    return {
      label: '현재 수준: 상위',
      shortLabel: '상위',
      description: '빠른 적응과 높은 정확도를 안정적으로 유지하고 있어요.',
      tone: 'challenging',
    };
  }

  if (band === 'low') {
    return {
      label: '현재 수준: 기초',
      shortLabel: '기초',
      description: '무리하지 않고 정확도를 먼저 쌓아가면 좋아요.',
      tone: 'calm',
    };
  }

  return {
    label: '현재 수준: 중간',
    shortLabel: '중간',
    description: '기초와 도전의 균형이 잘 맞는 안정적인 단계예요.',
    tone: 'balanced',
  };
}

function getProfilePresentation(score: number): Pick<RecommendedTraining, 'profileLabel' | 'profileTone'> {
  const level = getUserLevelSummary(score);
  return {
    profileLabel: level.label,
    profileTone: level.tone,
  };
}

function todayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function nDaysAgoStr(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getRecommendedTraining(
  profile: UserProfile,
  history: SessionRecord[]
): RecommendedTraining {
  const today = todayStr();
  const cutoff7 = nDaysAgoStr(7);
  const baselineBand = getBaselineBand(profile.baselineScore);
  const profilePresentation = getProfilePresentation(profile.baselineScore);
  const goalLabel = GOAL_LABEL[profile.goal];
  const downThreshold = baselineBand === 'low' ? 0.72 : baselineBand === 'high' ? 0.65 : 0.7;
  const upThreshold = baselineBand === 'high' ? 0.88 : baselineBand === 'low' ? 0.94 : 0.9;

  const recent = history
    .filter(session => session.completedAt.slice(0, 10) >= cutoff7 && !session.metadata.isDiagnosis)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));

  const todaySessions = recent.filter(session => session.completedAt.slice(0, 10) === today);
  const weightedModuleId = getGoalWeightedModule(profile.goal, recent, profile.lastModuleId || recent[0]?.moduleId);

  if (recent.length === 0) {
    const firstModuleId = profile.diagnosisComplete
      ? getFirstTrainingModule(profile.goal)
      : (profile.lastModuleId || 'word-memory');

    return {
      moduleId: firstModuleId,
      difficulty: profile.currentDifficulty,
      reason: profile.diagnosisComplete
        ? `${goalLabel} 목표에 맞춰 첫 훈련을 추천할게요.`
        : '첫 훈련을 시작해볼까요?',
      suggestDifficultyChange: null,
      goalLabel,
      ...profilePresentation,
    };
  }

  if (todaySessions.length === 0) {
    const reason =
      baselineBand === 'high'
        ? `${goalLabel} 목표에 맞춰 오늘은 조금 더 선명한 훈련으로 시작해볼게요.`
        : baselineBand === 'low'
          ? `${goalLabel} 목표를 부담 없이 쌓을 수 있도록 안정적인 훈련을 골랐어요.`
          : `${goalLabel} 목표에 맞는 훈련을 현재 수준에 맞춰 추천할게요.`;

    return {
      moduleId: weightedModuleId,
      difficulty: profile.currentDifficulty,
      reason,
      suggestDifficultyChange: null,
      goalLabel,
      ...profilePresentation,
    };
  }

  const last2 = recent.slice(0, 2);
  const last3 = recent.slice(0, 3);

  if (last2.length >= 2 && last2.every(session => session.accuracy < downThreshold)) {
    const loweredDifficulty = lowerDifficulty(profile.currentDifficulty);
    const isAlreadyLowest = loweredDifficulty === profile.currentDifficulty;

    return {
      moduleId: weightedModuleId,
      difficulty: loweredDifficulty,
      reason: isAlreadyLowest
        ? `${goalLabel} 목표는 유지하되 지금 난이도에서 정확도를 먼저 회복해볼게요.`
        : `${goalLabel} 목표를 이어가면서도 성공 경험을 쌓을 수 있게 난이도를 조금 낮췄어요.`,
      suggestDifficultyChange: isAlreadyLowest ? null : 'down',
      goalLabel,
      profileLabel: '현재 수준 조정 중',
      profileTone: 'calm',
    };
  }

  if (last3.length >= 3 && last3.every(session => session.accuracy >= upThreshold)) {
    const raisedDifficulty = higherDifficulty(profile.currentDifficulty);
    const isAlreadyHighest = raisedDifficulty === profile.currentDifficulty;

    return {
      moduleId: weightedModuleId,
      difficulty: raisedDifficulty,
      reason: isAlreadyHighest
        ? `${goalLabel} 목표 훈련을 최고 난이도에서도 안정적으로 이어가고 있어요.`
        : `${goalLabel} 목표에서 좋은 흐름이 이어져서 난이도를 한 단계 올려도 괜찮아 보여요.`,
      suggestDifficultyChange: isAlreadyHighest ? null : 'up',
      goalLabel,
      profileLabel: '현재 수준 상승 중',
      profileTone: 'challenging',
    };
  }

  const avgAccuracy = recent.length > 0
    ? recent.reduce((sum, session) => sum + session.accuracy, 0) / recent.length
    : 0;

  let reason = `${goalLabel} 목표에 맞는 훈련을 꾸준히 이어가볼게요.`;

  if (avgAccuracy >= 0.8) {
    reason = `${goalLabel} 목표에서 좋은 흐름을 유지하고 있어요. 지금 페이스를 이어가면 좋아요.`;
  } else if (avgAccuracy < 0.6) {
    reason = `${goalLabel} 목표는 유지하되, 정확도를 먼저 회복할 수 있는 훈련을 추천할게요.`;
  }

  return {
    moduleId: weightedModuleId,
    difficulty: profile.currentDifficulty,
    reason,
    suggestDifficultyChange: null,
    goalLabel,
    ...profilePresentation,
  };
}

export function calculateBaselineDifficulty(
  easyScore: number,
  mediumScore: number,
  hardScore: number
): Difficulty {
  if (hardScore >= 780) return 'hard';
  if (mediumScore >= 620) return 'medium';
  if (easyScore >= 380) return 'easy';
  return 'easy';
}

export function calculateDiagnosisStepScore(
  difficulty: Difficulty,
  accuracy: number,
  timeMs: number,
  wrongCount: number,
  reviewCount: number
): number {
  const difficultyBonus = difficulty === 'easy' ? 0 : difficulty === 'medium' ? 110 : 220;
  const completionBonus = accuracy >= 1 ? 120 : accuracy >= 0.8 ? 80 : accuracy >= 0.6 ? 40 : 0;
  const accuracyPoints = Math.round(accuracy * 700);
  const timePenalty = Math.min(120, Math.floor(timeMs / 1000) * 4);
  const wrongPenalty = wrongCount * 35;
  const reviewPenalty = reviewCount * 50;

  return Math.max(
    0,
    accuracyPoints + difficultyBonus + completionBonus - timePenalty - wrongPenalty - reviewPenalty
  );
}

export function getWeakWords(sessions: SessionRecord[], limit = 5): string[] {
  const missedCount: Record<string, number> = {};

  sessions.forEach(session => {
    (session.metadata.missedWords ?? []).forEach(word => {
      missedCount[word] = (missedCount[word] ?? 0) + 1;
    });
  });

  return Object.entries(missedCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

export function getFeedbackMessage(accuracy: number, wrongCount: number, reviewCount: number): string {
  if (accuracy >= 0.9 && wrongCount === 0 && reviewCount === 0) {
    return '훌륭해요! 집중력이 아주 안정적이었어요.';
  }

  if (accuracy >= 0.8) {
    return '좋아요. 조금만 더 집중하면 더 높은 점수도 가능해요.';
  }

  if (accuracy >= 0.6) {
    return '괜찮아요. 반복 훈련으로 기억력을 더 끌어올려볼 수 있어요.';
  }

  if (reviewCount > 1) {
    return '다시 보기 횟수를 줄이면 점수가 더 빠르게 올라갈 수 있어요.';
  }

  return '천천히 해도 괜찮아요. 다음 시도에서 더 좋아질 수 있어요.';
}
