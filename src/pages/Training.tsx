import { Suspense, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getTrainingModule } from '../training/registry';
import { useTrainingSession } from '../hooks/useTrainingSession';
import { useUserProfileStore } from '../store/userProfileStore';
import { useGameStore } from '../store/gameStore';
import type { TrainingSessionResult } from '../types/training';

export function Training() {
  const { moduleId = 'word-memory' } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { saveSession } = useTrainingSession();
  const updateLastModule = useUserProfileStore(s => s.updateLastModule);
  const { difficulty, mode } = useGameStore();

  const moduleDef = getTrainingModule(moduleId);

  useEffect(() => {
    if (!moduleDef) {
      navigate('/');
    }
  }, [moduleDef, navigate]);

  if (!moduleDef) return null;

  const handleComplete = (result: TrainingSessionResult) => {
    saveSession(result);
    updateLastModule(result.moduleId);
    navigate('/session-result', { state: { result } });
  };

  const handleExit = () => {
    navigate('/');
  };

  const TrainingComponent = moduleDef.component;

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
        difficulty={difficulty}
        mode={mode}
        onComplete={handleComplete}
        onExit={handleExit}
      />
    </Suspense>
  );
}
