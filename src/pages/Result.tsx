import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useGameStore } from '../store/gameStore';
import { DIFFICULTY_CONFIG } from '../types';
import { showInterstitialAd } from '../lib/admob';

export function Result() {
  const navigate = useNavigate();
  const store = useGameStore();
  const { mode, nickname, wrongCount, reviewCount, getScore, isSuccess, resetGame, startGame } = store;
  const { submitScore } = useLeaderboard({ period: 'daily' });
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [adLoading, setAdLoading] = useState(false);
  const hasSubmitted = useRef(false);

  const score = getScore();
  const timeMs = store.startTime && store.endTime ? store.endTime - store.startTime : 0;

  // 결과 화면용 스냅샷 — 게임 종료 후 안정적
  const correctSelections = store.correctSelections;
  // 기본: 암기 단계에서 보여준 단어(=선택 대상)
  // 리버스: 보여주지 않은 단어(=선택 대상, notShown=true)
  const targetWords = mode === 'basic'
    ? store.shownWords
    : store.allWords.filter(w => w.notShown);

  useEffect(() => {
    if (!store.endTime) {
      navigate('/');
      return;
    }
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;

    setSubmitState('submitting');
    submitScore(nickname, score, timeMs, wrongCount, mode, store.difficulty).then((success) => {
      setSubmitState(success ? 'done' : 'error');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlayAgain = async () => {
    setAdLoading(true);
    await showInterstitialAd();
    setAdLoading(false);
    resetGame();
    startGame();
    navigate('/game');
  };

  const handleGoLeaderboard = async () => {
    setAdLoading(true);
    await showInterstitialAd();
    setAdLoading(false);
    navigate('/leaderboard');
  };

  const handleGoHome = () => {
    resetGame();
    navigate('/');
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
            <div className="text-center mb-6">
              <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold mb-4 ${isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}>
                <span>{isSuccess ? '✅' : '❌'}</span>
                <span>{isSuccess ? '성공!' : '실패'}</span>
              </div>
              <p className="text-xs text-gray-400 mb-1">최종 점수</p>
              <p className="text-5xl font-bold text-purple-600">{score.toLocaleString()}</p>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">모드</p>
                <p className="text-base font-semibold text-gray-800">
                  {mode === 'basic' ? '기본' : '리버스'}
                  {mode === 'reverse' && (
                    <span className="text-purple-500 text-sm ml-1">×{DIFFICULTY_CONFIG[store.difficulty].reverseMultiplier}</span>
                  )}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">난이도</p>
                <p className="text-base font-semibold text-gray-800">
                  {store.difficulty === 'easy' ? '🟢 EASY' : store.difficulty === 'medium' ? '🟡 MEDIUM' : '🔴 HARD'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">소요 시간</p>
                <p className="text-base font-semibold text-gray-800">{formatTime(timeMs)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">오답</p>
                <p className="text-base font-semibold text-red-500">{wrongCount}회</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">다시보기</p>
                <p className={`text-base font-semibold ${reviewCount > 0 ? 'text-amber-500' : 'text-gray-400'}`}>
                  {reviewCount}회
                </p>
              </div>
            </div>

            {/* 단어 결과 */}
            {targetWords.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">
                    {mode === 'basic' ? '암기 단어' : '찾아야 할 단어'}
                  </p>
                  <p className="text-xs text-gray-400">
                    <span className="text-green-600 font-medium">{correctSelections.length}</span>
                    {' / '}{targetWords.length}개
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {targetWords.map((word) => {
                    const selected = correctSelections.includes(word.id);
                    return (
                      <span
                        key={word.id}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${selected ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-400'
                          }`}
                      >
                        <span className="text-xs">{selected ? '✓' : '✗'}</span>
                        {word.word}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 등록 오류만 표시 */}
            {submitState === 'error' && (
              <p className="text-center text-xs text-red-400 mb-4">점수 등록에 실패했습니다</p>
            )}

            <div className="space-y-3">
              <motion.button
                onClick={handlePlayAgain}
                disabled={adLoading}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg disabled:opacity-60"
                whileHover={{ scale: adLoading ? 1 : 1.02 }}
                whileTap={{ scale: adLoading ? 1 : 0.98 }}
              >
                {adLoading ? '잠시만요...' : '다시 플레이'}
              </motion.button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleGoLeaderboard}
                  disabled={adLoading}
                  className="py-3 border-2 border-purple-400 text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-colors text-sm disabled:opacity-60"
                >
                  리더보드
                </button>
                <button
                  onClick={handleGoHome}
                  disabled={adLoading}
                  className="py-3 border-2 border-gray-300 text-gray-500 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm disabled:opacity-60"
                >
                  홈으로
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
