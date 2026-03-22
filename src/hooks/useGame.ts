import { useState, useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { supabase } from '../lib/supabase';
import { getLocalCategoryForDate } from '../lib/localCategories';

function getMsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

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
        setCategory(getLocalCategoryForDate(today));
        setIsLoading(false);
        return;
      }

      const { data: wordsData, error: wordsError } = await supabase
        .from('words')
        .select('id, word')
        .eq('category_id', categoryData.id);

      if (wordsError || !wordsData) {
        setCategory(getLocalCategoryForDate(today));
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
      setCategory(getLocalCategoryForDate(today));
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
