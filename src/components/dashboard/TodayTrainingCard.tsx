import { motion } from 'framer-motion';
import type { RecommendedTraining } from '../../types/training';

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

interface TodayTrainingCardProps {
  recommendation: RecommendedTraining;
  todayCount: number;
  onStart: () => void;
}

export function TodayTrainingCard({ recommendation, todayCount, onStart }: TodayTrainingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-white rounded-2xl p-5 shadow-lg"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-gray-400 font-medium mb-1">오늘의 추천 훈련</p>
          <h3 className="text-lg font-bold text-gray-800">📝 단어 기억 훈련</h3>
          <p className="text-sm text-gray-500 mt-0.5">{recommendation.reason}</p>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${DIFFICULTY_COLOR[recommendation.difficulty]}`}>
          {DIFFICULTY_LABEL[recommendation.difficulty]}
        </span>
      </div>

      {todayCount > 0 && (
        <div className="flex items-center gap-1.5 mb-4 text-xs text-gray-400">
          <span className="text-green-500">✓</span>
          <span>오늘 {todayCount}회 완료</span>
        </div>
      )}

      <motion.button
        onClick={onStart}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-md"
      >
        {todayCount === 0 ? '추천 훈련 시작' : '추천 훈련 이어서 하기'}
      </motion.button>
    </motion.div>
  );
}
