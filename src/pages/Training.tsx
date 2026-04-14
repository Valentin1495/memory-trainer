import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getTrainingModule } from '../training/registry';
import { useTrainingSession } from '../hooks/useTrainingSession';
import { useUserProfileStore } from '../store/userProfileStore';
import { useGameStore } from '../store/gameStore';
import type { Difficulty, GameMode } from '../types';
import type { TrainingSessionResult } from '../types/training';

type TrainingLocationState = {
  autoStart?: boolean;
  initialDifficulty?: Difficulty;
  initialMode?: GameMode;
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: '쉬움',
  medium: '보통',
  hard: '어려움',
};

export function Training() {
  const { moduleId = 'word-memory' } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { saveSession } = useTrainingSession();
  const updateLastModule = useUserProfileStore(s => s.updateLastModule);
  const difficulty = useGameStore(s => s.difficulty);
  const mode = useGameStore(s => s.mode);
  const setDifficulty = useGameStore(s => s.setDifficulty);
  const setMode = useGameStore(s => s.setMode);
  const startGame = useGameStore(s => s.startGame);

  const moduleDef = getTrainingModule(moduleId);
  const navigationState = (location.state as TrainingLocationState | null) ?? null;
  const isWordModule = moduleId === 'word-memory';
  const shouldAutoStart = navigationState?.autoStart === true;
  const initialDifficulty = navigationState?.initialDifficulty ?? difficulty;
  const initialMode = isWordModule ? (navigationState?.initialMode ?? mode) : 'basic';
  const hasInitializedRef = useRef(false);

  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(initialDifficulty);
  const [selectedMode, setSelectedMode] = useState<GameMode>(initialMode);
  const [hasStarted, setHasStarted] = useState(shouldAutoStart);
  const [skipReadyScreen, setSkipReadyScreen] = useState(false);

  useEffect(() => {
    if (!moduleDef) {
      navigate('/');
    }
  }, [moduleDef, navigate]);

  useEffect(() => {
    setSelectedDifficulty(initialDifficulty);
    setSelectedMode(initialMode);
    setHasStarted(shouldAutoStart);
    setSkipReadyScreen(false);
    hasInitializedRef.current = true;
  // Reinitialize only when the route entry changes, not when store difficulty/mode updates after clicking start.
  }, [moduleId, location.key]);

  useEffect(() => {
    if (!moduleDef || !shouldAutoStart || !hasInitializedRef.current) return;

    setDifficulty(initialDifficulty);
    setMode(initialMode);
    startGame();
  }, [initialDifficulty, initialMode, moduleDef, setDifficulty, setMode, shouldAutoStart, startGame]);

  const startSelectedTraining = () => {
    const nextMode = isWordModule ? selectedMode : 'basic';
    setDifficulty(selectedDifficulty);
    setMode(nextMode);
    startGame();
    setSkipReadyScreen(true);
    setHasStarted(true);
  };

  const handleComplete = (result: TrainingSessionResult) => {
    saveSession(result);
    updateLastModule(result.moduleId);
    navigate('/session-result', { state: { result } });
  };

  const handleExit = () => {
    navigate('/');
  };

  const difficultyButtons = useMemo(
    () =>
      (['easy', 'medium', 'hard'] as Difficulty[]).map(level => {
        const isActive = selectedDifficulty === level;
        const styles = {
          easy: isActive ? 'border-emerald-300 bg-emerald-400 text-slate-950' : 'border-white/15 bg-white/8 text-white/70',
          medium: isActive ? 'border-amber-300 bg-amber-400 text-slate-950' : 'border-white/15 bg-white/8 text-white/70',
          hard: isActive ? 'border-rose-300 bg-rose-400 text-slate-950' : 'border-white/15 bg-white/8 text-white/70',
        };

        return (
          <button
            key={level}
            onClick={() => setSelectedDifficulty(level)}
            className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition-colors ${styles[level]}`}
          >
            {DIFFICULTY_LABELS[level]}
          </button>
        );
      }),
    [selectedDifficulty]
  );

  if (!moduleDef) return null;

  const TrainingComponent = moduleDef.component;

  if (!hasStarted) {
    return (
      <div className="min-h-screen safe-top safe-bottom">
        <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col px-4 py-4">
          <header className="mb-8 flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <p className="text-xs font-semibold tracking-[0.22em] text-white/45">훈련 설정</p>
            <div className="w-10" />
          </header>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[28px] border border-white/10 bg-white/8 p-6 shadow-2xl backdrop-blur-sm"
          >
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12 text-3xl">
                {moduleDef.icon}
              </div>
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-white/45">기능 진입</p>
                <h1 className="mt-1 text-2xl font-bold text-white">{moduleDef.name}</h1>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-white/72">{moduleDef.description}</p>

            <section className="mt-8">
              <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-white/45">난이도</p>
              <div className="grid grid-cols-3 gap-2">{difficultyButtons}</div>
            </section>

            {isWordModule && (
              <section className="mt-6">
                <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-white/45">모드</p>
                <p className="mb-3 text-sm leading-relaxed text-white/65">
                  기본 모드는 방금 본 단어를 고르는 방식이고, 리버스 모드는 보지 못한 단어를 찾아야 하는 더 어려운 방식입니다.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: 'basic' as GameMode, label: '기본' },
                    { id: 'reverse' as GameMode, label: '리버스' },
                  ]).map(option => {
                    const active = selectedMode === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => setSelectedMode(option.id)}
                        className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition-colors ${
                          active
                            ? 'border-fuchsia-300 bg-fuchsia-500 text-white'
                            : 'border-white/15 bg-white/8 text-white/70'
                        }`}
                      >
                        <span className="block">{option.label}</span>
                        <span className={`mt-1 block text-xs font-medium ${active ? 'text-white/80' : 'text-white/45'}`}>
                          {option.id === 'basic' ? '본 단어 고르기' : '안 본 단어 고르기'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            <motion.button
              onClick={startSelectedTraining}
              whileTap={{ scale: 0.98 }}
              className="mt-8 w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 py-4 text-base font-bold text-white shadow-lg"
            >
              훈련 시작하기
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    }>
      <TrainingComponent
        difficulty={isWordModule ? selectedDifficulty : difficulty}
        mode={isWordModule ? selectedMode : 'basic'}
        skipReadyScreen={skipReadyScreen}
        onComplete={handleComplete}
        onExit={handleExit}
      />
    </Suspense>
  );
}
