import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useRecommendation } from '../hooks/useRecommendation';
import { getFeedbackMessage } from '../lib/recommendation';
import { showInterstitialAdThrottled } from '../lib/ads';
import { useGameStore } from '../store/gameStore';
import { useUserProfileStore } from '../store/userProfileStore';
import { DIFFICULTY_CONFIG } from '../types';
import type { TrainingSessionResult } from '../types/training';

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: '쉬움',
  medium: '보통',
  hard: '어려움',
};



export function SessionResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const result = location.state?.result as TrainingSessionResult | undefined;

  const store = useGameStore();
  const { updateDifficulty } = useUserProfileStore();
  const recommendation = useRecommendation();
  const { submitScore, submitError } = useLeaderboard({ period: 'daily' });

  const [adLoading, setAdLoading] = useState(false);
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [difficultyAccepted, setDifficultyAccepted] = useState(false);
  const hasSubmitted = useRef(false);

  const moduleId = result?.moduleId ?? 'word-memory';
  const isWordModule = moduleId === 'word-memory';

  const score = result?.score ?? store.getScore();
  const accuracy = result?.accuracy ?? 0;
  const timeMs = result?.timeMs ?? (store.startTime && store.endTime ? store.endTime - store.startTime : 0);
  const difficulty = result?.difficulty ?? store.difficulty;
  const mode = (result?.metadata?.mode as string | undefined) ?? (isWordModule ? store.mode : undefined);
  const wrongCount = (result?.metadata?.wrongCount as number | undefined) ?? (isWordModule ? store.wrongCount : 0);
  const reviewCount = (result?.metadata?.reviewCount as number | undefined) ?? (isWordModule ? store.reviewCount : 0);
  const missedWords = (result?.metadata?.missedWords as string[] | undefined) ?? (isWordModule ? store.missedWordsSnapshot.map((w) => w.word) : []);
  const categoryName = (result?.metadata?.categoryName as string | undefined) ?? (isWordModule ? (store.category?.name ?? '') : '');
  const isSuccess = (result?.metadata?.isSuccess as boolean | undefined) ?? store.isSuccess ?? accuracy >= 1;
  const sequenceLength = result?.metadata?.sequenceLength as number | undefined;
  const correctCount = result?.metadata?.correctCount as number | undefined;

  const feedback = getFeedbackMessage(accuracy, wrongCount, reviewCount);
  const suggestChange = recommendation.suggestDifficultyChange;
  const derivedCorrectCount = correctCount ?? (sequenceLength ? Math.round(accuracy * sequenceLength) : null);
  const numberSequenceLength = result?.metadata?.sequenceLength as number | undefined;
  const numberCorrectCount = numberSequenceLength ? Math.round(accuracy * numberSequenceLength) : undefined;
  const pathLength = result?.metadata?.pathLength as number | undefined;
  const correctSteps = result?.metadata?.correctSteps as number | undefined;
  const shapeCount = result?.metadata?.shapeCount as number | undefined;
  const correctHits = result?.metadata?.correctHits as number | undefined;

  const nonWordSummary = (() => {
    switch (moduleId) {
      case 'color-sequence':
        return {
          label: '정답',
          value: derivedCorrectCount !== null && sequenceLength ? `${derivedCorrectCount}/${sequenceLength}` : '-',
        };
      case 'number-sequence':
        return {
          label: '정답',
          value: typeof numberCorrectCount === 'number' && numberSequenceLength
            ? `${numberCorrectCount}/${numberSequenceLength}`
            : '-',
        };
      case 'path-memory':
        return {
          label: '정답',
          value: typeof correctSteps === 'number' && pathLength ? `${correctSteps}/${pathLength}` : '-',
        };
      case 'shape-location':
        return {
          label: '정답',
          value: typeof correctHits === 'number' && shapeCount ? `${correctHits}/${shapeCount}` : '-',
        };
      default:
        return {
          label: '정확도',
          value: `${Math.round(accuracy * 100)}%`,
        };
    }
  })();

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
      mode === 'reverse' ? 'reverse' : 'basic',
      difficulty,
      result
    ).then((ok) => setSubmitState(ok ? 'done' : 'error'));
  }, [difficulty, mode, navigate, result, score, store.endTime, store.nickname, submitScore, timeMs, wrongCount]);

  const handlePlayAgain = async () => {
    setAdLoading(true);
    await showInterstitialAdThrottled();
    setAdLoading(false);

    if (isWordModule) {
      store.resetGame();
      store.startGame();
    }

    navigate(`/training/${moduleId}`);
  };

  const handleAcceptDifficulty = () => {
    if (suggestChange && recommendation.difficulty !== difficulty) {
      store.setDifficulty(recommendation.difficulty);
      updateDifficulty(recommendation.difficulty);
    }

    setDifficultyAccepted(true);

    if (isWordModule) {
      store.resetGame();
      store.startGame();
    }

    navigate(`/training/${moduleId}`);
  };

  const handleGoHome = () => {
    if (isWordModule) {
      store.resetGame();
    }

    navigate('/');
  };

  const handleGoLeaderboard = async () => {
    setAdLoading(true);
    await showInterstitialAdThrottled();
    setAdLoading(false);
    navigate('/leaderboard', { state: { moduleId } });
  };

  const formatTime = (ms: number) => `${(ms / 1000).toFixed(1)}초`;

  return (
    <div className="h-screen overflow-y-auto safe-top safe-bottom">
      <div className="min-h-full flex flex-col items-center justify-center px-4 py-8">
        <div className="flex w-full max-w-sm flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-5 text-center">
              <div className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold ${
                isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
              }`}>
                <span>{isSuccess ? '성공' : '실패'}</span>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-400">정확도</p>
              <p className="mt-1 text-5xl font-bold text-purple-600">{Math.round(accuracy * 100)}%</p>
              <div className="mt-3 inline-flex items-baseline gap-2 rounded-full bg-purple-50 px-4 py-2">
                <span className="text-xs font-semibold tracking-[0.18em] text-purple-400">점수</span>
                <span className="text-2xl font-bold text-purple-700">{score.toLocaleString()}</span>
              </div>
            </div>

            <div className="mb-4 rounded-xl bg-purple-50 px-4 py-3">
              <p className="text-center text-sm font-medium text-purple-700">{feedback}</p>
            </div>

            <div className={`mb-3 grid gap-2 ${isWordModule ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {isWordModule && (
                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <p className="mb-1 text-xs text-gray-400">모드</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {mode === 'reverse' ? '리버스' : '기본'}
                    {mode === 'reverse' && (
                      <span className="ml-1 text-xs text-purple-500">x{DIFFICULTY_CONFIG[difficulty].reverseMultiplier}</span>
                    )}
                  </p>
                </div>
              )}
              <div className="rounded-xl bg-gray-50 p-3 text-center">
                <p className="mb-1 text-xs text-gray-400">{isWordModule ? '난이도' : '적용 난이도'}</p>
                <p className="text-sm font-semibold text-gray-800">{DIFFICULTY_LABEL[difficulty]}</p>
              </div>
              {!isWordModule && (
                <>
                  <div className="rounded-xl bg-gray-50 p-3 text-center">
                    <p className="mb-1 text-xs text-gray-400">시간</p>
                    <p className="text-sm font-semibold text-gray-800">{formatTime(timeMs)}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3 text-center">
                    <p className="mb-1 text-xs text-gray-400">{nonWordSummary.label}</p>
                    <p className="text-sm font-semibold text-emerald-600">{nonWordSummary.value}</p>
                  </div>
                </>
              )}
            </div>

            {isWordModule ? (
              <div className="mb-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <p className="mb-1 text-xs text-gray-400">시간</p>
                  <p className="text-sm font-semibold text-gray-800">{formatTime(timeMs)}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <p className="mb-1 text-xs text-gray-400">오답</p>
                  <p className="text-sm font-semibold text-red-500">{wrongCount}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <p className="mb-1 text-xs text-gray-400">다시 보기</p>
                  <p className={`text-sm font-semibold ${reviewCount > 0 ? 'text-amber-500' : 'text-gray-400'}`}>
                    {reviewCount}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <p className="mb-1 text-xs text-gray-400">카테고리</p>
                  <p className="truncate text-sm font-semibold text-gray-800">{categoryName || '-'}</p>
                </div>
              </div>
            ) : null}


            {isWordModule && missedWords.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold text-gray-500">놓친 단어 ({missedWords.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {missedWords.map((word, i) => (
                    <span key={i} className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-500">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {suggestChange && !difficultyAccepted && recommendation.difficulty !== difficulty && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 rounded-xl border-2 border-purple-200 p-4"
              >
                <p className="mb-1 text-sm font-semibold text-gray-700">
                  {suggestChange === 'up' ? '난이도를 올려볼까요?' : '난이도를 조금 낮춰볼까요?'}
                </p>
                <p className="mb-3 text-xs text-gray-500">{recommendation.reason}</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleAcceptDifficulty}
                    className="flex-1 rounded-lg bg-purple-600 py-2 text-xs font-bold text-white"
                  >
                    {DIFFICULTY_LABEL[recommendation.difficulty]}
                  </button>
                  <button
                    onClick={() => setDifficultyAccepted(true)}
                    className="flex-1 rounded-lg border border-gray-200 py-2 text-xs text-gray-500"
                  >
                    지금 난이도 유지
                  </button>
                </div>
              </motion.div>
            )}

            {submitState === 'error' && (
              <p className="mb-3 text-center text-xs text-red-400">
                {submitError ?? '점수 업로드에 실패했어요.'}
              </p>
            )}

            <div className="space-y-2.5">
              <motion.button
                onClick={handlePlayAgain}
                disabled={adLoading}
                whileHover={{ scale: adLoading ? 1 : 1.02 }}
                whileTap={{ scale: adLoading ? 1 : 0.98 }}
                className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-4 font-semibold text-white shadow-lg disabled:opacity-60"
              >
                {adLoading ? '불러오는 중...' : '다시 하기'}
              </motion.button>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleGoHome}
                  disabled={adLoading}
                  className="rounded-xl border-2 border-purple-400 py-3 text-sm font-semibold text-purple-600 hover:bg-purple-50 disabled:opacity-60"
                >
                  홈으로
                </button>
                <button
                  onClick={handleGoLeaderboard}
                  disabled={adLoading}
                  className="rounded-xl border-2 border-gray-300 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-50 disabled:opacity-60"
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
