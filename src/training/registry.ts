import { lazy } from 'react';
import type { TrainingModuleDefinition } from '../types/training';

const WordMemoryModule = lazy(() =>
  import('./modules/WordMemoryModule').then(m => ({ default: m.WordMemoryModule }))
);

const ColorSequenceModule = lazy(() =>
  import('./modules/ColorSequenceModule').then(m => ({ default: m.ColorSequenceModule }))
);

const ShapeLocationModule = lazy(() =>
  import('./modules/ShapeLocationModule').then(m => ({ default: m.ShapeLocationModule }))
);

const NumberSequenceModule = lazy(() =>
  import('./modules/NumberSequenceModule').then(m => ({ default: m.NumberSequenceModule }))
);

const PathMemoryModule = lazy(() =>
  import('./modules/PathMemoryModule').then(m => ({ default: m.PathMemoryModule }))
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
  {
    id: 'color-sequence',
    name: '색 순서',
    description: '색상이 깜빡이는 순서를 기억하고 재현하세요',
    icon: '🎨',
    supportedDifficulties: ['easy', 'medium', 'hard'],
    component: ColorSequenceModule,
  },
  {
    id: 'shape-location',
    name: '도형 위치',
    description: '그리드에서 도형의 위치를 기억하고 맞추세요',
    icon: '🔷',
    supportedDifficulties: ['easy', 'medium', 'hard'],
    component: ShapeLocationModule,
  },
  {
    id: 'number-sequence',
    name: '숫자 순서',
    description: '숫자가 나타나는 순서를 기억하고 입력하세요',
    icon: '🔢',
    supportedDifficulties: ['easy', 'medium', 'hard'],
    component: NumberSequenceModule,
  },
  {
    id: 'path-memory',
    name: '경로 기억',
    description: '그리드에서 이동하는 경로를 기억하고 재현하세요',
    icon: '🗺️',
    supportedDifficulties: ['easy', 'medium', 'hard'],
    component: PathMemoryModule,
  },
];

export function getTrainingModule(moduleId: string): TrainingModuleDefinition | undefined {
  return TRAINING_REGISTRY.find(m => m.id === moduleId);
}
