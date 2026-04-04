import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserProfileStore } from '../store/userProfileStore';
import { useHistoryStore } from '../store/historyStore';
import { useRecommendation } from '../hooks/useRecommendation';
import { useGameStore } from '../store/gameStore';
import { useSettingsStore } from '../store/settingsStore';
import { useGame } from '../hooks/useGame';
import { TodayTrainingCard } from '../components/dashboard/TodayTrainingCard';
import { StreakBadge } from '../components/dashboard/StreakBadge';
import { MiniHeatmap } from '../components/dashboard/MiniHeatmap';
import { TRAINING_REGISTRY } from '../training/registry';
import type { TrainingModuleDefinition } from '../types/training';
import type { Difficulty, GameMode } from '../types';
import { initIAP, purchaseNoAds, restorePurchases, getNoAdsPrice } from '../lib/iap';
import { initAdMob } from '../lib/admob';

function getDayLabels(): string[] {
  const labels = ['일', '월', '화', '수', '목', '금', '토'];
  const result: string[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push(i === 0 ? '오늘' : labels[d.getDay()]);
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
  const { isLoading } = useGame();
  const [showIapSheet, setShowIapSheet] = useState(false);
  const [iapLoading, setIapLoading] = useState(false);
  const [selectedMod, setSelectedMod] = useState<TrainingModuleDefinition | null>(null);
  const [pickedDifficulty, setPickedDifficulty] = useState<Difficulty>('medium');
  const [pickedMode, setPickedMode] = useState<GameMode>('basic');
  const showDiagnosisBanner = profile?.diagnosisDeferred === true && !profile?.diagnosisComplete;

  useEffect(() => {
    initAdMob();
    initIAP();
  }, []);

  const todaySessions = getTodaySessions();
  const streak = getStreakDays();
  const todayTimeMs = todaySessions.reduce((sum, session) => sum + session.timeMs, 0);
  const dailyGoalMinutes = profile?.dailyGoalMinutes ?? 3;

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
  }, [navigate, recommendation, setDifficulty, startGame]);

  const handleModuleCardClick = (mod: TrainingModuleDefinition) => {
    setPickedDifficulty(recommendation.difficulty);
    setPickedMode('basic');
    setSelectedMod(mod);
  };

  const handleStartSelected = () => {
    if (!selectedMod) return;

    setDifficulty(pickedDifficulty);
    const { setMode: setGameMode } = useGameStore.getState();
    setGameMode(selectedMod.id === 'word-memory' ? pickedMode : 'basic');
    startGame();
    setSelectedMod(null);
    navigate(`/training/${selectedMod.id}`);
  };

  const handlePurchaseNoAds = async () => {
    setIapLoading(true);
    await purchaseNoAds();
    setIapLoading(false);
    setShowIapSheet(false);
  };

  const handleRestorePurchases = async () => {
    setIapLoading(true);
    try {
      await restorePurchases();
    } catch {
      // ignored
    }
    setIapLoading(false);
    setShowIapSheet(false);
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
      <AnimatePresence>
        {selectedMod && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/50"
              onClick={() => setSelectedMod(null)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
              className="fixed bottom-0 left-0 right-0 z-40 rounded-t-3xl bg-[#1e1a3c] px-6 pt-5"
            >
              <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20" />

              <div className="mb-6 flex items-center gap-3">
                <span className="text-3xl">{selectedMod.icon}</span>
                <div>
                  <p className="text-lg font-bold text-white">{selectedMod.name}</p>
                  <p className="text-xs text-white/50">{selectedMod.description}</p>
                </div>
              </div>

              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/60">난이도</p>
              <div className="mb-5 grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => {
                  const labels = { easy: '쉬움', medium: '보통', hard: '어려움' };
                  const active = pickedDifficulty === d;
                  const colors = {
                    easy: active ? 'bg-green-500 text-white border-green-400' : 'bg-white/8 text-white/60 border-white/15',
                    medium: active ? 'bg-yellow-500 text-white border-yellow-400' : 'bg-white/8 text-white/60 border-white/15',
                    hard: active ? 'bg-red-500 text-white border-red-400' : 'bg-white/8 text-white/60 border-white/15',
                  };

                  return (
                    <button
                      key={d}
                      onClick={() => setPickedDifficulty(d)}
                      className={`rounded-xl border py-2.5 text-sm font-semibold transition-colors ${colors[d]}`}
                    >
                      {labels[d]}
                    </button>
                  );
                })}
              </div>

              {selectedMod.id === 'word-memory' && (
                <>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/60">모드</p>
                  <div className="mb-5 grid grid-cols-2 gap-2">
                    {(['basic', 'reverse'] as GameMode[]).map(m => {
                      const labels = { basic: '기본 모드', reverse: '리버스 모드' };
                      const active = pickedMode === m;

                      return (
                        <button
                          key={m}
                          onClick={() => setPickedMode(m)}
                          className={`rounded-xl border py-2.5 text-sm font-semibold transition-colors ${
                            active ? 'bg-purple-500 text-white border-purple-400' : 'bg-white/8 text-white/60 border-white/15'
                          }`}
                        >
                          {labels[m]}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              <motion.button
                onClick={handleStartSelected}
                whileTap={{ scale: 0.97 }}
                className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 py-4 font-bold text-white shadow-lg"
              >
                훈련 시작
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
              className="fixed bottom-0 left-0 right-0 z-40 rounded-t-3xl bg-white px-6 pb-8 pt-5 safe-bottom"
            >
              <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-gray-200" />
              <h3 className="mb-1 text-lg font-bold text-gray-800">광고 없이 즐기기</h3>
              <p className="mb-6 text-sm text-gray-500">
                화면 광고를 영구 제거합니다{getNoAdsPrice() ? ` (${getNoAdsPrice()})` : ''}
              </p>
              <button
                onClick={handlePurchaseNoAds}
                disabled={iapLoading}
                className="mb-3 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-4 font-semibold text-white shadow-lg disabled:opacity-60"
              >
                {iapLoading ? '처리 중...' : '구매하기'}
              </button>
              <button
                onClick={handleRestorePurchases}
                disabled={iapLoading}
                className="w-full py-3 text-sm font-medium text-gray-400 disabled:opacity-50"
              >
                이전 구매 복원
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="min-h-full max-w-sm mx-auto flex flex-col px-4 pt-4 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between"
        >
          <div>
            <p className="text-sm text-white/60">안녕하세요</p>
            <h1 className="text-xl font-bold text-white">
              {profile?.nickname ?? '트레이너'}님
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <StreakBadge streak={streak} />
            <button
              onClick={() => navigate('/settings')}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 hover:bg-white/30"
            >
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </motion.div>

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
                <p className="text-xs font-semibold tracking-[0.2em] text-amber-100/80">DIAGNOSIS</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  초기 평가를 완료하고 더 정확한 추천을 받아보세요
                </p>
                <p className="mt-1 text-xs text-white/70">
                  지금 진단하면 훈련 난이도와 시작 기준이 더 잘 맞춰집니다
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
            todayTimeMs={todayTimeMs}
            dailyGoalMinutes={dailyGoalMinutes}
            onStart={handleStartTraining}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4 rounded-2xl bg-white/10 p-5"
        >
          <div className="mb-4">
            <p className="text-sm font-semibold text-white">최근 7일 훈련 기록</p>
          </div>
          <MiniHeatmap counts={dailyCounts} labels={getDayLabels()} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-4"
        >
          <p className="mb-3 text-sm font-semibold text-white">모든 훈련</p>
          <div className="grid grid-cols-2 gap-2.5">
            {TRAINING_REGISTRY.map((mod, i) => (
              <motion.button
                key={mod.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 + i * 0.04 }}
                onClick={() => handleModuleCardClick(mod)}
                className="flex items-center gap-3 rounded-2xl bg-white/10 p-3.5 text-left transition-all hover:bg-white/20 active:scale-95"
              >
                <span className="shrink-0 text-2xl">{mod.icon}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{mod.name}</p>
                  <p className="truncate text-xs text-white/50">{mod.description}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="grid grid-cols-2 gap-3"
        >
          <button
            onClick={() => navigate('/report')}
            className="flex flex-col items-center gap-2 rounded-2xl bg-white/10 p-4 transition-colors hover:bg-white/20"
          >
            <span className="text-2xl">📊</span>
            <span className="text-sm font-medium text-white">주간 리포트</span>
          </button>
          <button
            onClick={() => navigate('/leaderboard')}
            className="flex flex-col items-center gap-2 rounded-2xl bg-white/10 p-4 transition-colors hover:bg-white/20"
          >
            <span className="text-2xl">🏆</span>
            <span className="text-sm font-medium text-white">리더보드</span>
          </button>
        </motion.div>

        {!adRemoved && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={() => setShowIapSheet(true)}
            className="mt-4 w-full rounded-xl bg-white/10 py-3 text-xs text-white/60 transition-colors hover:bg-white/20"
          >
            광고 없이 이용하기
          </motion.button>
        )}
      </div>
    </div>
  );
}
