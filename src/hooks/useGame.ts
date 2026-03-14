import { useState, useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { supabase } from '../lib/supabase';
import type { DailyCategory } from '../types';

function getMsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0); // 다음 자정
  return midnight.getTime() - now.getTime();
}

// 데모 데이터: 15개 과일 (난이도에 따라 클라이언트에서 랜덤 분배)
const DEMO_CATEGORY: DailyCategory = {
  id: '1',
  date: new Date().toISOString().split('T')[0],
  name: '과일',
  words: [
    { id: '1', word: '사과' },
    { id: '2', word: '바나나' },
    { id: '3', word: '포도' },
    { id: '4', word: '수박' },
    { id: '5', word: '딸기' },
    { id: '6', word: '오렌지' },
    { id: '7', word: '키위' },
    { id: '8', word: '망고' },
    { id: '9', word: '복숭아' },
    { id: '10', word: '체리' },
    { id: '11', word: '레몬' },
    { id: '12', word: '자두' },
    { id: '13', word: '메론' },
    { id: '14', word: '파인애플' },
    { id: '15', word: '블루베리' },
  ],
};

export function useGame() {
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const {
    phase,
    mode,
    category,
    shownWords,
    allWords,
    selectedWords,
    correctSelections,
    wrongCount,
    reviewCount,
    nickname,
    setPhase,
    setMode,
    setCategory,
    setNickname,
    startGame,
    selectWord,
    useReview: incrementReviewCount,
    resetGame,
    getScore,
    getMissedWords,
  } = useGameStore();

  const fetchTodayCategory = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    // 오늘 날짜 카테고리가 이미 로드된 경우 스킵 (게임 중 단어 재셔플 방지)
    if (category && category.date === today) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {

      const { data: categoryData, error: categoryError } = await supabase
        .from('daily_categories')
        .select('*')
        .eq('date', today)
        .single();

      if (categoryError || !categoryData) {
        setCategory(DEMO_CATEGORY);
        setIsLoading(false);
        return;
      }

      const { data: wordsData, error: wordsError } = await supabase
        .from('words')
        .select('id, word')
        .eq('category_id', categoryData.id);

      if (wordsError || !wordsData) {
        setCategory(DEMO_CATEGORY);
        setIsLoading(false);
        return;
      }

      setCategory({
        id: categoryData.id,
        date: categoryData.date,
        name: categoryData.name,
        words: wordsData.map((w: { id: string; word: string }) => ({
          id: w.id,
          word: w.word,
        })),
      });
    } catch {
      setCategory(DEMO_CATEGORY);
    } finally {
      setIsLoading(false);
    }
  }, [category, setCategory]);

  useEffect(() => {
    fetchTodayCategory();
  }, [fetchTodayCategory]);

  // 자정이 지나면 홈 화면에서 자동으로 다음 날 카테고리로 전환
  const fetchTodayCategoryRef = useRef(fetchTodayCategory);
  fetchTodayCategoryRef.current = fetchTodayCategory;

  useEffect(() => {
    const id = setTimeout(() => {
      // 게임 중이 아닐 때(home 단계)만 즉시 갱신
      // 게임 중이면 홈으로 돌아올 때 날짜 체크로 자동 갱신됨
      const { phase: currentPhase } = useGameStore.getState();
      if (currentPhase === 'home') {
        fetchTodayCategoryRef.current();
      }
    }, getMsUntilMidnight());
    return () => clearTimeout(id);
  }, []);

  const handleStartMemorize = useCallback(() => {
    startGame();
  }, [startGame]);

  const handleWordSelect = useCallback((wordId: string) => {
    return selectWord(wordId);
  }, [selectWord]);

  const handleReviewRequest = useCallback(() => {
    setShowReviewModal(true);
    incrementReviewCount();
  }, [incrementReviewCount]);

  const handleCloseReview = useCallback(() => {
    setShowReviewModal(false);
  }, []);

  return {
    isLoading,
    phase,
    mode,
    category,
    shownWords,
    allWords,
    selectedWords,
    correctSelections,
    wrongCount,
    reviewCount,
    nickname,
    showReviewModal,

    setMode,
    setNickname,
    handleStartMemorize,
    handleWordSelect,
    handleReviewRequest,
    handleCloseReview,
    resetGame,
    getScore,
    getMissedWords,
    setPhase,
  };
}
