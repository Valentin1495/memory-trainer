import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameMode, GamePhase, Word, DailyCategory, Difficulty } from '../types';
import { DIFFICULTY_CONFIG } from '../types';

interface GameStore {
  phase: GamePhase;
  mode: GameMode;
  difficulty: Difficulty;
  category: DailyCategory | null;
  shownWords: Word[];   // 암기 단계에서 보여주는 단어
  allWords: Word[];     // 선택지 전체 (셔플)
  selectedWords: string[];
  correctSelections: string[];
  wrongCount: number;
  reviewCount: number;
  startTime: number | null;
  endTime: number | null;
  nickname: string;
  isSuccess: boolean | null;
  missedWordsSnapshot: Word[];  // 게임 종료 시점에 확정된 놓친 단어 목록

  setPhase: (phase: GamePhase) => void;
  setMode: (mode: GameMode) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setCategory: (category: DailyCategory) => void;
  setNickname: (nickname: string) => void;
  startGame: () => void;
  selectWord: (wordId: string) => { isCorrect: boolean; isComplete: boolean };
  useReview: () => void;
  endGame: () => void;
  resetGame: () => void;
  getScore: () => number;
  getMissedWords: () => Word[];
  getDifficultyConfig: () => typeof DIFFICULTY_CONFIG[Difficulty];
}

