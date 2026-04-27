import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useRecommendation } from '../hooks/useRecommendation';
import { getFeedbackMessage } from '../lib/recommendation';
import { showInterstitialAdThrottled } from '../lib/ads';
import { useGameStore } from '../store/gameStore';
import { useUserProfileStore } from '../store/userProfileStore';
import { useHistoryStore } from '../store/historyStore';
import { getTrainingModule } from '../training/registry';
import { DIFFICULTY_CONFIG } from '../types';
import type { SessionRecord, TrainingSessionResult } from '../types/training';

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: '쉬움',
  medium: '보통',
  hard: '어려움',
};

function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getActiveDayCount(sessions: SessionRecord[]): number {
  const activeDays = new Set(
    sessions
      .filter(session => !session.metadata.isDiagnosis)
      .map(session => session.completedAt.slice(0, 10))
  );

  return activeDays.size;
}

function getTodayTrainingTimeMs(sessions: SessionRecord[]): number {
  const today = getDateKey(new Date());
  return sessions
    .filter(session => !session.metadata.isDiagnosis && session.completedAt.slice(0, 10) === today)
    .reduce((sum, session) => sum + session.timeMs, 0);
}

function getTomorrowGoalMessage({
  trainingSessionCount,
  dailyGoalReached,
  hasMissedWords,
  streak,
}: {
  trainingSessionCount: number;
  dailyGoalReached: boolean;
  hasMissedWords: boolean;
  streak: number;
}): string {
  if (trainingSessionCount <= 1) {
    return '첫 훈련 완료. 내일 한 번만 더 하면 2일 루틴이 시작돼요.';
  }

  if (dailyGoalReached) {
    return '오늘 목표를 채웠어요. 내일은 정확도를 조금 더 안정적으로 이어가볼게요.';
  }

  if (hasMissedWords) {
    return '놓친 단어가 남아 있어요. 다음 훈련에서 다시 잡아볼 수 있어요.';
  }

  if (streak >= 1) {
    return `${streak}일 흐름이 만들어졌어요. 내일 이어서 루틴을 지켜볼게요.`;
  }

  return '내일도 1분만 이어가면 이번 주 리포트가 더 정확해져요.';
}

export function SessionResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const result = location.state?.result as TrainingSessionResult | undefined;

  const store = useGameStore();
  const { profile, updateDifficulty } = useUserProfileStore();
  const sessions = useHistoryStore(s => s.sessions);
  const getStreakDays = useHistoryStore(s => s.getStreakDays);
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
  const trainingSessions = sessions.filter(session => !session.metadata.isDiagnosis);
  const activeDayCount = getActiveDayCount(trainingSessions);
  const starterProgress = Math.min(activeDayCount, 3);
  const todayTrainingTimeMs = getTodayTrainingTimeMs(trainingSessions);
  const dailyGoalMs = (profile?.dailyGoalMinutes ?? 3) * 60000;
  const streak = getStreakDays();
  const nextModule = getTrainingModule(recommendation.moduleId);
  const nextModuleLabel = nextModule
    ? `${nextModule.icon} ${nextModule.name}`
    : '추천 훈련';
  const tomorrowGoalMessage = getTomorrowGoalMessage({
    trainingSessionCount: trainingSessions.length,
    dailyGoalReached: dailyGoalMs > 0 && todayTrainingTimeMs >= dailyGoalMs,
    hasMissedWords: isWordModule && missedWords.length > 0,
    streak,
  });
  const shouldPromptDiagnosis = profile?.diagnosisDeferred === true && profile?.diagnosisComplete !== true;

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
    }

    navigate(`/training/${moduleId}`, {
      state: {
        autoStart: true,
        initialDifficulty: difficulty,
        initialMode: isWordModule ? mode : 'basic',
      },
    });
  };

  const handleAcceptDifficulty = () => {
    if (suggestChange && recommendation.difficulty !== difficulty) {
      store.setDifficulty(recommendation.difficulty);
      updateDifficulty(recommendation.difficulty);
    }

    setDifficultyAccepted(true);

    if (isWordModule) {
      store.resetGame();
    }

    navigate(`/training/${moduleId}`, {
      state: {
        autoStart: true,
        initialDifficulty: suggestChange && recommendation.difficulty !== difficulty ? recommendation.difficulty : difficulty,
        initialMode: isWordModule ? mode : 'basic',
      },
    });
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

  const handleGoReport = () => {
    if (isWordModule) {
      store.resetGame();
    }

    navigate('/report');
  };

  const handleGoDiagnosis = () => {
    if (isWordModule) {
      store.resetGame();
    }

    navigate('/diagnosis?entry=checkup');
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

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="mb-4 rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-slate-50 p-4"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-[0.16em] text-purple-400">내일 목표</p>
                  <p className="mt-1 truncate text-sm font-bold text-gray-800">{nextModuleLabel}</p>
                </div>
                <div className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-purple-600 shadow-sm">
                  {starterProgress}/3
                </div>
              </div>
              <p className="text-sm leading-relaxed text-gray-600">{tomorrowGoalMessage}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-[width] duration-300"
                  style={{ width: `${(starterProgress / 3) * 100}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-400">3일 스타터 루틴 진행률</p>
            </motion.div>

            {shouldPromptDiagnosis && (
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 }}
                onClick={handleGoDiagnosis}
                className="mb-4 w-full rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-left"
              >
                <p className="text-xs font-semibold tracking-[0.14em] text-amber-500">추천 정확도 올리기</p>
                <p className="mt-1 text-sm font-bold text-gray-800">1분 점검으로 난이도를 맞춰볼까요?</p>
                <p className="mt-1 text-xs text-gray-500">지금 결과를 바탕으로 다음 훈련 추천이 더 정확해져요.</p>
              </motion.button>
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
                  onClick={handleGoReport}
                  disabled={adLoading}
                  className="rounded-xl border-2 border-gray-300 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-50 disabled:opacity-60"
                >
                  리포트 보기
                </button>
              </div>
              {trainingSessions.length > 3 && (
                <button
                  onClick={handleGoLeaderboard}
                  disabled={adLoading}
                  className="w-full py-1 text-xs font-medium text-gray-400 underline-offset-2 hover:text-gray-500 hover:underline disabled:opacity-60"
                >
                  리더보드도 확인하기
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
