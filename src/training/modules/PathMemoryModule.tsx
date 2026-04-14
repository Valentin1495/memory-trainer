import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TrainingModuleProps, TrainingSessionResult } from '../../types/training';
import { DIFFICULTY_CONFIG } from '../../types';

const GRID_SIZE = 5; // 5×5
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

const PATH_LENGTH: Record<string, number> = { easy: 4, medium: 6, hard: 8 };
const STEP_MS:     Record<string, number> = { easy: 700, medium: 500, hard: 380 };

/** Generate a random path that moves to adjacent (incl. diagonal) cells without revisiting */
function generatePath(length: number): number[] {
  const path: number[] = [];
  const used = new Set<number>();

  const rowOf = (i: number) => Math.floor(i / GRID_SIZE);
  const colOf = (i: number) => i % GRID_SIZE;

  function neighbors(idx: number): number[] {
    const r = rowOf(idx);
    const c = colOf(idx);
    const result: number[] = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
          const ni = nr * GRID_SIZE + nc;
          if (!used.has(ni)) result.push(ni);
        }
      }
    }
    return result;
  }

  // try multiple starting points to ensure a long enough path
  for (let attempt = 0; attempt < 20; attempt++) {
    path.length = 0;
    used.clear();
    const start = Math.floor(Math.random() * TOTAL_CELLS);
    path.push(start);
    used.add(start);

    while (path.length < length) {
      const nbrs = neighbors(path[path.length - 1]);
      if (nbrs.length === 0) break;
      const next = nbrs[Math.floor(Math.random() * nbrs.length)];
      path.push(next);
      used.add(next);
    }
    if (path.length === length) break;
  }
  return path;
}

type Phase = 'memorize' | 'ready' | 'recall';

