import { useEffect, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDiagnosis } from '../hooks/useDiagnosis';
import { useGameStore } from '../store/gameStore';
import { useUserProfileStore } from '../store/userProfileStore';
import { useGame } from '../hooks/useGame';
import { getTrainingModule } from '../training/registry';
import type { TrainingSessionResult } from '../types/training';

const wordMemoryDef = getTrainingModule('word-memory');
const WordMemoryModule = wordMemoryDef!.component;

const STEP_LABELS = {
  easy: { label: 'EASY', color: 'text-green-400', desc: '8개 단어 · 1.0초' },
  medium: { label: 'MEDIUM', color: 'text-yellow-400', desc: '10개 단어 · 0.7초' },
  hard: { label: 'HARD', color: 'text-red-400', desc: '12개 단어 · 0.5초' },
};

export function Diagnosis() {
  const navigate = useNavigate();
  const deferDiagnosis = useUserProfileStore(s => s.deferDiagnosis);
  const { setDifficulty, setMode, startGame } = useGameStore();
  const { isLoading } = useGame();
  const {
    step,
    currentDifficulty,
    progress,
    completedSteps,
    totalSteps,
    startDiagnosis,
    handleStepComplete,
    handleStepExit,
  } = useDiagnosis();

  // 스텝이 바뀔 때마다 게임 상태를 초기화하고 난이도 세팅
  useEffect(() => {
    if (currentDifficulty) {
      setDifficulty(currentDifficulty);
      setMode('basic');
    }
  }, [currentDifficulty, setDifficulty, setMode]);

  useEffect(() => {
    if (currentDifficulty && !isLoading) {
      startGame();
    }
  // 카테고리 로딩 완료 시에만 startGame 호출
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDifficulty, isLoading]);

  useEffect(() => {
    if (step === 'complete') {
      navigate('/');
    }
  }, [step, navigate]);

  const onModuleComplete = (result: TrainingSessionResult) => {
    handleStepComplete(result);
  };

  const handleLater = () => {
    deferDiagnosis();
    navigate('/', { replace: true });
  };

  if (step === 'intro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 safe-top safe-bottom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <p className="text-5xl mb-4">🔬</p>
            <h1 className="text-2xl font-bold text-white mb-3">초기 진단 테스트</h1>
            <p className="text-white/70 text-sm leading-relaxed">
              현재 기억력 수준을 측정하여<br />
              맞춤 훈련 프로그램을 설계합니다.
            </p>
          </div>

          <div className="bg-white/10 rounded-2xl p-5 mb-6 space-y-4">
            <p className="text-white font-semibold text-sm mb-3">진행 순서</p>
            {(['easy', 'medium', 'hard'] as const).map((d, i) => {
              const meta = STEP_LABELS[d];
              return (
                <div key={d} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">
                    {i + 1}
                  </div>
                  <div>
                    <span className={`font-bold text-sm ${meta.color}`}>{meta.label}</span>
                    <span className="text-white/60 text-xs ml-2">{meta.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-white/50 text-xs text-center mb-6">
            총 3단계 · 약 2~3분 소요
          </p>

          <motion.button
            onClick={startDiagnosis}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-white text-purple-700 font-bold rounded-xl shadow"
          >
            진단 시작
          </motion.button>
          <button
            onClick={handleLater}
            className="w-full mt-3 py-3 text-white/50 text-sm"
          >
            나중에 하기
          </button>
        </motion.div>
      </div>
    );
  }

  if (currentDifficulty && step !== 'complete') {
    const meta = STEP_LABELS[currentDifficulty];
    return (
      <div className="min-h-screen flex flex-col safe-top safe-bottom">
        {/* 진단 진행률 헤더 */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/70 text-xs">진단 테스트</span>
            <span className={`text-xs font-bold ${meta.color}`}>
              {completedSteps + 1} / {totalSteps} — {meta.label}
            </span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              animate={{ width: `${progress + (100 / totalSteps) * 0.5}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentDifficulty}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1"
          >
            <Suspense fallback={
              <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            }>
              <WordMemoryModule
                difficulty={currentDifficulty}
                mode="basic"
                onComplete={onModuleComplete}
                onExit={handleStepExit}
              />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
    </div>
  );
}
