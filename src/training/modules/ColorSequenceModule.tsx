import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TrainingModuleProps, TrainingSessionResult } from '../../types/training';
import { DIFFICULTY_CONFIG } from '../../types';

const COLORS = [
  { id: 'red', label: '빨강', bg: 'bg-red-500', ring: 'ring-red-300', active: 'bg-red-300' },
  { id: 'blue', label: '파랑', bg: 'bg-blue-500', ring: 'ring-blue-300', active: 'bg-blue-300' },
  { id: 'green', label: '초록', bg: 'bg-green-500', ring: 'ring-green-300', active: 'bg-green-300' },
  { id: 'yellow', label: '노랑', bg: 'bg-yellow-400', ring: 'ring-yellow-200', active: 'bg-yellow-200' },
  { id: 'purple', label: '보라', bg: 'bg-purple-500', ring: 'ring-purple-300', active: 'bg-purple-300' },
  { id: 'orange', label: '주황', bg: 'bg-orange-500', ring: 'ring-orange-300', active: 'bg-orange-300' },
];

const SEQ_LENGTH: Record<string, number> = { easy: 3, medium: 5, hard: 7 };
const FLASH_MS: Record<string, number> = { easy: 900, medium: 650, hard: 450 };
const GAP_MS = 300;

function generateSequence(length: number): string[] {
  const seq: string[] = [];
  let last = '';

  for (let i = 0; i < length; i++) {
    let pick = COLORS[Math.floor(Math.random() * COLORS.length)].id;
    while (pick === last) pick = COLORS[Math.floor(Math.random() * COLORS.length)].id;
    seq.push(pick);
    last = pick;
  }

  return seq;
}

type Phase = 'memorize' | 'ready' | 'recall';

