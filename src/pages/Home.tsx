import { useRef, useState, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../hooks/useGame';
import { useGameStore } from '../store/gameStore';
import { useSettingsStore } from '../store/settingsStore';
import { purchaseNoAds, restorePurchases, getNoAdsPrice } from '../lib/iap';
import { DIFFICULTY_CONFIG } from '../types';
import type { GameMode, Difficulty } from '../types';

const DIFFICULTY_META = {
  easy: {
    label: 'EASY',
    emoji: '🟢',
    color: 'border-green-400 bg-green-50',
    activeColor: 'border-green-500 bg-green-100 ring-2 ring-green-300',
    textColor: 'text-green-700',
    description: '쉬움',
  },
  medium: {
    label: 'MEDIUM',
    emoji: '🟡',
    color: 'border-yellow-400 bg-yellow-50',
    activeColor: 'border-yellow-500 bg-yellow-100 ring-2 ring-yellow-300',
    textColor: 'text-yellow-700',
    description: '보통',
  },
  hard: {
    label: 'HARD',
    emoji: '🔴',
    color: 'border-red-400 bg-red-50',
    activeColor: 'border-red-500 bg-red-100 ring-2 ring-red-300',
    textColor: 'text-red-700',
    description: '어려움',
  },
} as const;

export function Home() {
  const navigate = useNavigate();
  const { isLoading, category, nickname, setNickname, setMode, handleStartMemorize } = useGame();
  const { difficulty, setDifficulty, mode: storedMode } = useGameStore();
  const { adRemoved } = useSettingsStore();
  const [confirmedNickname, setConfirmedNickname] = useState(nickname);
  const [draftNickname, setDraftNickname] = useState(nickname);
  const [isEditingNickname, setIsEditingNickname] = useState(!nickname);
  const [nicknameError, setNicknameError] = useState(false);
  const [selectedMode, setSelectedMode] = useState<GameMode>(storedMode);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(difficulty);
  const [iapLoading, setIapLoading] = useState(false);
  const [showIapSheet, setShowIapSheet] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleStartEdit = () => {
    // flushSync로 display:none → 표시 전환을 동기 처리한 뒤 focus()
    // input이 항상 DOM에 있으므로 element mount 대기 없이 즉시 class만 변경됨
    // → iOS/Android WebView 제스처 컨텍스트 안에서 focus() 완료 → 키보드 팝업
    flushSync(() => {
      setDraftNickname(confirmedNickname);
      setIsEditingNickname(true);
      setNicknameError(false);
    });
    inputRef.current?.focus();
  };

  const handleConfirmEdit = () => {
    const trimmed = draftNickname.trim();
    if (!trimmed) return;
    setConfirmedNickname(trimmed);
    setNickname(trimmed);
    setIsEditingNickname(false);
    setNicknameError(false);
  };

  const handleCancelEdit = () => {
    setDraftNickname(confirmedNickname);
    setIsEditingNickname(false);
    setNicknameError(false);
  };

  const handleStart = () => {
    const name = confirmedNickname.trim();
    if (!name) {
      setNicknameError(true);
      setIsEditingNickname(true);
      inputRef.current?.focus();
      return;
    }
    setNickname(name);
    setMode(selectedMode);
    setDifficulty(selectedDifficulty);
    handleStartMemorize();
    navigate('/game');
  };

  const handlePurchaseNoAds = useCallback(async () => {
    setIapLoading(true);
    await purchaseNoAds();
    setIapLoading(false);
    setShowIapSheet(false);
  }, []);

  const handleRestorePurchases = useCallback(async () => {
    setIapLoading(true);
    try {
      await restorePurchases();
    } catch {
      // 취소 또는 실패 — 시트 유지
    } finally {
      setIapLoading(false);
    }
  }, []);

  const config = DIFFICULTY_CONFIG[selectedDifficulty];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto safe-top-home safe-bottom">

      {/* 광고 제거 바텀 시트 */}
      <AnimatePresence>
        {showIapSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/40"
              onClick={() => setShowIapSheet(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-40 bg-white rounded-t-3xl px-6 pt-5 pb-8 safe-bottom"
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
              <h3 className="text-lg font-bold text-gray-800 mb-1">광고 없이 즐기기</h3>
              <p className="text-sm text-gray-500 mb-6">
                전면 광고를 영구 제거합니다.{getNoAdsPrice() ? ` (${getNoAdsPrice()})` : ''}
              </p>
              <button
                onClick={handlePurchaseNoAds}
                disabled={iapLoading}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg disabled:opacity-60 mb-3"
              >
                {iapLoading ? '처리 중...' : '구매하기'}
              </button>
              <button
                onClick={handleRestorePurchases}
                disabled={iapLoading}
                className="w-full py-3 text-gray-400 text-sm font-medium disabled:opacity-50"
              >
                이미 구매했어요 (복원)
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="min-h-full flex flex-col items-center justify-center px-4 py-8">
        <div className="flex flex-col items-center w-full max-w-sm">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative w-full text-center mb-6"
          >
            <h1 className="text-4xl font-bold text-white mb-2">기억력 트레이너</h1>
            <p className="text-white/70">하루 1분, 두뇌 트레이닝</p>
            {!adRemoved && (
              <button
                onClick={() => setShowIapSheet(true)}
                className="absolute right-0 top-0 w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                aria-label="설정"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-6 w-full shadow-2xl"
          >
            {/* 오늘의 카테고리 */}
            <div className="text-center mb-5">
              <span className="inline-block px-4 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-2">
                오늘의 카테고리는
              </span>
              <h2 className="text-2xl font-bold text-gray-800">{category?.name || '로딩 중...'}</h2>
            </div>

            {/* 닉네임 */}
            <div className="mb-4">
              <motion.div
                animate={nicknameError ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className={`bg-gray-50 rounded-xl px-4 py-3 flex items-center min-h-[50px] border-2 transition-colors ${nicknameError ? 'border-red-400 bg-red-50' : 'border-transparent'
                  }`}
              >
                {/* Edit mode: always in DOM so focus() works on iOS */}
                <div className={`flex items-center gap-2 w-full ${isEditingNickname ? '' : 'hidden'}`}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={draftNickname}
                    onChange={(e) => {
                      setDraftNickname(e.target.value);
                      if (nicknameError) setNicknameError(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleConfirmEdit();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    placeholder="닉네임 입력"
                    maxLength={10}
                    className="flex-1 min-w-0 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-sm"
                  />
                  <button
                    onClick={handleConfirmEdit}
                    disabled={!draftNickname.trim()}
                    className="shrink-0 text-sm font-semibold text-purple-600 hover:text-purple-700 disabled:text-gray-300 transition-colors"
                  >
                    확인
                  </button>
                  {confirmedNickname && (
                    <button
                      onClick={handleCancelEdit}
                      className="shrink-0 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      취소
                    </button>
                  )}
                </div>
                {/* Display mode */}
                <div className={`flex items-center justify-between w-full ${isEditingNickname ? 'hidden' : ''}`}>
                  <span className="text-gray-600 text-sm">
                    안녕하세요,{' '}
                    <span className="font-semibold text-gray-800">{confirmedNickname}</span>님!
                  </span>
                  <button
                    onClick={handleStartEdit}
                    className="shrink-0 text-sm text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    변경
                  </button>
                </div>
              </motion.div>
              <AnimatePresence>
                {nicknameError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="mt-1.5 px-1 text-xs text-red-500 font-medium"
                  >
                    닉네임을 입력하고 확인을 눌러주세요
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* 모드 선택 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">모드</label>
              <div className="grid grid-cols-2 gap-2">
                {(['basic', 'reverse'] as GameMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setSelectedMode(m); setMode(m); }}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${selectedMode === m
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                      }`}
                  >
                    <p className="font-semibold text-gray-800 text-sm">
                      {m === 'basic' ? '기본' : '리버스'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {m === 'basic' ? '봤던 단어 고르기' : '안 봤던 단어 고르기'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* 난이도 선택 */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">난이도</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(DIFFICULTY_META) as Difficulty[]).map((d) => {
                  const meta = DIFFICULTY_META[d];
                  const isSelected = selectedDifficulty === d;
                  return (
                    <motion.button
                      key={d}
                      onClick={() => setSelectedDifficulty(d)}
                      animate={isSelected ? { scale: 1.05 } : { scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className={`relative p-3 rounded-xl border-2 transition-colors text-center ${isSelected
                        ? meta.activeColor
                        : `${meta.color} opacity-60 hover:opacity-90`
                        }`}
                    >
                      {isSelected && (
                        <motion.span
                          layoutId="difficulty-indicator"
                          className="absolute -top-2 -right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shadow-md ring-2 ring-white"
                        >
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </motion.span>
                      )}
                      <motion.p
                        animate={isSelected ? { scale: 1.2 } : { scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        className="text-lg leading-none mb-1"
                      >
                        {meta.emoji}
                      </motion.p>
                      <p className={`text-xs font-bold ${meta.textColor}`}>{meta.label}</p>
                    </motion.button>
                  );
                })}
              </div>

              {/* 선택된 난이도 정보 */}
              <motion.div
                key={`${selectedDifficulty}-${selectedMode}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 bg-gray-50 rounded-xl px-4 py-3"
              >
                <p className={`text-sm font-medium mb-2 ${DIFFICULTY_META[selectedDifficulty].textColor}`}>
                  {DIFFICULTY_META[selectedDifficulty].description}
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span>단어 노출</span>
                  <span className="text-gray-700 font-medium">
                    {config.shownCount}개 · {config.wordDurationMs / 1000}초
                  </span>
                  <span>선택지</span>
                  <span className="text-gray-700 font-medium">
                    {config.shownCount + config.decoyCount}개
                    {selectedMode === 'reverse' && (
                      <span className="text-gray-400">
                        {' '}(정답 {config.decoyCount}개)
                      </span>
                    )}
                  </span>
                  <span>생명</span>
                  <span className="text-gray-700 font-medium">
                    {'❤️'.repeat(config.maxLives)}
                  </span>
                  <span>정답당 점수</span>
                  <span className="font-bold text-purple-600">
                    {(config.baseScore / (selectedMode === 'basic' ? config.shownCount : config.decoyCount)).toLocaleString()}점
                    {selectedMode === 'reverse' && (
                      <span className="text-gray-400 font-normal"> ×{config.reverseMultiplier}</span>
                    )}
                  </span>
                </div>
              </motion.div>
            </div>

            {/* 시작 버튼 */}
            <motion.button
              onClick={handleStart}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              게임 시작
            </motion.button>

            <button
              onClick={() => navigate('/leaderboard')}
              className="w-full mt-3 py-3 text-purple-600 font-medium hover:bg-purple-50 rounded-xl transition-colors"
            >
              리더보드 보기
            </button>

          </motion.div>
        </div>
      </div>
    </div>
  );
}
