import { motion } from 'framer-motion';
import type { RecommendedTraining } from '../../types/training';
import { getTrainingModule } from '../../training/registry';

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'EASY',
  medium: 'MEDIUM',
  hard: 'HARD',
};

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
};

const PROFILE_TONE_COLOR = {
  calm: 'bg-sky-50 text-sky-700 ring-sky-100',
  balanced: 'bg-slate-100 text-slate-700 ring-slate-200',
  challenging: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-100',
} as const;

interface TodayTrainingCardProps {
  recommendation: RecommendedTraining;
  todayCount: number;
  todayTimeMs: number;
  dailyGoalMinutes: number;
  onStart: () => void;
}

function formatElapsedTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) {
    return `${seconds}초`;
  }

  if (seconds === 0) {
    return `${minutes}분`;
  }

  return `${minutes}분 ${seconds}초`;
}

export function TodayTrainingCard({
  recommendation,
  todayCount,
  todayTimeMs,
  dailyGoalMinutes,
  onStart,
}: TodayTrainingCardProps) {
  const moduleDef = getTrainingModule(recommendation.moduleId);
  const moduleLabel = moduleDef
    ? `${moduleDef.icon} ${moduleDef.name} 훈련`
    : '단어 기억 훈련';
  const todayMinutes = todayTimeMs / 60000;
  const progress = dailyGoalMinutes > 0
    ? Math.min(100, Math.round((todayMinutes / dailyGoalMinutes) * 100))
    : 0;
  const todayTimeLabel = formatElapsedTime(todayTimeMs);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl bg-white p-5 shadow-lg"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-medium text-gray-400">오늘의 추천 훈련</p>
          <h3 className="text-lg font-bold text-gray-800">{moduleLabel}</h3>
          {(recommendation.profileLabel || recommendation.goalLabel) && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {recommendation.profileLabel && (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${
                    PROFILE_TONE_COLOR[recommendation.profileTone ?? 'balanced']
                  }`}
                >
                  {recommendation.profileLabel}
                </span>
              )}
              {recommendation.goalLabel && (
                <span className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-100">
                  목표: {recommendation.goalLabel}
                </span>
              )}
            </div>
          )}
          <p className="mt-2 text-sm text-gray-500">{recommendation.reason}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${DIFFICULTY_COLOR[recommendation.difficulty]}`}>
          {DIFFICULTY_LABEL[recommendation.difficulty]}
        </span>
      </div>

      <div className="mb-4 rounded-xl bg-slate-50 px-3.5 py-3">
        <div className="mb-1.5 flex items-center justify-between text-xs text-gray-500">
          <span>오늘 목표</span>
          <span>{todayTimeLabel} / {dailyGoalMinutes}분</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
          <span>{todayCount === 0 ? '아직 시작 전' : `오늘 ${todayCount}회 완료`}</span>
          <span>{progress}% 달성</span>
        </div>
      </div>

      <motion.button
        onClick={onStart}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3.5 font-bold text-white shadow-md"
      >
        {todayCount === 0 ? '추천 훈련 시작' : '추천 훈련 이어서 하기'}
      </motion.button>
    </motion.div>
  );
}