export function ColorSequenceModule({ difficulty, onComplete, onExit }: TrainingModuleProps) {
  const seqLength = SEQ_LENGTH[difficulty] ?? 3;
  const flashMs = FLASH_MS[difficulty] ?? 900;
  const baseScore = DIFFICULTY_CONFIG[difficulty].baseScore;

  const [sequence] = useState<string[]>(() => generateSequence(seqLength));
  const [phase, setPhase] = useState<Phase>('memorize');
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const [shownCount, setShownCount] = useState(0);
  const [userInput, setUserInput] = useState<string[]>([]);
  const [wrongIdx, setWrongIdx] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [resultReady, setResultReady] = useState<TrainingSessionResult | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const completedRef = useRef(false);

  useEffect(() => {
    if (phase !== 'memorize') return;

    let cancelled = false;
    let i = 0;
    setShownCount(0);

    function flashNext() {
      if (cancelled) return;

      if (i >= sequence.length) {
        setActiveIdx(-1);
        setTimeout(() => {
          if (!cancelled) setPhase('ready');
        }, 500);
        return;
      }

      setActiveIdx(i);
      setShownCount(i + 1);
      setTimeout(() => {
        if (cancelled) return;
        setActiveIdx(-1);
        setTimeout(() => {
          i++;
          flashNext();
        }, GAP_MS);
      }, flashMs);
    }

    const timeout = setTimeout(flashNext, 600);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [phase, sequence, flashMs]);

  const handleColorTap = useCallback((colorId: string) => {
    if (phase !== 'recall') return;

    const idx = userInput.length;
    const correct = sequence[idx] === colorId;

    if (!correct) {
      setWrongIdx(idx);
      const newInput = [...userInput, colorId];
      setUserInput(newInput);

      let consecutive = 0;
      for (let k = 0; k < newInput.length - 1; k++) {
        if (newInput[k] === sequence[k]) consecutive++;
        else break;
      }

      if (completedRef.current) return;
      completedRef.current = true;
      setTimeout(() => {
        setRevealed(true);
        setResultReady(buildResult(consecutive, newInput, idx));
      }, 500);
      return;
    }

    const newInput = [...userInput, colorId];
    setUserInput(newInput);

    if (newInput.length === sequence.length) {
      const correctCount = sequence.filter((color, index) => color === newInput[index]).length;
      if (!completedRef.current) {
        completedRef.current = true;
        setTimeout(() => {
          setRevealed(true);
          setResultReady(buildResult(correctCount, newInput, null));
        }, 300);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, userInput, sequence]);

  function buildResult(correctCount: number, finalInput: string[], finalWrongIdx: number | null): TrainingSessionResult {
    const accuracy = correctCount / sequence.length;
    const score = Math.round(accuracy * baseScore);
    const timeMs = Date.now() - startTimeRef.current;
    return {
      moduleId: 'color-sequence',
      score,
      accuracy,
      timeMs,
      difficulty,
      completedAt: new Date().toISOString(),
      metadata: {
        sequenceLength: sequence.length,
        correctCount,
        sequence: sequence.join(','),
        userInput: finalInput.join(','),
        wrongCount: finalWrongIdx === null ? 0 : 1,
        isSuccess: correctCount === sequence.length,
      },
    };
  }

  const colorById = (id: string) => COLORS.find((color) => color.id === id)!;

  return (
    <div className="min-h-screen flex flex-col safe-top-training safe-bottom">
      <header className="relative p-4 flex items-center">
        <button onClick={onExit} className="text-white/80 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-white/70 text-sm font-semibold tracking-widest uppercase">
          색 순서
        </span>
      </header>

      {phase === 'recall' && (
        <div className="px-4 pb-2">
          <div className="flex justify-between text-white/60 text-xs mb-1">
            <span>입력</span>
            <span>{userInput.length} / {sequence.length}</span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              animate={{ width: `${(userInput.length / sequence.length) * 100}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
        {phase === 'memorize' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-8 w-full"
          >
            <div className="text-center">
              <p className="text-white/60 text-sm">순서를 기억하세요</p>
              <p className="text-white font-bold text-lg mt-1">{seqLength}가지 색상</p>
            </div>

            <div className="relative flex items-center justify-center w-48 h-48">
              <AnimatePresence mode="wait">
                {activeIdx >= 0 && (
                  <motion.div
                    key={`${activeIdx}-${sequence[activeIdx]}`}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.2, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className={`absolute w-40 h-40 rounded-full ${colorById(sequence[activeIdx]).bg} shadow-2xl`}
                  />
                )}
                {activeIdx < 0 && (
                  <motion.div
                    key="blank"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-40 h-40 rounded-full bg-white/10 border-2 border-white/20"
                  />
                )}
              </AnimatePresence>
            </div>

            <div className="flex gap-2">
              {sequence.map((_, index) => (
                <motion.div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index < shownCount ? 'bg-white' : 'bg-white/30'
                  }`}
                  animate={
                    index === activeIdx
                      ? { scale: [1, 1.5, 1], opacity: [1, 0.45, 1] }
                      : { scale: 1, opacity: 1 }
                  }
                  transition={{ duration: 0.35 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {phase === 'ready' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6 w-full max-w-xs"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">준비되셨나요?</h2>
              <p className="text-white/70 text-sm">순서대로 색상을 선택해보세요</p>
            </div>
            <motion.button
              onClick={() => {
                startTimeRef.current = Date.now();
                setPhase('recall');
              }}
              className="w-full py-4 bg-white text-purple-700 font-bold text-lg rounded-2xl shadow-lg"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              시작하기
            </motion.button>
          </motion.div>
        )}

        {phase === 'recall' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-6 w-full"
          >
            {/* 내가 입력한 순서 */}
            <div className="flex flex-col items-center gap-1.5 w-full">
              <p className="text-white/50 text-xs">내 답</p>
              <div className="flex gap-2 items-center justify-center">
                {Array.from({ length: sequence.length }).map((_, index) => {
                  const filled = index < userInput.length;
                  const isWrong = revealed && filled && userInput[index] !== sequence[index];
                  const isCorrect = revealed && filled && userInput[index] === sequence[index];
                  const color = filled ? colorById(userInput[index]) : null;
                  return (
                    <motion.div
                      key={index}
                      initial={false}
                      animate={filled && !revealed ? { scale: [1.3, 1] } : { scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                        !filled
                          ? 'border-white/30 bg-white/10'
                          : isCorrect
                          ? `${color!.bg} border-emerald-300 ring-2 ring-emerald-300/50`
                          : isWrong
                          ? `${color!.bg} border-red-400 ring-2 ring-red-400/50`
                          : `${color!.bg} border-white/40`
                      }`}
                    >
                      {revealed && isCorrect && (
                        <svg
                          viewBox="0 0 20 20"
                          className="h-3.5 w-3.5 drop-shadow-sm"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M4.5 10.5l3.2 3.2L15.5 6.5" />
                        </svg>
                      )}
                      {revealed && isWrong && (
                        <svg
                          viewBox="0 0 20 20"
                          className="h-3.5 w-3.5 drop-shadow-sm"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M6 6l8 8M14 6l-8 8" />
                        </svg>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* 정답 비교 행 (결과 공개 후) */}
            <AnimatePresence>
              {revealed && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-1.5 w-full"
                >
                  <p className="text-white/50 text-xs">정답</p>
                  <div className="flex gap-2 items-center justify-center">
                    {sequence.map((colorId, index) => {
                      const correct = userInput[index] === colorId;
                      const c = colorById(colorId);
                      return (
                        <div
                          key={index}
                          className={`w-8 h-8 rounded-full border-2 ${c.bg} ${
                            correct ? 'border-emerald-300 opacity-50' : 'border-white/60'
                          }`}
                        />
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 색상 버튼 (입력 중에만) */}
            {!revealed && (
              <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
                {COLORS.map((color) => (
                  <motion.button
                    key={color.id}
                    disabled={userInput.length >= sequence.length || wrongIdx !== null}
                    onClick={() => handleColorTap(color.id)}
                    whileTap={{ scale: 0.9 }}
                    className={`w-full aspect-square rounded-2xl ${color.bg} shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                    aria-label={color.label}
                  />
                ))}
              </div>
            )}

            {/* 결과 보기 버튼 */}
            {revealed && resultReady && (
              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onClick={() => onComplete(resultReady)}
                className="w-full max-w-xs py-4 bg-white text-purple-700 font-bold text-lg rounded-2xl shadow-lg"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                결과 보기
              </motion.button>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
