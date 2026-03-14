import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import type { Word, Difficulty } from '../../types';
import { WORD_VARIANTS } from './wordAnimations';

const REVIEW_MODAL_START_DELAY_MS = 120;

interface ReviewModalProps {
  isOpen: boolean;
  words: Word[];
  wordDurationMs: number;
  difficulty: Difficulty;
  onClose: () => void;
  penaltyPoints: number;
}

export function ReviewModal({ isOpen, words, wordDurationMs, difficulty, onClose, penaltyPoints }: ReviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showWord, setShowWord] = useState(false);
  const [started, setStarted] = useState(false);
  const onCloseRef = useRef(onClose);

  const variants = WORD_VARIANTS[difficulty];
  const isHard = variants.textOnly;
  const hardWordControls = useAnimationControls();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isOpen) return;
    setCurrentIndex(0);
    setShowWord(false);
    setStarted(false);
    hardWordControls.set({ opacity: 0 });
    const id = setTimeout(() => {
      setStarted(true);
      if (!isHard) {
        setShowWord(true);
      }
    }, REVIEW_MODAL_START_DELAY_MS);
    return () => clearTimeout(id);
  }, [isOpen, isHard, hardWordControls]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!isOpen || !started || isHard) return;
    if (showWord) {
      const id = setTimeout(() => setShowWord(false), wordDurationMs);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => {
      const next = currentIndex + 1;
      if (next >= words.length) {
        onCloseRef.current();
      } else {
        setCurrentIndex(next);
        setShowWord(true);
      }
    }, variants.blankDurationMs);
    return () => clearTimeout(id);
  }, [isOpen, started, showWord, currentIndex, words.length, wordDurationMs, variants.blankDurationMs, isHard]);

  useEffect(() => {
    if (!isOpen || !started || !isHard || words.length === 0) return;

    let cancelled = false;
    const timeoutIds = new Set<number>();
    let frameId: number | null = null;

    const wait = (ms: number) => new Promise<void>((resolve) => {
      const id = window.setTimeout(() => {
        timeoutIds.delete(id);
        resolve();
      }, ms);
      timeoutIds.add(id);
    });

    const nextFrame = () => new Promise<void>((resolve) => {
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        resolve();
      });
    });

    const runSequence = async () => {
      for (let index = 0; index < words.length; index += 1) {
        if (cancelled) return;

        setCurrentIndex(index);
        hardWordControls.set(variants.initial);
        await nextFrame();
        if (cancelled) return;

        hardWordControls.start(variants.animate, variants.transition);
        if (cancelled) return;

        await wait(wordDurationMs);
        if (cancelled) return;

        const exitAnimation = hardWordControls.start(variants.exit, variants.transition);
        if (cancelled) return;

        await Promise.all([
          exitAnimation,
          wait(variants.blankDurationMs),
        ]);
      }

      if (!cancelled) {
        onCloseRef.current();
      }
    };

    runSequence();

    return () => {
      cancelled = true;
      timeoutIds.forEach((id) => window.clearTimeout(id));
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      hardWordControls.stop();
    };
  }, [
    isOpen,
    started,
    isHard,
    words.length,
    wordDurationMs,
    variants.initial,
    variants.animate,
    variants.exit,
    variants.transition,
    variants.blankDurationMs,
    hardWordControls,
  ]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          <div className="w-full px-4 py-4 flex flex-col items-center gap-1 mb-6">
            <span className="text-white/80 text-base font-semibold">다시 보기</span>
            <span className="text-red-300 text-sm font-medium">-{penaltyPoints}점</span>
          </div>

          <div
            className="relative flex items-center justify-center w-72 h-44"
            style={variants.wrapperStyle}
          >
            <AnimatePresence mode="wait">

              {/* HARD: 카드 고정 + 텍스트만 애니메이션 */}
              {isHard && (
                <motion.div
                  key="hard-review-card"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="bg-white rounded-3xl shadow-2xl w-full h-full flex items-center justify-center overflow-hidden">
                    {started && (
                      <motion.div
                        initial={variants.initial}
                        animate={hardWordControls}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <span className="text-5xl font-bold text-gray-800 tracking-tight">
                          {words[currentIndex]?.word}
                        </span>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* EASY/MEDIUM: 카드 전체 애니메이션 */}
              {!isHard && showWord && (
                <motion.div
                  key={`review-word-${currentIndex}`}
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

            </AnimatePresence>
          </div>

          <div className="mt-10" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
