import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { flushSync } from 'react-dom';
import { useUserProfileStore } from '../store/userProfileStore';
import { useHistoryStore } from '../store/historyStore';
import { useGameStore } from '../store/gameStore';
import { useSettingsStore } from '../store/settingsStore';
import { purchaseNoAds, restorePurchases, getNoAdsPrice } from '../lib/iap';
import type { TrainingGoal } from '../types/training';
import type { GameMode } from '../types';

const GOAL_LABELS: Record<TrainingGoal, string> = {
  focus: '집중력 향상',
  memory: '기억력 유지',
  health: '두뇌 건강',
};

const DAILY_GOAL_OPTIONS = [1, 3, 5];
const MODE_LABELS: Record<GameMode, string> = {
  basic: '기억한 단어 선택',
  reverse: '보지 못한 단어 선택',
};

export function Settings() {
  const navigate = useNavigate();
  const { profile, updateGoal, updateDailyGoal, updateDifficulty, resetProfile } = useUserProfileStore();
  const { clearHistory } = useHistoryStore();
  const { mode, setMode, setNickname } = useGameStore();
  const { adRemoved } = useSettingsStore();

  const [iapLoading, setIapLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [nickname, setNicknameLocal] = useState(profile?.nickname ?? '');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleStartEditNickname = () => {
    flushSync(() => setIsEditingNickname(true));
    inputRef.current?.focus();
  };

  const handleSaveNickname = () => {
    const trimmed = nickname.trim();
    if (!trimmed) return;
    setNickname(trimmed);
    if (profile) {
      useUserProfileStore.getState().setProfile({ ...profile, nickname: trimmed });
    }
    setIsEditingNickname(false);
  };

  const handlePurchaseNoAds = async () => {
    setIapLoading(true);
    await purchaseNoAds();
    setIapLoading(false);
  };

  const handleRestorePurchases = async () => {
    setIapLoading(true);
    try { await restorePurchases(); } catch { /* ignored */ }
    setIapLoading(false);
  };

  const handleResetData = () => {
    clearHistory();
    resetProfile();
    navigate('/onboarding');
  };

  return (
    <div className="h-screen overflow-y-auto safe-top safe-bottom">
      <div className="min-h-full flex flex-col px-4 py-6 max-w-sm mx-auto">

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/')} className="text-white/80 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">설정</h1>
        </div>

        <div className="space-y-4">

          {/* 닉네임 */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-5"
          >
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">프로필</p>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-1">닉네임</p>
                <div className={isEditingNickname ? '' : 'hidden'}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={nickname}
                    onChange={e => setNicknameLocal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveNickname(); if (e.key === 'Escape') setIsEditingNickname(false); }}
                    maxLength={10}
                    className="w-full border-b-2 border-purple-400 text-gray-800 text-base font-semibold outline-none bg-transparent pb-1"
                  />
                </div>
                <div className={isEditingNickname ? 'hidden' : ''}>
                  <p className="text-base font-semibold text-gray-800">{profile?.nickname ?? '—'}</p>
                </div>
              </div>
              {isEditingNickname ? (
                <div className="flex gap-2 ml-3 shrink-0">
                  <button onClick={handleSaveNickname} className="text-sm text-purple-600 font-semibold">저장</button>
                  <button onClick={() => setIsEditingNickname(false)} className="text-sm text-gray-400">취소</button>
                </div>
              ) : (
                <button onClick={handleStartEditNickname} className="ml-3 text-sm text-purple-600 shrink-0">변경</button>
              )}
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">기본 훈련 방식</p>
              <div className="grid grid-cols-2 gap-2">
                {(['basic', 'reverse'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`rounded-xl border-2 px-3 py-3 text-left transition-all ${
                      mode === m
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 text-gray-500 hover:border-purple-300'
                    }`}
                  >
                    <p className="text-sm font-semibold">{MODE_LABELS[m]}</p>
                    <p className="mt-1 text-xs opacity-75">
                      {m === 'basic' ? '방금 본 단어를 고릅니다.' : '보지 못한 단어를 골라냅니다.'}
                    </p>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-400">
                시작 평가는 항상 기본 방식으로 진행됩니다.
              </p>
            </div>
          </motion.div>

          {/* 훈련 목표 */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl p-5"
          >
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">훈련 설정</p>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">목표</p>
              <div className="flex gap-2">
                {(['focus', 'memory', 'health'] as TrainingGoal[]).map(g => (
                  <button
                    key={g}
                    onClick={() => profile && updateGoal(g)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                      profile?.goal === g
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 text-gray-500 hover:border-purple-300'
                    }`}
                  >
                    {GOAL_LABELS[g]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">하루 목표 시간</p>
              <div className="flex gap-2">
                {DAILY_GOAL_OPTIONS.map(m => (
                  <button
                    key={m}
                    onClick={() => profile && updateDailyGoal(m)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                      profile?.dailyGoalMinutes === m
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 text-gray-500 hover:border-purple-300'
                    }`}
                  >
                    {m}분
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">기본 난이도</p>
              <div className="flex gap-2">
                {(['easy', 'medium', 'hard'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => updateDifficulty(d)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                      profile?.currentDifficulty === d
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 text-gray-500 hover:border-purple-300'
                    }`}
                  >
                    {d.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* IAP */}
          {!adRemoved && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-5"
            >
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">광고</p>
              <button
                onClick={handlePurchaseNoAds}
                disabled={iapLoading}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow disabled:opacity-60 mb-2"
              >
                {iapLoading ? '처리 중...' : `광고 제거${getNoAdsPrice() ? ` (${getNoAdsPrice()})` : ''}`}
              </button>
              <button
                onClick={handleRestorePurchases}
                disabled={iapLoading}
                className="w-full py-2.5 text-gray-400 text-sm disabled:opacity-50"
              >
                구매 복원
              </button>
            </motion.div>
          )}

          {/* 데이터 초기화 */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-5"
          >
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">데이터</p>
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-3 border-2 border-red-200 text-red-500 font-medium rounded-xl text-sm hover:bg-red-50 transition-colors"
              >
                모든 데이터 초기화
              </button>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-3">훈련 기록과 프로필이 모두 삭제됩니다. 계속하시겠어요?</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleResetData}
                    className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl text-sm"
                  >
                    삭제
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-3 border-2 border-gray-200 text-gray-500 rounded-xl text-sm"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          {/* 리더보드 링크 */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <button
              onClick={() => navigate('/leaderboard')}
              className="w-full py-3 bg-white/10 rounded-xl text-white/70 text-sm hover:bg-white/20 transition-colors"
            >
              🏆 리더보드 보기
            </button>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
