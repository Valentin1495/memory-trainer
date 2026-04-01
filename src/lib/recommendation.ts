import type { UserProfile, SessionRecord, RecommendedTraining } from '../types/training';
import type { Difficulty } from '../types';

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard'];

function getDifficultyLevel(d: Difficulty): number {
  return DIFFICULTY_ORDER.indexOf(d);
}

function lowerDifficulty(d: Difficulty): Difficulty {
  const idx = getDifficultyLevel(d);
  return DIFFICULTY_ORDER[Math.max(0, idx - 1)];
}

function higherDifficulty(d: Difficulty): Difficulty {
  const idx = getDifficultyLevel(d);
  return DIFFICULTY_ORDER[Math.min(DIFFICULTY_ORDER.length - 1, idx + 1)];
}

function todayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function nDaysAgoStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getRecommendedTraining(
  profile: UserProfile,
  history: SessionRecord[]
): RecommendedTraining {
  const today = todayStr();
  const cutoff7 = nDaysAgoStr(7);

  const recent = history
    .filter(s => s.completedAt.slice(0, 10) >= cutoff7 && !s.metadata.isDiagnosis)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));

  const todaySessions = recent.filter(s => s.completedAt.slice(0, 10) === today);

  // 오늘 아직 훈련을 안 한 경우
  if (todaySessions.length === 0) {
    return {
      moduleId: profile.lastModuleId || 'word-memory',
      difficulty: profile.currentDifficulty,
      reason: '오늘의 첫 번째 훈련을 시작하세요',
      suggestDifficultyChange: null,
    };
  }

  const last2 = recent.slice(0, 2);
  const last3 = recent.slice(0, 3);

  // 2회 연속 정확도 70% 미만 → 난이도 하향
  if (last2.length >= 2 && last2.every(s => s.accuracy < 0.7)) {
    const lower = lowerDifficulty(profile.currentDifficulty);
    const isAlreadyLowest = lower === profile.currentDifficulty;
    return {
      moduleId: profile.lastModuleId || 'word-memory',
      difficulty: lower,
      reason: isAlreadyLowest
        ? '조금 더 연습하면 실력이 늘어요!'
        : '난이도를 낮춰서 정확도를 높여보세요',
      suggestDifficultyChange: isAlreadyLowest ? null : 'down',
    };
  }

  // 3회 연속 정확도 90% 이상 → 난이도 상향
  if (last3.length >= 3 && last3.every(s => s.accuracy >= 0.9)) {
    const higher = higherDifficulty(profile.currentDifficulty);
    const isAlreadyHighest = higher === profile.currentDifficulty;
    return {
      moduleId: profile.lastModuleId || 'word-memory',
      difficulty: higher,
      reason: isAlreadyHighest
        ? '최고 난이도를 완벽히 수행하고 있어요!'
        : '실력이 늘었어요! 더 어려운 단계에 도전해 보세요',
      suggestDifficultyChange: isAlreadyHighest ? null : 'up',
    };
  }

  // 기본: 현재 난이도 유지
  const avgAccuracy = recent.length > 0
    ? recent.reduce((sum, s) => sum + s.accuracy, 0) / recent.length
    : 0;

  let reason = '꾸준히 훈련 중이에요. 오늘도 도전해 보세요!';
  if (avgAccuracy >= 0.8) reason = '좋은 흐름이에요! 계속 유지해 보세요';
  else if (avgAccuracy < 0.6) reason = '집중해서 훈련해 보세요';

  return {
    moduleId: profile.lastModuleId || 'word-memory',
    difficulty: profile.currentDifficulty,
    reason,
    suggestDifficultyChange: null,
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
  sessions.forEach(s => {
    (s.metadata.missedWords ?? []).forEach((w) => {
      missedCount[w] = (missedCount[w] ?? 0) + 1;
    });
  });
  return Object.entries(missedCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

export function getFeedbackMessage(accuracy: number, wrongCount: number, reviewCount: number): string {
  if (accuracy >= 0.9 && wrongCount === 0 && reviewCount === 0) {
    return '완벽해요! 집중력이 훌륭합니다 🎯';
  }
  if (accuracy >= 0.8) {
    return '잘 했어요! 조금만 더 집중하면 완벽합니다';
  }
  if (accuracy >= 0.6) {
    return '괜찮아요. 반복 훈련으로 기억력을 높여보세요';
  }
  if (reviewCount > 1) {
    return '다시 보기를 줄이면 점수가 올라가요';
  }
  return '꾸준한 훈련이 실력을 만들어요. 다시 도전해 보세요!';
}
