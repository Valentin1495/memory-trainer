import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TrainingModuleProps, TrainingSessionResult } from '../../types/training';
import { DIFFICULTY_CONFIG } from '../../types';

const SEQ_LENGTH: Record<string, number> = { easy: 4, medium: 6, hard: 8 };
const FLASH_MS:   Record<string, number> = { easy: 800, medium: 600, hard: 450 };
const GAP_MS = 300;

function generateSequence(length: number): number[] {
  const seq: number[] = [];
  let last = -1;
  for (let i = 0; i < length; i++) {
    let n = Math.floor(Math.random() * 10);
    while (n === last) n = Math.floor(Math.random() * 10);
    seq.push(n);
    last = n;
  }
  return seq;
}

type Phase = 'memorize' | 'ready' | 'recall';
type CellResult = 'correct' | 'wrong' | 'empty';

export function NumberSequenceModule({ difficulty, onComplete, onExit }: TrainingModuleProps) {
  const seqLength = SEQ_LENGTH[difficulty] ?? 4;
  const flashMs   = FLASH_MS[difficulty]   ?? 800;
  const baseScore = DIFFICULTY_CONFIG[difficulty].baseScore;

  const [sequence]          = useState<number[]>(() => generateSequence(seqLength));
  const [phase, setPhase]   = useState<Phase>('memorize');
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const [userInput, setUserInput] = useState<number[]>([]);
  const [revealed, setRevealed]   = useState(false);
  const [resultReady, setResultReady] = useState<TrainingSessionResult | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const completedRef = useRef(false);

  // memorize: flash each digit
  useEffect(() => {
    if (phase !== 'memorize') return;
    let cancelled = false;
    let i = 0;
    function flashNext() {
      if (cancelled) return;
      if (i >= sequence.length) {
        setActiveIdx(-1);
        setTimeout(() => { if (!cancelled) setPhase('ready'); }, 500);
        return;
      }
      setActiveIdx(i);
      setTimeout(() => {
        if (cancelled) return;
        setActiveIdx(-1);
        setTimeout(() => { i++; flashNext(); }, GAP_MS);
      }, flashMs);
    }
    const timer = setTimeout(flashNext, 600);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [phase, sequence, flashMs]);

  const handleDigit = useCallback((digit: number) => {
    if (phase !== 'recall' || revealed) return;
    if (userInput.length >= seqLength) return;
    setUserInput(prev => [...prev, digit]);
  }, [phase, revealed, userInput.length, seqLength]);

  const handleBackspace = useCallback(() => {
    if (phase !== 'recall' || revealed) return;
    setUserInput(prev => prev.slice(0, -1));
  }, [phase, revealed]);

  const handleSubmit = useCallback(() => {
    if (userInput.length !== seqLength || completedRef.current) return;
    completedRef.current = true;

    let streak = 0;
    for (let k = 0; k < seqLength; k++) {
      if (userInput[k] === sequence[k]) streak++;
      else break;
    }
    const correctCount = userInput.filter((n, i) => n === sequence[i]).length;

    setRevealed(true);
    setResultReady(buildResult(streak, correctCount));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInput, seqLength, sequence]);


  function buildResult(streak: number, correctCount: number): TrainingSessionResult {
    const accuracy = correctCount / seqLength;
    const score    = Math.round(accuracy * baseScore);
    const timeMs   = Date.now() - startTimeRef.current;
    return {
      moduleId:    'number-sequence',
      score,
      accuracy,
      timeMs,
      difficulty,
      completedAt: new Date().toISOString(),
      metadata: {
        sequenceLength: seqLength,
        correctStreak:  streak,
        totalEntered:   seqLength,
        sequence:       sequence.join(''),
        userInput:      userInput.join(''),
      },
    } as TrainingSessionResult;
  }

  const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'] as const;

  return (
    <div className="min-h-screen flex flex-col safe-top-training safe-bottom">
      <header className="relative p-4 flex items-center">
        <button onClick={onExit} className="text-white/80 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-white/70 text-sm font-semibold tracking-widest uppercase">숫자 순서</span>
      </header>

      {phase === 'recall' && (
        <div className="px-4 pb-2">
          <div className="flex justify-between text-white/60 text-xs mb-1">
            <span>입력</span>
            <span>{userInput.length} / {seqLength}</span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              animate={{ width: `${(userInput.length / seqLength) * 100}%` }}
              transition={{ duration: 0.15 }}
            />
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col items-center justify-center px-6 gap-8">

        {/* MEMORIZE */}
        {phase === 'memorize' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-8 w-full"
          >
            <div className="text-center">
              <p className="text-white/60 text-sm">순서를 기억하세요</p>
              <p className="text-white font-bold text-lg mt-1">{seqLength}자리 숫자</p>
            </div>

            {/* Big digit display */}
            <div className="relative flex items-center justify-center w-44 h-44">
              <AnimatePresence mode="wait">
                {activeIdx >= 0 && (
                  <motion.div
                    key={`${activeIdx}-${sequence[activeIdx]}`}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1,   opacity: 1 }}
                    exit={   { scale: 1.3, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="absolute flex items-center justify-center w-36 h-36 rounded-3xl bg-white/20 border-2 border-white/40 backdrop-blur-sm"
                  >
                    <span className="text-7xl font-black text-white">{sequence[activeIdx]}</span>
                  </motion.div>
                )}
                {activeIdx < 0 && (
                  <motion.div
                    key="blank"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-36 h-36 rounded-3xl bg-white/8 border-2 border-white/15"
                  />
                )}
              </AnimatePresence>
            </div>

            <div className="flex gap-2">
              {sequence.map((_, i) => (
                <motion.div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full ${i <= activeIdx ? 'bg-white' : 'bg-white/30'}`}
                  animate={{ scale: i === activeIdx ? 1.6 : 1 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* READY */}
        {phase === 'ready' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6 w-full max-w-xs"
          >
            <p className="text-4xl">🔢</p>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">준비됐나요?</h2>
              <p className="text-white/70 text-sm">숫자를 순서대로 입력하세요</p>
            </div>
            <motion.button
              onClick={() => { startTimeRef.current = Date.now(); setPhase('recall'); }}
              className="w-full py-4 bg-white text-purple-700 font-bold text-lg rounded-2xl shadow-lg"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              시작하기
            </motion.button>
          </motion.div>
        )}

        {/* RECALL */}
        {phase === 'recall' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-6 w-full max-w-xs"
          >
            {/* 입력 칸 */}
            <div className="flex flex-col items-center gap-3 w-full">
              <div className="flex gap-1.5 justify-center flex-wrap items-center min-h-[3rem]">
                {Array.from({ length: seqLength }).map((_, i) => {
                  const filled = i < userInput.length;
                  const cellResult: CellResult = revealed && filled
                    ? (userInput[i] === sequence[i] ? 'correct' : 'wrong')
                    : 'empty';
                  return (
                    <motion.div
                      key={i}
                      initial={false}
                      animate={filled && !revealed ? { scale: [1.2, 1] } : { scale: 1 }}
                      transition={{ duration: 0.15 }}
                      className={`w-9 h-10 rounded-xl flex items-center justify-center text-lg font-bold border-2 transition-colors ${
                        !filled
                          ? 'bg-white/8 border-white/20 text-transparent'
                          : cellResult === 'correct'
                          ? 'bg-emerald-500 border-emerald-300 text-white'
                          : cellResult === 'wrong'
                          ? 'bg-red-500 border-red-300 text-white'
                          : 'bg-white/20 border-white/50 text-white'
                      }`}
                    >
                      {filled ? userInput[i] : '·'}
                    </motion.div>
                  );
                })}
              </div>

              {/* 정답 비교 행 */}
              <AnimatePresence>
                {revealed && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-1 w-full"
                  >
                    <p className="text-white/50 text-xs">정답</p>
                    <div className="flex gap-1.5 justify-center flex-wrap items-center">
                      {sequence.map((n, i) => {
                        const correct = userInput[i] === n;
                        return (
                          <div
                            key={i}
                            className={`w-9 h-10 rounded-xl flex items-center justify-center text-lg font-bold border-2 ${
                              correct
                                ? 'bg-emerald-500/30 border-emerald-400/60 text-emerald-200'
                                : 'bg-white/20 border-white/60 text-white'
                            }`}
                          >
                            {n}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 숫자패드 */}
            {!revealed && (
              <>
                <div className="grid grid-cols-3 gap-3 w-full">
                  {DIGITS.map((d, idx) => {
                    if (d === null) return <div key={idx} />;
                    if (d === 'del') {
                      return (
                        <motion.button
                          key="del"
                          onClick={handleBackspace}
                          whileTap={{ scale: 0.88 }}
                          disabled={userInput.length === 0}
                          className="aspect-square rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white/80 text-xl disabled:opacity-30"
                        >
                          ⌫
                        </motion.button>
                      );
                    }
                    return (
                      <motion.button
                        key={d}
                        onClick={() => handleDigit(d as number)}
                        whileTap={{ scale: 0.88 }}
                        disabled={userInput.length >= seqLength}
                        className="aspect-square rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white font-bold text-2xl disabled:opacity-30"
                      >
                        {d}
                      </motion.button>
                    );
                  })}
                </div>

                {/* 확인 버튼 — seqLength 칸 다 채웠을 때만 활성화 */}
                <motion.button
                  onClick={handleSubmit}
                  disabled={userInput.length !== seqLength}
                  whileHover={{ scale: userInput.length === seqLength ? 1.03 : 1 }}
                  whileTap={{ scale: userInput.length === seqLength ? 0.97 : 1 }}
                  className="w-full py-4 bg-white text-purple-700 font-bold text-lg rounded-2xl shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
                >
                  확인
                </motion.button>
              </>
            )}

            {/* 결과 보기 버튼 */}
            {revealed && resultReady && (
              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onClick={() => onComplete(resultReady)}
                className="w-full py-4 bg-white text-purple-700 font-bold text-lg rounded-2xl shadow-lg"
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
