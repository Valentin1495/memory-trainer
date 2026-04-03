import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TrainingModuleProps, TrainingSessionResult } from '../../types/training';
import { DIFFICULTY_CONFIG } from '../../types';

const GRID_SIZE = 4;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

const SHAPES = ['circle', 'triangle', 'square', 'star'] as const;
type ShapeId = typeof SHAPES[number];
const SHAPE_LABELS: Record<ShapeId, string> = {
  circle: '원', triangle: '삼각형', square: '사각형', star: '별',
};
/** 도형별 고유 색상 — 암기/리콜 단계에서 사용 */
const SHAPE_COLORS: Record<ShapeId, string> = {
  circle:   '#60a5fa', // blue-400
  triangle: '#facc15', // yellow-400
  square:   '#f472b6', // pink-400
  star:     '#4ade80', // green-400
};

function ShapeIcon({ id, className = '', color }: { id: ShapeId; className?: string; color?: string }) {
  const fill = color ?? SHAPE_COLORS[id];
  switch (id) {
    case 'circle':
      return (
        <svg viewBox="0 0 24 24" className={className} fill={fill}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
    case 'triangle':
      return (
        <svg viewBox="0 0 24 24" className={className} fill={fill}>
          <polygon points="12,2 22,22 2,22" />
        </svg>
      );
    case 'square':
      return (
        <svg viewBox="0 0 24 24" className={className} fill={fill}>
          <rect x="2" y="2" width="20" height="20" rx="2" />
        </svg>
      );
    case 'star':
      return (
        <svg viewBox="0 0 24 24" className={className} fill={fill}>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      );
  }
}
const SHAPE_COUNT: Record<string, number> = { easy: 3, medium: 5, hard: 7 };
const SHOW_MS:    Record<string, number>  = { easy: 2000, medium: 1500, hard: 1000 };

interface ShapeCell {
  cellIndex: number;
  shape: ShapeId;
}

/** 사용자가 입력한 답: 칸 번호 → 도형 */
type UserAnswer = { cellIndex: number; shape: ShapeId };

function generatePlacements(count: number): ShapeCell[] {
  const cells = Array.from({ length: TOTAL_CELLS }, (_, i) => i);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  return cells.slice(0, count).map((cellIndex, i) => ({
    cellIndex,
    shape: SHAPES[i % SHAPES.length],
  }));
}

type Phase = 'memorize' | 'ready' | 'recall' | 'done';

export function ShapeLocationModule({ difficulty, onComplete, onExit }: TrainingModuleProps) {
  const shapeCount = SHAPE_COUNT[difficulty] ?? 3;
  const showMs     = SHOW_MS[difficulty]     ?? 2000;
  const baseScore  = DIFFICULTY_CONFIG[difficulty].baseScore;

  const [placements]                    = useState<ShapeCell[]>(() => generatePlacements(shapeCount));
  const [phase, setPhase]               = useState<Phase>('memorize');
  const [answers, setAnswers]           = useState<UserAnswer[]>([]);
  const answersRef                      = useRef<UserAnswer[]>([]);
  /** 현재 도형을 고를 칸 인덱스 (null이면 팝업 닫힘) */
  const [pendingCell, setPendingCell]   = useState<number | null>(null);
  const [revealed, setRevealed]         = useState(false);
  const [resultReady, setResultReady]   = useState<TrainingSessionResult | null>(null);
  const startTimeRef                    = useRef<number>(Date.now());
  const completedRef                    = useRef(false);

  useEffect(() => {
    if (phase !== 'memorize') return;
    const t = setTimeout(() => setPhase('ready'), showMs + 400);
    return () => clearTimeout(t);
  }, [phase, showMs]);

  const answeredCells = new Set(answers.map(a => a.cellIndex));

  /** 칸을 탭하면 도형 선택 팝업을 띄움 */
  const handleCellTap = useCallback((cellIndex: number) => {
    if (phase !== 'recall' || revealed) return;
    if (answeredCells.has(cellIndex)) return;
    setPendingCell(cellIndex);
  }, [phase, revealed, answeredCells]);

  /** 도형 선택 완료 */
  const handleShapePick = useCallback((shape: ShapeId) => {
    if (pendingCell === null) return;
    const newAnswers = [...answersRef.current, { cellIndex: pendingCell, shape }];
    answersRef.current = newAnswers;
    setPendingCell(null);
    setAnswers(newAnswers);

    if (newAnswers.length === shapeCount) {
      if (completedRef.current) return;
      completedRef.current = true;

      const correctHits = newAnswers.filter(a => {
        const correct = placements.find(p => p.cellIndex === a.cellIndex);
        return correct && correct.shape === a.shape;
      }).length;

      const accuracy = correctHits / shapeCount;
      const score    = Math.round(accuracy * baseScore);
      const timeMs   = Date.now() - startTimeRef.current;
      setRevealed(true);
      setResultReady({
        moduleId: 'shape-location',
        score,
        accuracy,
        timeMs,
        difficulty,
        completedAt: new Date().toISOString(),
        metadata: {
          shapeCount,
          correctHits,
          placements: placements.map(p => `${p.cellIndex}:${p.shape}`).join(','),
          userAnswers: newAnswers.map(a => `${a.cellIndex}:${a.shape}`).join(','),
        },
      } as TrainingSessionResult);
    }
  }, [pendingCell, shapeCount, placements, baseScore, difficulty, onComplete]);

  function cellStatus(idx: number): 'correct' | 'wrong' | 'missed' | 'false-alarm' | 'default' {
    if (!revealed) return 'default';
    const correct  = placements.find(p => p.cellIndex === idx);
    const answered = answersRef.current.find(a => a.cellIndex === idx);
    if (correct && answered)  return answered.shape === correct.shape ? 'correct' : 'wrong';
    if (correct && !answered) return 'missed';
    if (!correct && answered) return 'false-alarm';
    return 'default';
  }

  return (
    <div className="min-h-screen flex flex-col safe-top-training safe-bottom">
      <header className="relative p-4 flex items-center">
        <button onClick={onExit} className="text-white/80 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-white/70 text-sm font-semibold tracking-widest uppercase">도형 위치</span>
      </header>

      {phase === 'recall' && (
        <div className="px-4 pb-2">
          <div className="flex justify-between text-white/60 text-xs mb-1">
            <span>입력</span>
            <span>{answers.length} / {shapeCount}</span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              animate={{ width: `${(answers.length / shapeCount) * 100}%` }}
              transition={{ duration: 0.2 }}
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
            className="flex flex-col items-center gap-6 w-full"
          >
            <div className="text-center">
              <p className="text-white/60 text-sm">어느 칸에 어떤 도형이 있는지 기억하세요</p>
              <p className="text-white font-bold text-lg mt-1">{shapeCount}개 도형</p>
            </div>
            <Grid
              phase="memorize"
              placements={placements}
              answers={[]}
              revealed={false}
              onTap={() => {}}
              cellStatus={() => 'default'}
            />
            <div className="w-full max-w-xs h-1.5 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: showMs / 1000, ease: 'linear' }}
              />
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
            <p className="text-4xl">🔷</p>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">도형을 기억했나요?</h2>
              <p className="text-white/70 text-sm">
                칸을 탭한 뒤 그 칸에 있던 도형을 고르세요 ({shapeCount}개)
              </p>
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
            className="flex flex-col items-center gap-6 w-full"
          >
            <p className="text-white/60 text-sm">
              {revealed ? '결과를 확인하세요' : '도형이 있던 칸을 탭하고 도형을 고르세요'}
            </p>
            <Grid
              phase="recall"
              placements={placements}
              answers={answers}
              revealed={revealed}
              onTap={handleCellTap}
              cellStatus={cellStatus}
            />
            {revealed && resultReady && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="grid grid-cols-2 gap-x-5 gap-y-1.5 text-xs text-white/70"
                >
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500" />
                    정답
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-sm bg-orange-500" />
                    도형 오답
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-sm bg-rose-600" />
                    위치 오답
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-sm border-2 border-yellow-400 bg-slate-600/80" />
                    미선택
                  </span>
                </motion.div>
                <motion.button
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => onComplete(resultReady)}
                  className="w-full max-w-xs py-4 bg-white text-purple-700 font-bold text-lg rounded-2xl shadow-lg"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  결과 보기
                </motion.button>
              </>
            )}
          </motion.div>
        )}
      </main>

      {/* 도형 선택 팝업 */}
      <AnimatePresence>
        {pendingCell !== null && (
          <motion.div
            key="shape-picker"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 pb-safe"
            onClick={() => setPendingCell(null)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="w-full max-w-sm mx-4 mb-6 rounded-3xl bg-white p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <p className="text-center text-sm font-semibold text-gray-500 mb-4">
                {pendingCell + 1}번 칸의 도형을 고르세요
              </p>
              <div className="grid grid-cols-4 gap-3">
                {SHAPES.map(shape => (
                  <motion.button
                    key={shape}
                    onClick={() => handleShapePick(shape)}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    className="flex flex-col items-center gap-1.5 rounded-2xl py-4 font-bold"
                    style={{ backgroundColor: `${SHAPE_COLORS[shape]}22` }}
                  >
                    <ShapeIcon id={shape} className="w-8 h-8" />
                    <span className="text-[10px] font-semibold text-gray-500">{SHAPE_LABELS[shape]}</span>
                  </motion.button>
                ))}
              </div>
              <button
                onClick={() => setPendingCell(null)}
                className="mt-4 w-full rounded-xl border border-gray-200 py-2.5 text-sm text-gray-400 hover:bg-gray-50"
              >
                취소
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface GridProps {
  phase: 'memorize' | 'recall';
  placements: ShapeCell[];
  answers: UserAnswer[];
  revealed: boolean;
  onTap: (idx: number) => void;
  cellStatus: (idx: number) => 'correct' | 'wrong' | 'missed' | 'false-alarm' | 'default';
}

function Grid({ phase, placements, answers, onTap, cellStatus }: GridProps) {
  const placementMap = new Map(placements.map(p => [p.cellIndex, p.shape]));
  const answerMap    = new Map(answers.map(a => [a.cellIndex, a.shape]));

  return (
    <div
      className="grid gap-2 w-full max-w-xs"
      style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
    >
      {Array.from({ length: TOTAL_CELLS }).map((_, idx) => {
        const correctShape = placementMap.get(idx);
        const answeredShape = answerMap.get(idx);
        const status = cellStatus(idx);
        const isAnswered = answerMap.has(idx);

        // 상태별 배경색을 완전히 다르게 분리
        let cellClass = 'bg-white/10 border-2 border-white/20';
        if (phase === 'memorize' && correctShape) {
          cellClass = 'bg-white/25 border-2 border-white/40';
        }
        if (phase === 'recall') {
          if (isAnswered && status === 'default') cellClass = 'bg-white/20 border-2 border-white/40';
          if (status === 'correct')     cellClass = 'bg-emerald-500  border-2 border-emerald-300';  // 초록
          if (status === 'wrong')       cellClass = 'bg-orange-500   border-2 border-orange-300';   // 주황 (위치O 도형X)
          if (status === 'false-alarm') cellClass = 'bg-rose-600     border-2 border-rose-400';     // 진빨강 (위치X)
          if (status === 'missed')      cellClass = 'bg-slate-600/80 border-2 border-yellow-400';   // 어두운 배경 + 노란 테두리
        }

        return (
          <motion.button
            key={idx}
            onClick={() => onTap(idx)}
            whileTap={{ scale: 0.88 }}
            disabled={phase !== 'recall' || isAnswered}
            className={`relative aspect-square rounded-xl flex flex-col items-center justify-center font-bold ${cellClass} disabled:cursor-not-allowed transition-all`}
          >
            <AnimatePresence mode="wait">
              {/* 암기 단계 */}
              {phase === 'memorize' && correctShape && (
                <motion.div key="mem-shape" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <ShapeIcon id={correctShape} className="w-6 h-6" />
                </motion.div>
              )}

              {/* 리콜: 입력 완료된 칸 (결과 공개 전) */}
              {phase === 'recall' && isAnswered && status === 'default' && answeredShape && (
                <motion.div key="ans-shape" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <ShapeIcon id={answeredShape} className="w-6 h-6" />
                </motion.div>
              )}

              {/* 결과: 정답 — 초록 배경 + 도형 + ✓ */}
              {status === 'correct' && answeredShape && (
                <motion.div key="correct" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-0.5">
                  <ShapeIcon id={answeredShape} className="w-7 h-7" color="white" />
                  <span className="text-[11px] font-black text-white leading-none">✓</span>
                </motion.div>
              )}

              {/* 결과: 위치는 맞았으나 도형 틀림 — 주황 배경, 내 답(작게) ▶ 정답(크게) */}
              {status === 'wrong' && answeredShape && correctShape && (
                <motion.div key="wrong" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center" style={{ gap: 1 }}>
                  <ShapeIcon id={answeredShape} className="w-3 h-3 opacity-50" color="white" />
                  <span className="text-[8px] text-white/70 leading-none">↓</span>
                  <ShapeIcon id={correctShape}  className="w-6 h-6" color="white" />
                </motion.div>
              )}

              {/* 결과: 도형 없는 칸 선택 (완전 오답) — 진빨강 + 도형 + ✕ */}
              {status === 'false-alarm' && answeredShape && (
                <motion.div key="false-alarm" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-0.5">
                  <ShapeIcon id={answeredShape} className="w-6 h-6 opacity-60" color="white" />
                  <span className="text-[11px] font-black text-white leading-none">✕</span>
                </motion.div>
              )}

              {/* 결과: 있었지만 못 찾은 칸 — 어두운 배경 + 노란 테두리 + 도형 고유색 */}
              {status === 'missed' && correctShape && (
                <motion.div key="missed" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-0.5">
                  <ShapeIcon id={correctShape} className="w-7 h-7" />
                  <span className="text-[9px] font-bold text-yellow-300 leading-none">미선택</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}
