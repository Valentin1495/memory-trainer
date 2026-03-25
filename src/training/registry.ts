import { lazy } from 'react';
import type { TrainingModuleDefinition } from '../types/training';

const WordMemoryModule = lazy(() =>
  import('./modules/WordMemoryModule').then(m => ({ default: m.WordMemoryModule }))
);

export const TRAINING_REGISTRY: TrainingModuleDefinition[] = [
  {
    id: 'word-memory',
    name: '단어 기억',
    description: '빠르게 지나가는 단어를 기억하고 맞추세요',
    icon: '📝',
    supportedDifficulties: ['easy', 'medium', 'hard'],
    component: WordMemoryModule,
  },
  // 향후 추가
  // { id: 'color-sequence', name: '색 순서', ... }
];

export function getTrainingModule(moduleId: string): TrainingModuleDefinition | undefined {
  return TRAINING_REGISTRY.find(m => m.id === moduleId);
}
