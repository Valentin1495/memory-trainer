import { motion } from 'framer-motion';
import type { Word, GameMode } from '../../types';

interface ChoiceGridProps {
  words: Word[];
  selectedWords: string[];
  correctSelections: string[];
  mode: GameMode;
  onSelect: (wordId: string) => void;
  disabled?: boolean;
}

export function ChoiceGrid({
  words,
  selectedWords,
  correctSelections,
  mode,
  onSelect,
  disabled = false,
}: ChoiceGridProps) {
  const getCardState = (word: Word): 'default' | 'correct' | 'wrong' | 'selected' => {
    if (!selectedWords.includes(word.id)) return 'default';
    
    const isCorrectTarget = mode === 'basic' ? !word.notShown : word.notShown;
    
    if (correctSelections.includes(word.id)) return 'correct';
    if (selectedWords.includes(word.id) && !isCorrectTarget) return 'wrong';
    return 'selected';
  };

  const getCardStyles = (state: 'default' | 'correct' | 'wrong' | 'selected') => {
    switch (state) {
      case 'correct':
        return 'bg-green-500 text-white border-green-600';
      case 'wrong':
        return 'bg-red-500 text-white border-red-600';
      case 'selected':
        return 'bg-blue-500 text-white border-blue-600';
      default:
        return 'bg-white text-gray-800 border-gray-200 hover:border-purple-400 hover:shadow-lg';
    }
  };

  return (
    <div className="grid grid-cols-3 gap-3 p-4 max-w-lg mx-auto">
      {words.map((word, index) => {
        const state = getCardState(word);
        const isDisabled = disabled || selectedWords.includes(word.id);

        return (
          <motion.button
            key={word.id}
            onClick={() => !isDisabled && onSelect(word.id)}
            disabled={isDisabled}
            className={`
              p-4 rounded-xl border-2 font-medium text-lg
              transition-colors duration-200
              ${getCardStyles(state)}
              ${isDisabled ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}
            `}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={!isDisabled ? { scale: 1.05 } : {}}
            whileTap={!isDisabled ? { scale: 0.95 } : {}}
          >
            {word.word}
          </motion.button>
        );
      })}
    </div>
  );
}