export function PathMemoryModule({ difficulty, skipReadyScreen = false, onComplete, onExit }: TrainingModuleProps) {
  const pathLength = PATH_LENGTH[difficulty] ?? 4;
  const stepMs     = STEP_MS[difficulty]     ?? 700;
  const baseScore  = DIFFICULTY_CONFIG[difficulty].baseScore;

  const [path]              = useState<number[]>(() => generatePath(pathLength));
  const [phase, setPhase]   = useState<Phase>('memorize');
  const [highlightIdx, setHighlightIdx] = useState<number>(-1);
  const [userPath, setUserPath]         = useState<number[]>([]);
  const [revealed, setRevealed]         = useState(false);
  const [resultReady, setResultReady]   = useState<TrainingSessionResult | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const completedRef = useRef(false);

  // memorize: highlight path step by step
  useEffect(() => {
    if (phase !== 'memorize') return;
    let cancelled = false;
    let i = 0;
    function showNext() {
      if (cancelled) return;
      if (i >= path.length) {
        // show full path briefly before ready
        setTimeout(() => {
          if (!cancelled) {
            setHighlightIdx(-2); // -2 = show all
            setTimeout(() => {
              if (cancelled) return;
              if (skipReadyScreen) {
                startTimeRef.current = Date.now();
                setPhase('recall');
                return;
              }
              setPhase('ready');
            }, 600);
          }
        }, 300);
        return;
      }
      setHighlightIdx(i);
      setTimeout(() => {
        if (cancelled) return;
        i++;
        showNext();
      }, stepMs);
    }
    const timer = setTimeout(showNext, 500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [phase, path, stepMs, skipReadyScreen]);

  const handleCellTap = useCallback((cellIdx: number) => {
    if (phase !== 'recall' || completedRef.current) return;

    const pos         = userPath.length;
    const expectedCell = path[pos];
    const isCorrect   = cellIdx === expectedCell;

    if (!isCorrect) {
      const newPath = [...userPath, cellIdx];
      setUserPath(newPath);
      completedRef.current = true;
      setTimeout(() => {
        setRevealed(true);
        setResultReady(buildResult(pos));
      }, 500);
      return;
    }

    const newPath = [...userPath, cellIdx];
    setUserPath(newPath);

    if (newPath.length === path.length) {
      completedRef.current = true;
      setTimeout(() => {
        setRevealed(true);
        setResultReady(buildResult(path.length));
      }, 300);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, userPath, path]);

  function buildResult(correctSteps: number): TrainingSessionResult {
    const accuracy = correctSteps / path.length;
    const score    = Math.round(accuracy * baseScore);
    const timeMs   = Date.now() - startTimeRef.current;
    return {
      moduleId:    'path-memory',
      score,
      accuracy,
      timeMs,
      difficulty,
      completedAt: new Date().toISOString(),
      metadata: {
        pathLength:   path.length,
        correctSteps,
        path: path.join(','),
      },
    } as TrainingSessionResult;
  }

  function getCellState(cellIdx: number): 'path' | 'active' | 'user-correct' | 'user-wrong' | 'user-missed' | 'idle' {
    const pathSet   = new Set(path);
    const inPath    = pathSet.has(cellIdx);
    const pathPos   = path.indexOf(cellIdx);
    const userPos   = userPath.indexOf(cellIdx);

    if (phase === 'memorize') {
      if (highlightIdx === -2 && inPath) return 'path';
      if (highlightIdx >= 0 && cellIdx === path[highlightIdx]) return 'active';
      if (highlightIdx >= 0 && path.slice(0, highlightIdx).includes(cellIdx)) return 'path';
      return 'idle';
    }

    if (phase === 'recall') {
      // 오답이 발생한 위치 (정답 기준 인덱스) = userPath.length - 1
      // 전부 맞춘 경우엔 missed 없음
      const allCorrect = userPath.length === path.length && userPath.every((c, i) => c === path[i]);
      const firstMissedPos = allCorrect ? Infinity : userPath.length - 1;

      // 이 칸을 사용자가 선택했는지 여부와 무관하게,
      // 정답 경로에서 오답 발생 위치 이후에 해당하면 missed로 표시
      if (revealed && inPath && pathPos >= firstMissedPos) {
        // 단, 이 위치 이전에 올바르게 선택된 칸은 user-correct 유지
        if (userPos >= 0 && userPos < firstMissedPos) {
          return 'user-correct';
        }
        return 'user-missed';
      }

      if (userPos >= 0) {
        const wasCorrect = userPath[userPos] === path[userPos];
        return wasCorrect ? 'user-correct' : 'user-wrong';
      }

      return 'idle';
    }
    return 'idle';
  }

  const pathStepNumber = (cellIdx: number): number | null => {
    const idx = path.indexOf(cellIdx);
    return idx >= 0 ? idx + 1 : null;
  };

  return (
    <div className="min-h-screen flex flex-col safe-top-training safe-bottom">
      <header className="relative p-4 flex items-center">
        <button onClick={onExit} className="text-white/80 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-white/70 text-sm font-semibold tracking-widest uppercase">경로 기억</span>
      </header>

      {phase === 'recall' && (
        <div className="px-4 pb-2">
          <div className="flex justify-between text-white/60 text-xs mb-1">
            <span>경로</span>
            <span>{userPath.length} / {path.length}</span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              animate={{ width: `${(userPath.length / path.length) * 100}%` }}
              transition={{ duration: 0.15 }}
            />
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col items-center justify-center px-4 gap-6">

        {/* MEMORIZE */}
        {phase === 'memorize' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-5 w-full"
          >
            <div className="text-center">
              <p className="text-white/60 text-sm">경로를 기억하세요</p>
              <p className="text-white font-bold text-lg mt-1">{pathLength}단계 경로</p>
            </div>
            <PathGrid
              phase="memorize"
              cellState={getCellState}
              pathStepNumber={pathStepNumber}
              onTap={() => {}}
              userPath={[]}
              disabled={false}
            />
          </motion.div>
        )}

        {/* READY */}
        {phase === 'ready' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6 w-full max-w-xs"
          >
            <p className="text-4xl">🗺️</p>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">경로를 기억했나요?</h2>
              <p className="text-white/70 text-sm">순서대로 경로를 탭하세요</p>
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
            className="flex flex-col items-center gap-5 w-full"
          >
            <p className="text-white/60 text-sm">
              {revealed ? '경로를 확인하세요' : '기억한 경로를 순서대로 탭하세요'}
            </p>
            <PathGrid
              phase="recall"
              cellState={getCellState}
              pathStepNumber={pathStepNumber}
              onTap={handleCellTap}
              userPath={userPath}
              disabled={revealed}
            />
            {revealed && resultReady && (
              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onClick={() => onComplete(resultReady)}
                className="w-full max-w-sm py-4 bg-white text-purple-700 font-bold text-lg rounded-2xl shadow-lg"
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

type CellStateType = 'path' | 'active' | 'user-correct' | 'user-wrong' | 'user-missed' | 'idle';

interface PathGridProps {
  phase: 'memorize' | 'recall';
  cellState: (cellIdx: number) => CellStateType;
  pathStepNumber: (cellIdx: number) => number | null;
  onTap: (cellIdx: number) => void;
  userPath: number[];
  disabled: boolean;
}

function PathGrid({ phase, cellState, pathStepNumber, onTap, userPath, disabled }: PathGridProps) {
  return (
    <div
      className="grid gap-1.5 w-full max-w-sm"
      style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
    >
      {Array.from({ length: TOTAL_CELLS }).map((_, idx) => {
        const state    = cellState(idx);
        const stepNum  = state !== 'idle' ? pathStepNumber(idx) : null;
        const userStep = userPath.indexOf(idx) >= 0 ? userPath.indexOf(idx) + 1 : null;

        let cellClass = 'bg-white/10 border border-white/15 text-transparent';

        switch (state) {
          case 'active':
            cellClass = 'bg-white border border-white shadow-lg shadow-white/40 text-purple-700';
            break;
          case 'path':
            cellClass = 'bg-white/35 border border-white/50 text-white';
            break;
          case 'user-correct':
            cellClass = 'bg-green-500/70 border border-green-300 text-white';
            break;
          case 'user-wrong':
            cellClass = 'bg-red-500/70 border border-red-300 text-white';
            break;
          case 'user-missed':
            cellClass = 'bg-amber-400/25 border border-amber-300/70 text-amber-200';
            break;
        }

        // recall 단계: 내가 선택한 칸은 내 순서, missed 칸은 정답 순서 표시
        const displayNum = phase === 'recall'
          ? (state === 'user-missed' ? stepNum : userStep)
          : stepNum;

        return (
          <motion.button
            key={idx}
            onClick={() => onTap(idx)}
            whileTap={state === 'idle' && !disabled ? { scale: 0.85 } : {}}
            animate={state === 'user-missed' ? { scale: [0.85, 1] } : {}}
            transition={{ duration: 0.25 }}
            disabled={disabled || (phase === 'recall' && userPath.includes(idx))}
            className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold ${cellClass} transition-colors disabled:cursor-not-allowed`}
          >
            <AnimatePresence>
              {displayNum !== null && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {displayNum}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}
