import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { flushSync } from 'react-dom';
import { useUserProfileStore } from '../store/userProfileStore';
import { useHistoryStore } from '../store/historyStore';
import { useGameStore } from '../store/gameStore';
import { useSettingsStore } from '../store/settingsStore';
import { purchaseNoAds, restorePurchases, getNoAdsPrice } from '../lib/iap';
import { getUserLevelSummary } from '../lib/recommendation';
import type { TrainingGoal } from '../types/training';

const GOAL_LABELS: Record<TrainingGoal, string> = {
  focus: '집중력 향상',
  memory: '기억력 강화',
  health: '두뇌 건강',
};

const DAILY_GOAL_OPTIONS = [1, 3, 5];

export function Settings() {
  const navigate = useNavigate();
  const { profile, updateGoal, updateDailyGoal, resetDiagnosis, resetProfile } = useUserProfileStore();
  const { clearHistory } = useHistoryStore();
  const { setNickname } = useGameStore();
  const { adRemoved } = useSettingsStore();

  const [iapLoading, setIapLoading] = useState(false);
  const [iapFeedback, setIapFeedback] = useState<string | null>(null);
  const [showDiagnosisResetConfirm, setShowDiagnosisResetConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [nickname, setNicknameLocal] = useState(profile?.nickname ?? '');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const levelSummary = getUserLevelSummary(profile?.baselineScore ?? 0);
  const isDiagnosisComplete = profile?.diagnosisComplete === true;

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
    setIapFeedback(null);
    try {
      const result = await purchaseNoAds();
      if (result === 'cancelled') {
        setIapFeedback('구매가 취소되었습니다.');
      } else if (result === 'failed') {
        setIapFeedback('구매 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setIapLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    setIapLoading(true);
    setIapFeedback(null);
    try {
      const result = await restorePurchases();
      if (result === 'restored') {
        setIapFeedback('구매가 복원되었습니다. 광고가 제거됩니다.');
      } else if (result === 'not_found') {
        setIapFeedback('복원할 구매 내역이 없습니다.');
      } else if (result === 'cancelled') {
        setIapFeedback('복원이 취소되었습니다.');
      } else {
        setIapFeedback('구매 복원 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } catch {
      setIapFeedback('구매 복원 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIapLoading(false);
    }
  };

  const handleResetData = () => {
    clearHistory();
    resetProfile();
    navigate('/onboarding');
  };

  const handleRestartDiagnosis = () => {
    resetDiagnosis();
    navigate('/diagnosis');
  };

  return (
    <div className="h-screen overflow-y-auto safe-top safe-bottom">
      <div className="min-h-full max-w-sm mx-auto flex flex-col px-4 pt-4 pb-6">
        <div className="mb-6 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-white/80 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">설정</h1>
        </div>

        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white p-5"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">프로필</p>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-xs text-gray-400">닉네임</p>
                <div className={isEditingNickname ? '' : 'hidden'}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={nickname}
                    onChange={e => setNicknameLocal(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveNickname();
                      if (e.key === 'Escape') setIsEditingNickname(false);
                    }}
                    maxLength={10}
                    className="w-full border-b-2 border-purple-400 bg-transparent pb-1 text-base font-semibold text-gray-800 outline-none"
                  />
                </div>
                <div className={isEditingNickname ? 'hidden' : ''}>
                  <p className="text-base font-semibold text-gray-800">{profile?.nickname ?? '플레이어'}</p>
                </div>
              </div>
              {isEditingNickname ? (
                <div className="ml-3 flex shrink-0 gap-2">
                  <button onClick={handleSaveNickname} className="text-sm font-semibold text-purple-600">저장</button>
                  <button onClick={() => setIsEditingNickname(false)} className="text-sm text-gray-400">취소</button>
                </div>
              ) : (
                <button onClick={handleStartEditNickname} className="ml-3 shrink-0 text-sm text-purple-600">변경</button>
              )}
            </div>

            {isDiagnosisComplete && profile && (
              <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">현재 진단 수준</p>
                <p className="text-base font-bold text-gray-800">{levelSummary.label}</p>
                <p className="mt-1 text-sm text-gray-500">{levelSummary.description}</p>
                <p className="mt-2 text-xs text-gray-400">Baseline score {profile.baselineScore}</p>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl bg-white p-5"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">훈련 설정</p>

            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-gray-700">목표</p>
              <div className="flex gap-2">
                {(['focus', 'memory', 'health'] as TrainingGoal[]).map(goal => (
                  <button
                    key={goal}
                    onClick={() => profile && updateGoal(goal)}
                    className={`flex-1 rounded-xl border-2 py-2 text-xs font-semibold transition-all ${
                      profile?.goal === goal
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 text-gray-500 hover:border-purple-300'
                    }`}
                  >
                    {GOAL_LABELS[goal]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">하루 목표 시간</p>
              <div className="flex gap-2">
                {DAILY_GOAL_OPTIONS.map(minutes => (
                  <button
                    key={minutes}
                    onClick={() => profile && updateDailyGoal(minutes)}
                    className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-bold transition-all ${
                      profile?.dailyGoalMinutes === minutes
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 text-gray-500 hover:border-purple-300'
                    }`}
                  >
                    {minutes}분
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {!adRemoved && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl bg-white p-5"
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">광고</p>
              <button
                onClick={handlePurchaseNoAds}
                disabled={iapLoading}
                className="mb-2 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3.5 font-semibold text-white shadow disabled:opacity-60"
              >
                {iapLoading ? '처리 중...' : `광고 제거${getNoAdsPrice() ? ` (${getNoAdsPrice()})` : ''}`}
              </button>
              <button
                onClick={handleRestorePurchases}
                disabled={iapLoading}
                className="w-full py-2.5 text-sm text-gray-400 disabled:opacity-50"
              >
                구매 복원
              </button>
              {iapFeedback && (
                <p className="mt-3 text-center text-sm text-gray-500">
                  {iapFeedback}
                </p>
              )}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl bg-white p-5"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">데이터</p>
            {isDiagnosisComplete && profile && (
              <div className="mb-4">
                {!showDiagnosisResetConfirm ? (
                  <button
                    onClick={() => setShowDiagnosisResetConfirm(true)}
                    className="w-full rounded-xl border-2 border-amber-200 py-3 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-50"
                  >
                    진단 다시 하기
                  </button>
                ) : (
                  <div className="rounded-xl bg-amber-50 px-4 py-4">
                    <p className="mb-3 text-sm text-amber-900">
                      진단 상태를 초기화하고 다시 시작합니다. 닉네임과 일반 훈련 기록은 유지됩니다.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleRestartDiagnosis}
                        className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-bold text-white"
                      >
                        다시 진단
                      </button>
                      <button
                        onClick={() => setShowDiagnosisResetConfirm(false)}
                        className="flex-1 rounded-xl border-2 border-amber-200 py-3 text-sm text-amber-700"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full rounded-xl border-2 border-red-200 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
              >
                모든 데이터 초기화
              </button>
            ) : (
              <div>
                <p className="mb-3 text-sm text-gray-600">훈련 기록과 프로필이 모두 삭제됩니다. 계속하시겠어요?</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleResetData}
                    className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold text-white"
                  >
                    삭제
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 rounded-xl border-2 border-gray-200 py-3 text-sm text-gray-500"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <button
              onClick={() => navigate('/leaderboard')}
              className="w-full rounded-xl bg-white/10 py-3 text-sm text-white/70 transition-colors hover:bg-white/20"
            >
              리더보드 보기
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
