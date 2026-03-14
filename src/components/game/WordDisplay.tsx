import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Word, Difficulty } from '../../types';
import { WORD_VARIANTS } from './wordAnimations';

const COUNTDOWN_FROM = 3;
const COUNTDOWN_EXIT_DURATION_MS = 300;

type DisplayPhase = 'countdown' | 'flashing' | 'done';

interface WordDisplayProps {
  words: Word[];
  wordDurationMs: number;
  difficulty: Difficulty;
  onComplete: () => void;
}

export function WordDisplay({ words, wordDurationMs, difficulty, onComplete }: WordDisplayProps) {
  const [displayPhase, setDisplayPhase] = useState<DisplayPhase>('countdown');
  const [countdown, setCountdown] = useState(COUNTDOWN_FROM);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showWord, setShowWord] = useState(true);
  const onCompleteRef = useRef(onComplete);

  const variants = WORD_VARIANTS[difficulty];

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (displayPhase !== 'countdown') return;
    if (countdown <= 0) {
      setDisplayPhase('flashing');
      setCurrentIndex(0);
      setShowWord(true);
      return;
    }
    const id = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [displayPhase, countdown]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (displayPhase !== 'flashing') return;
    if (!showWord) {
      const id = setTimeout(() => {
        const next = currentIndex + 1;
        if (next >= words.length) {
          setDisplayPhase('done');
          onCompleteRef.current();
        } else {
          setCurrentIndex(next);
          setShowWord(true);
        }
      }, variants.blankDurationMs);
      return () => clearTimeout(id);
    } else {
      const displayDuration = currentIndex === 0
        ? wordDurationMs + COUNTDOWN_EXIT_DURATION_MS
        : wordDurationMs;
      const id = setTimeout(() => setShowWord(false), displayDuration);
      return () => clearTimeout(id);
    }
  }, [displayPhase, showWord, currentIndex, words.length, wordDurationMs, variants.blankDurationMs]);

  const progress = displayPhase === 'flashing'
    ? ((currentIndex + (showWord ? 0.5 : 1)) / words.length) * 100
    : displayPhase === 'done' ? 100 : 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-xs mb-10">
        <div className="flex justify-between text-white/70 text-sm mb-2">
          <span>
            {displayPhase === 'flashing'
              ? `${currentIndex + 1} / ${words.length}`
              : displayPhase === 'countdown' ? '준비' : '완료'}
          </span>
        </div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-white rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.15 }}
          />
        </div>
      </div>

      <div
        className="relative flex items-center justify-center w-72 h-44"
        style={variants.wrapperStyle}
      >
        <AnimatePresence mode="wait">

          {/* 카운트다운 */}
          {displayPhase === 'countdown' && (
            <motion.div
              key={`countdown-${countdown}`}
              initial={{ scale: 1.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: COUNTDOWN_EXIT_DURATION_MS / 1000, ease: 'easeOut' }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="bg-white/20 backdrop-blur-sm rounded-3xl w-full h-full flex flex-col items-center justify-center gap-2">
                <span className="text-7xl font-black text-white">
                  {countdown === 0 ? 'GO!' : countdown}
                </span>
                <span className="text-white/70 text-sm">
                  {countdown > 0 ? '집중하세요' : '시작!'}
                </span>
              </div>
            </motion.div>
          )}

          {/* HARD: 카드 고정 + 텍스트만 슬라이드 */}
          {displayPhase === 'flashing' && variants.textOnly && (
            <motion.div
              key="hard-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="bg-white rounded-3xl shadow-2xl w-full h-full flex items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                  {showWord && (
                    <motion.span
                      key={`word-${currentIndex}`}
                      initial={variants.initial}
                      animate={variants.animate}
                      exit={variants.exit}
                      transition={variants.transition}
                      className="text-5xl font-bold text-gray-800 tracking-tight"
                    >
                      {words[currentIndex]?.word}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* EASY/MEDIUM: 카드 전체 애니메이션 */}
          {displayPhase === 'flashing' && !variants.textOnly && showWord && (
            <motion.div
              key={`word-${currentIndex}`}
              initial={variants.initial}
              animate={variants.animate}
              exit={variants.exit}
              transition={variants.transition}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="bg-white rounded-3xl shadow-2xl w-full h-full flex items-center justify-center">
                <span className="text-5xl font-bold text-gray-800 tracking-tight">
                  {words[currentIndex]?.word}
                </span>
              </div>
            </motion.div>
          )}

          {displayPhase === 'flashing' && !variants.textOnly && !showWord && (
            <motion.div
              key={`blank-${currentIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0"
            />
          )}

        </AnimatePresence>
      </div>

      <p className="mt-10 text-white/50 text-sm text-center">
        {displayPhase === 'countdown' && '단어가 자동으로 지나갑니다'}
        {displayPhase === 'flashing' && '집중!'}
      </p>
    </div>
  );
}
