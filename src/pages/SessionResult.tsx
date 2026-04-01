import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useGameStore } from '../store/gameStore';
import { useUserProfileStore } from '../store/userProfileStore';
import { useRecommendation } from '../hooks/useRecommendation';
import { DIFFICULTY_CONFIG } from '../types';
import { getFeedbackMessage } from '../lib/recommendation';
import { showInterstitialAd } from '../lib/admob';
import type { TrainingSessionResult } from '../types/training';

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: '🟢 EASY',
  medium: '🟡 MEDIUM',
  hard: '🔴 HARD',
};

export function SessionResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const result = location.state?.result as TrainingSessionResult | undefined;

  const store = useGameStore();
  const { updateDifficulty } = useUserProfileStore();
  const recommendation = useRecommendation();
  const { submitScore } = useLeaderboard({ period: 'daily' });

  const [adLoading, setAdLoading] = useState(false);
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [difficultyAccepted, setDifficultyAccepted] = useState(false);
  const hasSubmitted = useRef(false);

  // result가 없으면 store에서 직접 계산 (기존 /result 경로 호환)
  const score = result?.score ?? store.getScore();
  const accuracy = result?.accuracy ?? 0;
  const timeMs = result?.timeMs ?? (store.startTime && store.endTime ? store.endTime - store.startTime : 0);
  const difficulty = result?.difficulty ?? store.difficulty;
  const mode = (result?.metadata?.mode as string) ?? store.mode;
  const wrongCount = (result?.metadata?.wrongCount as number) ?? store.wrongCount;
  const reviewCount = (result?.metadata?.reviewCount as number) ?? store.reviewCount;
  const missedWords = (result?.metadata?.missedWords as string[]) ?? store.missedWordsSnapshot.map(w => w.word);
  const categoryName = (result?.metadata?.categoryName as string) ?? store.category?.name ?? '';
  const isSuccess = store.isSuccess;

  const feedback = getFeedbackMessage(accuracy, wrongCount, reviewCount);
  const suggestChange = recommendation.suggestDifficultyChange;

  useEffect(() => {
    if (!result && !store.endTime) {
      navigate('/');
      return;
    }
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;

    setSubmitState('submitting');
    submitScore(
      store.nickname,
      score,
      timeMs,
      wrongCount,
      store.mode,
      difficulty
    ).then(ok => setSubmitState(ok ? 'done' : 'error'));
  }, []);

  const handlePlayAgain = async () => {
    setAdLoading(true);
    await showInterstitialAd();
    setAdLoading(false);
    store.resetGame();
    store.startGame();
    navigate(`/training/${result?.moduleId ?? 'word-memory'}`);
  };

  const handleAcceptDifficulty = () => {
    if (suggestChange && recommendation.difficulty !== difficulty) {
      updateDifficulty(recommendation.difficulty);
    }
    setDifficultyAccepted(true);
    store.resetGame();
    store.startGame();
    navigate(`/training/${result?.moduleId ?? 'word-memory'}`);
  };

  const handleGoHome = () => {
    store.resetGame();
    navigate('/');
  };

  const handleGoLeaderboard = async () => {
    setAdLoading(true);
    await showInterstitialAd();
    setAdLoading(false);
    navigate('/leaderboard');
  };

  const formatTime = (ms: number) => `${(ms / 1000).toFixed(1)}초`;

  return (
    <div className="h-screen overflow-y-auto safe-top safe-bottom">
      <div className="min-h-full flex flex-col items-center justify-center px-4 py-8">
        <div className="flex flex-col items-center w-full max-w-sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-6 w-full shadow-2xl"
          >
            {/* 성공/실패 + 점수 */}
            <div className="text-center mb-5">
              <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold mb-3 ${
                isSuccess !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
              }`}>
                <span>{isSuccess !== false ? '✅' : '❌'}</span>
                <span>{isSuccess !== false ? '성공!' : '실패'}</span>
              </div>
              <p className="text-xs text-gray-400 mb-1">이번 훈련 결과</p>
              <p className="text-5xl font-bold text-purple-600">{score.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">정확도 {Math.round(accuracy * 100)}%</p>
            </div>

            {/* 피드백 문구 */}
            <div className="bg-purple-50 rounded-xl px-4 py-3 mb-4">
              <p className="text-sm text-purple-700 font-medium text-center">{feedback}</p>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">훈련 방식</p>
                <p className="text-sm font-semibold text-gray-800">
                  {mode === 'basic' ? '기본' : '리버스'}
                  {mode === 'reverse' && (
                    <span className="text-purple-500 text-xs ml-1">×{DIFFICULTY_CONFIG[difficulty].reverseMultiplier}</span>
                  )}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">난이도</p>
                <p className="text-sm font-semibold text-gray-800">{DIFFICULTY_LABEL[difficulty]}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">시간</p>
                <p className="text-sm font-semibold text-gray-800">{formatTime(timeMs)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">오답</p>
                <p className="text-sm font-semibold text-red-500">{wrongCount}회</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">다시보기</p>
                <p className={`text-sm font-semibold ${reviewCount > 0 ? 'text-amber-500' : 'text-gray-400'}`}>
                  {reviewCount}회
                </p>
              </div>
            </div>

            {/* 약점 분석 */}
            {missedWords.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">
                  놓친 단어 {missedWords.length > 0 && `(${missedWords.length}개)`}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {missedWords.map((word, i) => (
                    <span key={i} className="px-2.5 py-1 bg-red-50 text-red-500 text-xs font-medium rounded-full">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 카테고리 표시 */}
            {categoryName && (
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xs text-gray-400">카테고리</span>
                <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">{categoryName}</span>
              </div>
            )}

            {/* 난이도 변경 제안 */}
            {suggestChange && !difficultyAccepted && recommendation.difficulty !== difficulty && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 border-2 border-purple-200 rounded-xl p-4"
              >
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  {suggestChange === 'up' ? '🚀 다음 단계 도전' : '💡 난이도 조정'}
                </p>
                <p className="text-xs text-gray-500 mb-3">{recommendation.reason}</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleAcceptDifficulty}
                    className="flex-1 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg"
                  >
                    {recommendation.difficulty.toUpperCase()}로 시도
                  </button>
                  <button
                    onClick={() => setDifficultyAccepted(true)}
                    className="flex-1 py-2 border border-gray-200 text-gray-500 text-xs rounded-lg"
                  >
                    현재 유지
                  </button>
                </div>
              </motion.div>
            )}

            {submitState === 'error' && (
              <p className="text-center text-xs text-red-400 mb-3">점수 등록에 실패했습니다</p>
            )}

            {/* CTA 버튼 */}
            <div className="space-y-2.5">
              <motion.button
                onClick={handlePlayAgain}
                disabled={adLoading}
                whileHover={{ scale: adLoading ? 1 : 1.02 }}
                whileTap={{ scale: adLoading ? 1 : 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg disabled:opacity-60"
              >
                {adLoading ? '잠시만요...' : '같은 훈련 다시 하기'}
              </motion.button>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleGoHome}
                  disabled={adLoading}
                  className="py-3 border-2 border-purple-400 text-purple-600 font-semibold rounded-xl hover:bg-purple-50 text-sm disabled:opacity-60"
                >
                  대시보드
                </button>
                <button
                  onClick={handleGoLeaderboard}
                  disabled={adLoading}
                  className="py-3 border-2 border-gray-300 text-gray-500 font-semibold rounded-xl hover:bg-gray-50 text-sm disabled:opacity-60"
                >
                  리더보드
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
