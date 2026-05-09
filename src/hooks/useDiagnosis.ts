import { useState, useCallback } from 'react';
import { useHistoryStore } from '../store/historyStore';
import { useUserProfileStore } from '../store/userProfileStore';
import { calculateBaselineDifficulty, calculateDiagnosisStepScore } from '../lib/recommendation';
import type { Difficulty } from '../types';
import type { TrainingSessionResult } from '../types/training';

export type DiagnosisStep = 'intro' | 'easy' | 'medium' | 'hard' | 'complete';

interface DiagnosisResult {
  easy: number;
  medium: number;
  hard: number;
}

const STEP_ORDER: DiagnosisStep[] = ['intro', 'easy', 'medium', 'hard', 'complete'];

export function useDiagnosis() {
  const [step, setStep] = useState<DiagnosisStep>('intro');
  const [results, setResults] = useState<Partial<DiagnosisResult>>({});
  const [mode, setMode] = useState<'quick' | 'full'>('full');
  const addSession = useHistoryStore(s => s.addSession);
  const completeDiagnosis = useUserProfileStore(s => s.completeDiagnosis);

  const currentDifficulty: Difficulty | null =
    step === 'easy' ? 'easy' :
    step === 'medium' ? 'medium' :
    step === 'hard' ? 'hard' : null;

  const stepIndex = STEP_ORDER.indexOf(step);
  const totalSteps = mode === 'quick' ? 1 : 3;
  const completedSteps = Math.max(0, stepIndex - 1);
  const progress = (completedSteps / totalSteps) * 100;

  const startDiagnosis = useCallback(() => {
    setMode('full');
    setResults({});
    setStep('easy');
  }, []);

  const startQuickDiagnosis = useCallback(() => {
    setMode('quick');
    setResults({});
    setStep('easy');
  }, []);

  const handleStepComplete = useCallback((result: TrainingSessionResult) => {
    const difficulty = result.difficulty as Difficulty;
    const diagnosisScore = calculateDiagnosisStepScore(
      difficulty,
      result.accuracy,
      result.timeMs,
      Number(result.metadata.wrongCount ?? 0),
      Number(result.metadata.reviewCount ?? 0)
    );
    const newResults = { ...results, [difficulty]: diagnosisScore };
    setResults(newResults);

    addSession({
      moduleId: result.moduleId,
      score: diagnosisScore,
      accuracy: result.accuracy,
      timeMs: result.timeMs,
      difficulty: result.difficulty,
      completedAt: result.completedAt,
      metadata: {
        ...result.metadata,
        isDiagnosis: true,
        rawTrainingScore: result.score,
        diagnosisScore,
      },
    });

    if (mode === 'quick') {
      completeDiagnosis(diagnosisScore, 'easy');
      setStep('complete');
      return;
    }

    if (difficulty === 'easy') {
      setStep('medium');
    } else if (difficulty === 'medium') {
      setStep('hard');
    } else if (difficulty === 'hard') {
      const finalResults = newResults as DiagnosisResult;
      const baselineDifficulty = calculateBaselineDifficulty(
        finalResults.easy ?? 0,
        finalResults.medium ?? 0,
        finalResults.hard ?? 0
      );
      const avgScore = Math.round(
        ((finalResults.easy ?? 0) + (finalResults.medium ?? 0) + (finalResults.hard ?? 0)) / 3
      );
      completeDiagnosis(avgScore, baselineDifficulty);
      setStep('complete');
    }
  }, [mode, results, addSession, completeDiagnosis]);

  const handleStepExit = useCallback(() => {
    // 진단 중 이탈: 현재까지 결과로 마무리
    const partialResults = results as Partial<DiagnosisResult>;
    const easy = partialResults.easy ?? 0;
    const medium = partialResults.medium ?? 0;
    const hard = partialResults.hard ?? 0;
    const baselineDifficulty = calculateBaselineDifficulty(easy, medium, hard);
    const count = [easy, medium, hard].filter(v => v > 0).length;
    const avgScore = count > 0 ? Math.round((easy + medium + hard) / count) : 0;
    completeDiagnosis(avgScore, baselineDifficulty);
    setStep('complete');
  }, [results, completeDiagnosis]);

  return {
    step,
    currentDifficulty,
    progress,
    completedSteps,
    totalSteps,
    results,
    startDiagnosis,
    startQuickDiagnosis,
    handleStepComplete,
    handleStepExit,
  };
}