function assignWords(
  rawWords: DailyCategory['words'],
  difficulty: Difficulty
): { shownWords: Word[]; allWords: Word[] } {
  const config = DIFFICULTY_CONFIG[difficulty];
  const needed = config.shownCount + config.decoyCount;

  // 단어가 부족하면 있는 만큼 사용
  const shuffled = [...rawWords].sort(() => Math.random() - 0.5).slice(0, needed);

  const shownCount = Math.min(config.shownCount, shuffled.length);
  const shownWords: Word[] = shuffled
    .slice(0, shownCount)
    .map(w => ({ ...w, notShown: false }));

  const decoyWords: Word[] = shuffled
    .slice(shownCount)
    .map(w => ({ ...w, notShown: true }));

  const allWords = [...shownWords, ...decoyWords].sort(() => Math.random() - 0.5);

  return { shownWords, allWords };
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
  phase: 'home',
  mode: 'basic',
  difficulty: 'medium',
  category: null,
  shownWords: [],
  allWords: [],
  selectedWords: [],
  correctSelections: [],
  wrongCount: 0,
  reviewCount: 0,
  startTime: null,
  endTime: null,
  isSuccess: null,
  missedWordsSnapshot: [],
  nickname: localStorage.getItem('nickname') || '',

  setPhase: (phase) => {
    if (phase === 'choose') {
      set({ phase, startTime: Date.now() });
    } else {
      set({ phase });
    }
  },
  setMode: (mode) => set({ mode }),
  setDifficulty: (difficulty) => {
    set({ difficulty });
    // 카테고리가 이미 로드된 경우 단어 재분배
    const { category } = get();
    if (category) {
      const { shownWords, allWords } = assignWords(category.words, difficulty);
      set({ shownWords, allWords });
    }
  },
  setCategory: (category) => {
    const { difficulty } = get();
    const { shownWords, allWords } = assignWords(category.words, difficulty);
    set({ category, shownWords, allWords });
  },
  setNickname: (nickname) => {
    localStorage.setItem('nickname', nickname);
    set({ nickname });
  },

  startGame: () => {
    set({
      phase: 'memorize',
      selectedWords: [],
      correctSelections: [],
      wrongCount: 0,
      reviewCount: 0,
      startTime: null,
      endTime: null,
      isSuccess: null,
      missedWordsSnapshot: [],
    });
  },

  selectWord: (wordId) => {
    const state = get();
    const { mode, difficulty, shownWords, selectedWords, correctSelections, wrongCount } = state;
    const config = DIFFICULTY_CONFIG[difficulty];

    if (selectedWords.includes(wordId)) {
      return { isCorrect: false, isComplete: false };
    }

    const word = state.allWords.find(w => w.id === wordId);
    if (!word) return { isCorrect: false, isComplete: false };

    // 기본 모드: 봤던 단어(notShown=false) 선택 → 정답
    // 리버스 모드: 안 봤던 단어(notShown=true) 선택 → 정답
    const isCorrectSelection = mode === 'basic' ? !word.notShown : word.notShown;
    const newSelectedWords = [...selectedWords, wordId];

    if (isCorrectSelection) {
      const newCorrectSelections = [...correctSelections, wordId];
      const targetCount = mode === 'basic' ? shownWords.length : config.decoyCount;
      const isComplete = newCorrectSelections.length >= targetCount;

      set({ selectedWords: newSelectedWords, correctSelections: newCorrectSelections });
      if (isComplete) {
        set({ endTime: Date.now(), phase: 'result', isSuccess: true, missedWordsSnapshot: [] });
      }

      return { isCorrect: true, isComplete };
    } else {
      const newWrongCount = wrongCount + 1;
      const isComplete = newWrongCount >= config.maxLives;

      set({ selectedWords: newSelectedWords, wrongCount: newWrongCount });
      if (isComplete) {
        // 게임 종료 시점의 correctSelections로 놓친 단어를 확정 — 이후 words 재셔플에 영향받지 않도록 스냅샷 저장
        const missed = mode === 'basic'
          ? shownWords.filter(w => !correctSelections.includes(w.id))
          : state.allWords.filter(w => w.notShown && !correctSelections.includes(w.id));
        set({ endTime: Date.now(), phase: 'result', isSuccess: false, missedWordsSnapshot: missed });
      }

      return { isCorrect: false, isComplete };
    }
  },

  useReview: () => {
    set((state) => ({ reviewCount: state.reviewCount + 1 }));
  },

  endGame: () => {
    set({ endTime: Date.now(), phase: 'result' });
  },

  resetGame: () => {
    const { category, difficulty } = get();
    if (category) {
      const { shownWords, allWords } = assignWords(category.words, difficulty);
      set({
        phase: 'home',
        shownWords,
        allWords,
        selectedWords: [],
        correctSelections: [],
        wrongCount: 0,
        reviewCount: 0,
        startTime: null,
        endTime: null,
        isSuccess: null,
        missedWordsSnapshot: [],
      });
    } else {
      set({
        phase: 'home',
        selectedWords: [],
        correctSelections: [],
        wrongCount: 0,
        reviewCount: 0,
        startTime: null,
        endTime: null,
        isSuccess: null,
        missedWordsSnapshot: [],
      });
    }
  },

  getScore: () => {
    const { mode, difficulty, wrongCount, reviewCount, startTime, endTime, isSuccess, correctSelections } = get();
    const config = DIFFICULTY_CONFIG[difficulty];

    // 목표 정답 수: basic=보여준 단어 수, reverse=디코이 수
    const targetCount = mode === 'basic' ? config.shownCount : config.decoyCount;
    // 정답 1개당 점수 (성공 시 정답 수 × 정답당 점수 = baseScore)
    const pointsPerCorrect = config.baseScore / targetCount;

    let score = correctSelections.length * pointsPerCorrect;  // 정답 수 반영
    score -= wrongCount * 100;                                 // 오답 패널티
    score -= reviewCount * 150;                               // 다시보기 패널티
    if (startTime && endTime) {
      score -= Math.floor((endTime - startTime) / 1000) * 5; // 시간 패널티 (5점/초)
    }
    if (isSuccess === false) {
      score -= 200;                                           // 실패 추가 패널티
    }
    score = Math.max(0, score);

    if (mode === 'reverse') {
      score = Math.round(score * config.reverseMultiplier);
    }

    return score;
  },

  getMissedWords: () => {
    const { mode, shownWords, allWords, correctSelections } = get();
    if (mode === 'basic') {
      return shownWords.filter(w => !correctSelections.includes(w.id));
    } else {
      return allWords.filter(w => w.notShown && !correctSelections.includes(w.id));
    }
  },

  getDifficultyConfig: () => {
    return DIFFICULTY_CONFIG[get().difficulty];
  },
    }),
    {
      name: 'mc-game-prefs',
      // 모드·난이도·닉네임만 영구 저장, 게임 진행 상태는 제외
      partialize: (state) => ({
        mode: state.mode,
        difficulty: state.difficulty,
        nickname: state.nickname,
      }),
    }
  )
);
