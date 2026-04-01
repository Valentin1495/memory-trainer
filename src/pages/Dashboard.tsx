import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUserProfileStore } from '../store/userProfileStore';
import { useHistoryStore } from '../store/historyStore';
import { useRecommendation } from '../hooks/useRecommendation';
import { useGameStore } from '../store/gameStore';
import { useSettingsStore } from '../store/settingsStore';
import { useGame } from '../hooks/useGame';
import { TodayTrainingCard } from '../components/dashboard/TodayTrainingCard';
import { StreakBadge } from '../components/dashboard/StreakBadge';
import { MiniBarChart } from '../components/dashboard/MiniBarChart';
import { purchaseNoAds, restorePurchases, getNoAdsPrice } from '../lib/iap';
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';

function getDayLabels(): string[] {
  const result: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayIdx = d.getDay();
    result.push(i === 0 ? '오늘' : ['일', '월', '화', '수', '목', '금', '토'][dayIdx]);
  }
  return result;
}

export function Dashboard() {
  const navigate = useNavigate();
  const profile = useUserProfileStore(s => s.profile);
  const getTodaySessions = useHistoryStore(s => s.getTodaySessions);
  const getStreakDays = useHistoryStore(s => s.getStreakDays);
  const sessions = useHistoryStore(s => s.sessions);
  const recommendation = useRecommendation();
  const { setDifficulty, startGame } = useGameStore();
  const { adRemoved } = useSettingsStore();
  const { isLoading, category } = useGame();
  const [showIapSheet, setShowIapSheet] = useState(false);
  const [iapLoading, setIapLoading] = useState(false);
  const showDiagnosisBanner = profile?.diagnosisDeferred === true && !profile?.diagnosisComplete;

  const todaySessions = getTodaySessions();
  const streak = getStreakDays();

  // 최근 7일 바 차트 데이터
  const dailyCounts: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    dailyCounts.push(sessions.filter(s => s.completedAt.slice(0, 10) === key).length);
  }

  const handleStartTraining = useCallback(() => {
    setDifficulty(recommendation.difficulty);
    startGame();
    navigate(`/training/${recommendation.moduleId}`);
  }, [recommendation, setDifficulty, startGame, navigate]);

  const handlePurchaseNoAds = async () => {
    setIapLoading(true);
    await purchaseNoAds();
    setIapLoading(false);
    setShowIapSheet(false);
  };

  const handleRestorePurchases = async () => {
    setIapLoading(true);
    try { await restorePurchases(); } catch { /* ignored */ }
    setIapLoading(false);
  };

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
      {/* IAP 시트 */}
      <AnimatePresence>
        {showIapSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/40"
              onClick={() => setShowIapSheet(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-40 bg-white rounded-t-3xl px-6 pt-5 pb-8 safe-bottom"
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
              <h3 className="text-lg font-bold text-gray-800 mb-1">광고 없이 즐기기</h3>
              <p className="text-sm text-gray-500 mb-6">
                전면 광고를 영구 제거합니다.{getNoAdsPrice() ? ` (${getNoAdsPrice()})` : ''}
              </p>
              <button onClick={handlePurchaseNoAds} disabled={iapLoading}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg disabled:opacity-60 mb-3">
                {iapLoading ? '처리 중...' : '구매하기'}
              </button>
              <button onClick={handleRestorePurchases} disabled={iapLoading}
                className="w-full py-3 text-gray-400 text-sm font-medium disabled:opacity-50">
                이미 구매했어요 (복원)
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="min-h-full flex flex-col px-4 py-6 max-w-sm mx-auto">

        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <p className="text-white/60 text-sm">안녕하세요,</p>
            <h1 className="text-xl font-bold text-white">
              {profile?.nickname ?? '트레이너'}님 👋
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <StreakBadge streak={streak} />
            <button
              onClick={() => navigate('/settings')}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </motion.div>

        {/* 오늘의 카테고리 배지 */}
        {category && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
            className="mb-4"
          >
            <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-2">
              <span className="text-white/70 text-xs">오늘의 주제</span>
              <span className="text-white font-bold text-sm">{category.name}</span>
            </div>
          </motion.div>
        )}

        {/* 오늘의 추천 훈련 카드 */}
        {showDiagnosisBanner && (
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            onClick={() => navigate('/diagnosis')}
            className="mb-4 w-full rounded-2xl border border-amber-200/30 bg-gradient-to-r from-amber-400/20 to-orange-400/20 px-4 py-4 text-left shadow-lg shadow-black/10"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-amber-100/80">
                  DIAGNOSIS
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  초기 평가를 완료하고 더 정확한 추천을 받아보세요
                </p>
                <p className="mt-1 text-xs text-white/70">
                  지금 진단하면 훈련 난이도와 시작 기준이 더 잘 맞춰집니다.
                </p>
              </div>
              <div className="shrink-0 rounded-full bg-white/20 px-3 py-2 text-xs font-bold text-white">
                진단하기
              </div>
            </div>
          </motion.button>
        )}

        <div className="mb-5">
          <TodayTrainingCard
            recommendation={recommendation}
            todayCount={todaySessions.length}
            onStart={handleStartTraining}
          />
        </div>

        {/* 최근 7일 훈련 현황 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 rounded-2xl p-5 mb-4"
        >
          <div className="mb-4">
            <p className="text-white font-semibold text-sm">최근 7일 훈련 기록</p>
          </div>
          <MiniBarChart counts={dailyCounts} labels={getDayLabels()} />
        </motion.div>

        {/* 하단 메뉴 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-2 gap-3"
        >
          <button
            onClick={() => navigate('/report')}
            className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors"
          >
            <span className="text-2xl">📊</span>
            <span className="text-white text-sm font-medium">주간 리포트</span>
          </button>
          <button
            onClick={() => navigate('/leaderboard')}
            className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors"
          >
            <span className="text-2xl">🏆</span>
            <span className="text-white text-sm font-medium">리더보드</span>
          </button>
        </motion.div>

        {/* 광고 제거 배너 */}
        {!adRemoved && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={() => setShowIapSheet(true)}
            className="mt-4 w-full py-3 bg-white/10 rounded-xl text-white/60 text-xs hover:bg-white/20 transition-colors"
          >
            광고 없이 이용하기
          </motion.button>
        )}
      </div>
    </div>
  );
}
