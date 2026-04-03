import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { ScoreRow } from '../components/leaderboard/ScoreRow';
import type { GameMode, Difficulty } from '../types';

type Period = 'daily' | 'weekly';

const MODULE_TABS = [
  { id: 'word-memory',      label: '단어' },
  { id: 'color-sequence',   label: '색 순서' },
  { id: 'number-sequence',  label: '숫자' },
  { id: 'path-memory',      label: '경로' },
  { id: 'shape-location',   label: '도형' },
] as const;
type ModuleId = typeof MODULE_TABS[number]['id'];

const DIFFICULTY_TABS: { id: Difficulty; label: string; color: string; active: string }[] = [
  { id: 'easy',   label: '🟢 EASY',   color: 'border-green-300 text-green-200',   active: 'bg-green-400 text-white border-green-400' },
  { id: 'medium', label: '🟡 MEDIUM', color: 'border-yellow-300 text-yellow-200', active: 'bg-yellow-400 text-white border-yellow-400' },
  { id: 'hard',   label: '🔴 HARD',   color: 'border-red-300 text-red-200',        active: 'bg-red-400 text-white border-red-400' },
];

export function Leaderboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialModule = (location.state?.moduleId as ModuleId | undefined) ?? 'word-memory';

  const [period, setPeriod]       = useState<Period>('daily');
  const [moduleId, setModuleId]   = useState<ModuleId>(initialModule);
  const [mode, setMode]           = useState<GameMode>('basic');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const isWordMemory = moduleId === 'word-memory';

  const { entries, isLoading, error, myRank, myScore, totalCount } = useLeaderboard({
    period,
    moduleId,
    mode:       isWordMemory ? mode : undefined,
    difficulty,
  });

  const topPercent = myRank && totalCount > 0
    ? Math.ceil((myRank / totalCount) * 100)
    : null;

  return (
    <div className="min-h-screen flex flex-col safe-top safe-bottom">
      <header className="relative p-4 flex items-center">
        <button onClick={() => navigate('/')} className="text-white/80 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-xl font-bold text-white">리더보드</h1>
        <div className="w-6" />
      </header>

      {/* 기간 탭 */}
      <div className="px-4 pt-2">
        <div className="flex bg-white/20 rounded-full p-1 w-fit mx-auto">
          {(['daily', 'weekly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`relative px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                period === p ? 'text-purple-700' : 'text-white/80 hover:text-white'
              }`}
            >
              {period === p && (
                <motion.div
                  layoutId="periodTab"
                  className="absolute inset-0 bg-white rounded-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className="relative z-10">{p === 'daily' ? '오늘' : '이번 주'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 모듈 탭 */}
      <div className="px-4 pt-3 overflow-x-auto">
        <div className="flex gap-2 w-max mx-auto pb-1">
          {MODULE_TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setModuleId(id)}
              className={`relative px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-all whitespace-nowrap ${
                moduleId === id
                  ? 'bg-white text-purple-700 border-white shadow'
                  : 'bg-transparent text-white/70 border-white/30 hover:border-white/60 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 모드 탭 — 단어 기억에만 표시 */}
      <AnimatePresence initial={false}>
        {isWordMemory && (
          <motion.div
            key="mode-tabs"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pt-2 flex gap-2 justify-center">
              {([
                { id: 'basic' as GameMode, label: '기본' },
                { id: 'reverse' as GameMode, label: '리버스' },
              ]).map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setMode(id)}
                  className={`px-5 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
                    mode === id
                      ? 'bg-white text-purple-700 border-white shadow'
                      : 'bg-transparent text-white/70 border-white/30 hover:border-white/60 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 난이도 탭 */}
      <div className="px-4 pt-2 pb-1">
        <div className="flex gap-2 justify-center">
          {DIFFICULTY_TABS.map(({ id, label, color, active }) => (
            <button
              key={id}
              onClick={() => setDifficulty(id)}
              className={`px-4 py-1 rounded-full text-xs font-bold border-2 transition-all ${
                difficulty === id ? active : `bg-transparent ${color} hover:opacity-100 opacity-70`
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 p-4 pb-48 overflow-y-auto">
        {isLoading && (
          <div className="flex justify-center py-12">
            <motion.div
              className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-white/80">{error}</p>
            <p className="text-white/60 text-sm mt-2">Supabase 연결을 확인해주세요</p>
          </div>
        )}

        {!isLoading && !error && entries.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/80 text-lg mb-2">아직 기록이 없어요</p>
            <p className="text-white/60 text-sm">첫 번째 도전자가 되어보세요!</p>
            <motion.button
              onClick={() => navigate('/')}
              className="mt-6 px-6 py-3 bg-white text-purple-600 font-semibold rounded-full"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              게임 시작하기
            </motion.button>
          </div>
        )}

        {!isLoading && !error && entries.length > 0 && (
          <div className="space-y-3">
            {entries.map((entry, index) => (
              <ScoreRow
                key={`${entry.nickname}-${index}`}
                entry={entry}
                isCurrentUser={entry.isMe}
                index={index}
              />
            ))}
          </div>
        )}
      </main>

      {/* 하단 고정 영역 */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto">
        {myRank && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mb-3 rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="bg-white/95 backdrop-blur-sm border border-purple-100 px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">나의 순위</p>
                  <p className="text-2xl font-extrabold text-purple-700">{myRank}위</p>
                </div>
                {topPercent !== null && (
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-0.5">상위</p>
                    <p className="text-2xl font-extrabold text-pink-500">{topPercent}%</p>
                  </div>
                )}
                {myScore !== null && (
                  <div className="text-right">
                    <p className="text-xs text-gray-400 mb-0.5">최고 점수</p>
                    <p className="text-2xl font-extrabold text-gray-800">{myScore.toLocaleString()}점</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
        <div className="pb-6" />
      </div>
    </div>
  );
}
