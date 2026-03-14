import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../hooks/useGame';
import { useTimer } from '../hooks/useTimer';
import { useGameStore } from '../store/gameStore';
import { DIFFICULTY_CONFIG } from '../types';
import { WordDisplay } from '../components/game/WordDisplay';
import { ChoiceGrid } from '../components/game/ChoiceGrid';
import { Timer } from '../components/game/Timer';
import { ReviewModal } from '../components/game/ReviewModal';

export function Game() {
  const navigate = useNavigate();
  const {
    phase,
    mode,
    category,
    shownWords,
    allWords,
    selectedWords,
    correctSelections,
    wrongCount,
    reviewCount,
    showReviewModal,
    handleWordSelect,
    handleReviewRequest,
    handleCloseReview,
  } = useGame();

  const { difficulty, setPhase } = useGameStore();
  const config = DIFFICULTY_CONFIG[difficulty];
  const timer = useTimer();

  useEffect(() => {
    if (phase === 'home') navigate('/');
    if (phase === 'result') {
      timer.stop();
      navigate('/result');
    }
  }, [phase, navigate, timer]);

  useEffect(() => {
    if (phase === 'choose' && !timer.isRunning) {
      timer.start();
    }
  }, [phase, timer]);

  const handleWordClick = (wordId: string) => {
    const result = handleWordSelect(wordId);
    if (result.isComplete) timer.stop();
  };

  const handleStartChoose = () => {
    setPhase('choose');
  };

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white">로딩 중...</p>
      </div>
    );
  }

  const targetCount = mode === 'basic' ? shownWords.length : config.decoyCount;
  const progress = (correctSelections.length / targetCount) * 100;
  const livesRemaining = config.maxLives - wrongCount;

  return (
    <div className="min-h-screen flex flex-col safe-top safe-bottom">
      <header className="p-4 flex justify-between items-center">
        <button
          onClick={() => { timer.stop(); navigate('/'); }}
          className="text-white/80 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        <div className="w-20" />

        {phase === 'choose' ? (
          <Timer formattedTime={timer.formattedTime} isRunning={timer.isRunning} />
        ) : (
          <div className="w-20" />
        )}
      </header>

      <main className="flex-1 flex flex-col">
        {phase === 'memorize' && (
          <WordDisplay
            words={shownWords}
            wordDurationMs={config.wordDurationMs}
            difficulty={difficulty}
            onComplete={() => setPhase('ready')}
          />
        )}

        {phase === 'ready' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center px-6 gap-6"
          >
            <div className="text-center">
              <p className="text-4xl mb-3">🧠</p>
              <h2 className="text-2xl font-bold text-white mb-2">준비됐나요?</h2>
              <p className="text-white/70 text-sm">
                {mode === 'basic' ? '기억나는 단어를 모두 선택하세요' : '보지 않았던 단어를 선택하세요'}
              </p>
            </div>

            <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              {Array.from({ length: config.maxLives }).map((_, i) => (
                <span key={i} className="text-base">❤️</span>
              ))}
              <span className="text-white/60 text-sm ml-1">기회 {config.maxLives}번</span>
            </div>

            <div className="w-full max-w-xs flex flex-col gap-3">
              <motion.button
                onClick={handleStartChoose}
                className="w-full py-4 bg-white text-purple-700 font-bold text-lg rounded-2xl shadow-lg"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                시작하기
              </motion.button>

              <motion.button
                onClick={handleReviewRequest}
                className="w-full py-3 flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white font-medium rounded-2xl"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                다시 보기
                {reviewCount > 0 && (
                  <span className="text-white/50 text-sm">({reviewCount}회 | -{reviewCount * 150}점)</span>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}

        {phase === 'choose' && (
          <div className="flex-1 flex flex-col">
            {/* 진행 바 */}
            <div className="px-4 py-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/80 text-sm">
                  {mode === 'basic' ? '기억나는 단어를 모두 선택하세요' : '보지 않았던 단어를 선택하세요'}
                </span>
                <span className="text-white/80 text-sm">{correctSelections.length} / {targetCount}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-green-400 rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* 기회 */}
            <div className="flex justify-center px-4 py-2">
              <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1.5">
                {Array.from({ length: config.maxLives }).map((_, i) => (
                  <motion.span
                    key={i}
                    initial={false}
                    animate={{ scale: i < livesRemaining ? 1 : 0.6, opacity: i < livesRemaining ? 1 : 0.3 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                    className="text-base"
                  >
                    ❤️
                  </motion.span>
                ))}
              </div>
            </div>

            <div className="flex-1 flex items-center">
              <ChoiceGrid
                words={allWords}
                selectedWords={selectedWords}
                correctSelections={correctSelections}
                mode={mode}
                onSelect={handleWordClick}
              />
            </div>
          </div>
        )}
      </main>

      <ReviewModal
        isOpen={showReviewModal}
        words={shownWords}
        wordDurationMs={config.wordDurationMs}
        difficulty={difficulty}
        onClose={handleCloseReview}
        penaltyPoints={150}
      />
    </div>
  );
}
