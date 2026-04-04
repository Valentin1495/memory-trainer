import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../hooks/useGame';
import { useTimer } from '../../hooks/useTimer';
import { useGameStore } from '../../store/gameStore';
import { DIFFICULTY_CONFIG } from '../../types';
import { WordDisplay } from '../../components/game/WordDisplay';
import { ChoiceGrid } from '../../components/game/ChoiceGrid';
import { Timer } from '../../components/game/Timer';
import { ReviewModal } from '../../components/game/ReviewModal';
import type { TrainingModuleProps, TrainingSessionResult } from '../../types/training';

function HeartLifeIcon({ dimmed = false }: { dimmed?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-4 w-4 ${dimmed ? 'fill-transparent stroke-rose-200/70' : 'fill-rose-400 stroke-rose-300 drop-shadow-[0_0_6px_rgba(251,113,133,0.45)]'}`}
    >
      <path
        d="M12 20.25c-.2 0-.39-.07-.55-.2-4.12-3.37-6.79-5.86-8.2-7.61C1.88 10.73 1.5 9.28 1.5 7.88 1.5 4.98 3.73 2.75 6.63 2.75c1.72 0 3.34.8 4.37 2.15a5.66 5.66 0 0 1 4.37-2.15c2.9 0 5.13 2.23 5.13 5.13 0 1.4-.38 2.85-1.75 4.56-1.41 1.75-4.08 4.24-8.2 7.61a.87.87 0 0 1-.55.2Z"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WordMemoryModule({
  difficulty,
  mode = 'basic',
  isDiagnosis = false,
  diagnosisLabel,
  diagnosisColor,
  onComplete,
  onExit,
}: TrainingModuleProps) {
  const {
    phase,
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
    getScore,
  } = useGame();

  const { setPhase } = useGameStore();
  const config = DIFFICULTY_CONFIG[difficulty];
  const timer = useTimer();
  const completedRef = useRef(false);
  const hasActiveRunRef = useRef(false);
  const prevPhaseRef = useRef(phase);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // category 로드 완료 후 phase가 아직 memorize가 아니면 자동 시작
  useEffect(() => {
    if (phase === 'memorize' || phase === 'ready' || phase === 'choose') {
      hasActiveRunRef.current = true;
    }

    const transitionedToResult = prevPhaseRef.current !== 'result' && phase === 'result';
    if (hasActiveRunRef.current && transitionedToResult && !completedRef.current) {
      completedRef.current = true;
      timer.stop();
      const targetCount = mode === 'basic' ? shownWords.length : config.decoyCount;
      const accuracy = targetCount > 0 ? correctSelections.length / targetCount : 0;
      const timeMs = timer.elapsedMs > 0 ? timer.elapsedMs : 1000;
      const result: TrainingSessionResult = {
        moduleId: 'word-memory',
        score: getScore(),
        accuracy,
        timeMs,
        difficulty,
        completedAt: new Date().toISOString(),
        metadata: {
          missedWords: allWords
            .filter(w => (mode === 'basic' ? !w.notShown : w.notShown) && !correctSelections.includes(w.id))
            .map(w => w.word),
          wrongCount,
          reviewCount,
          categoryName: category?.name ?? '',
          mode,
        },
      };
      onComplete(result);
    }

    prevPhaseRef.current = phase;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase === 'choose' && !timer.isRunning) {
      timer.start();
    }
  }, [phase, timer]);

  const handleWordClick = (wordId: string) => {
    const result = handleWordSelect(wordId);
    if (result.isComplete) timer.stop();
  };

  const handleBackClick = () => {
    if (isDiagnosis) {
      timer.stop();
      setShowExitConfirm(true);
      return;
    }
    timer.stop();
    onExit();
  };

  const handleResumeDiagnosis = () => {
    setShowExitConfirm(false);
    if (phase === 'choose' && !completedRef.current) {
      timer.start();
    }
  };

  const handleCancelDiagnosis = () => {
    setShowExitConfirm(false);
    onExit();
  };

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  const targetCount = mode === 'basic' ? shownWords.length : config.decoyCount;
  const progress = targetCount > 0 ? (correctSelections.length / targetCount) * 100 : 0;
  const livesRemaining = config.maxLives - wrongCount;
  const instruction =
    mode === 'basic'
      ? '기억나는 단어를 모두 선택해보세요.'
      : '보지 못한 단어를 선택해보세요.';
  const modeLabel = mode === 'basic' ? '지나간 단어 찾기' : '보지 못한 단어 찾기';

  return (
    <div className="h-screen flex flex-col safe-top-training safe-bottom">
      <header className="px-4 py-4 grid grid-cols-3 items-center">
        <button
          onClick={handleBackClick}
          className="justify-self-start text-white/80 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        <span className={`justify-self-center text-xs font-bold tracking-wide ${diagnosisLabel ? (diagnosisColor ?? 'text-white/70') : 'invisible'}`}>
          {diagnosisLabel ?? '·'}
        </span>

        <div className="justify-self-end">
          {phase === 'choose' ? (
            <Timer formattedTime={timer.formattedTime} isRunning={timer.isRunning} />
          ) : (
            <div className="w-16" />
          )}
        </div>
      </header>

      <div className="px-4 pb-0 mt-3">
        <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-2 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                오늘의 주제
              </p>
              <p className="mt-0.5 text-sm font-semibold text-white">{category.name}</p>
            </div>
            <div className="rounded-full bg-white/12 px-3 py-1 text-xs font-medium text-white/80">
              {modeLabel}
            </div>
          </div>
        </div>
      </div>

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
            className="flex-1 flex flex-col items-center justify-center px-6 gap-6 pb-40"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">준비되셨나요?</h2>
              <p className="text-white/70 text-sm">{instruction}</p>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              {Array.from({ length: config.maxLives }).map((_, i) => (
                <HeartLifeIcon key={i} />
              ))}
              <span className="text-white/60 text-sm ml-1">기회 {config.maxLives}번</span>
            </div>
            <div className="w-full max-w-xs flex flex-col gap-3">
              <motion.button
                onClick={() => setPhase('choose')}
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
            <div className="px-4 pt-5 pb-2">
              <div className="flex justify-end items-center mb-2">
                <span className="text-white/80 text-sm">{correctSelections.length} / {targetCount}</span>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-green-400 rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
            <div className="flex justify-center px-4 pt-3 pb-3">
              <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1.5">
                {Array.from({ length: config.maxLives }).map((_, i) => (
                  <motion.span
                    key={i}
                    initial={false}
                    animate={{ scale: i < livesRemaining ? 1 : 0.6, opacity: i < livesRemaining ? 1 : 0.3 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                    className="flex items-center justify-center"
                  >
                    <HeartLifeIcon dimmed={i >= livesRemaining} />
                  </motion.span>
                ))}
              </div>
            </div>
            <div className="flex-1 flex items-center pb-40">
              <ChoiceGrid
                words={allWords}
                selectedWords={selectedWords}
                correctSelections={correctSelections}
                mode={mode as 'basic' | 'reverse'}
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

      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="w-full max-w-sm rounded-3xl border border-white/12 bg-slate-900/95 p-6 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white">진단을 취소할까요?</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                지금 나가면 이번 진단 진행 내용은 저장되지 않아요. 나중에 다시 시작하면 처음부터 진행합니다.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={handleResumeDiagnosis}
                  className="w-full rounded-2xl bg-white px-4 py-3 font-semibold text-slate-900"
                >
                  계속 진행
                </button>
                <button
                  onClick={handleCancelDiagnosis}
                  className="w-full rounded-2xl bg-white/12 px-4 py-3 font-medium text-white"
                >
                  진단 취소
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
