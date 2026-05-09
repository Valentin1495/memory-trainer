import { useEffect, Suspense, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDiagnosis } from '../hooks/useDiagnosis';
import { canUseContactsViral, startContactsViralReward } from '../lib/contactsViral';
import { useGameStore } from '../store/gameStore';
import { useSettingsStore } from '../store/settingsStore';
import { useUserProfileStore } from '../store/userProfileStore';
import { getTrainingModule } from '../training/registry';
import { getUserLevelSummary } from '../lib/recommendation';
import type { Difficulty } from '../types';
import type { TrainingSessionResult } from '../types/training';

const wordMemoryDef = getTrainingModule('word-memory');
const WordMemoryModule = wordMemoryDef!.component;

const STEP_LABELS = {
  easy: { label: 'EASY', color: 'text-green-400', desc: '8개 단어 · 1.0초' },
  medium: { label: 'MEDIUM', color: 'text-yellow-400', desc: '10개 단어 · 0.7초' },
  hard: { label: 'HARD', color: 'text-red-400', desc: '12개 단어 · 0.5초' },
};

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: '초급',
  medium: '중급',
  hard: '고급',
};

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-red-400',
};

function getSafeRedirectPath(raw: string | null) {
  if (!raw) return '/';
  return raw.startsWith('/') ? raw : '/';
}

export function Diagnosis() {
  const navigate = useNavigate();
  const location = useLocation();
  const deferDiagnosis = useUserProfileStore(s => s.deferDiagnosis);
  const profileDifficulty = useUserProfileStore(s => s.profile?.currentDifficulty ?? 'easy');
  const baselineScore = useUserProfileStore(s => s.profile?.baselineScore ?? 0);
  const adRemoved = useSettingsStore(s => s.adRemoved);
  const adSkipTickets = useSettingsStore(s => s.adSkipTickets);
  const addAdSkipTickets = useSettingsStore(s => s.addAdSkipTickets);
  const redirectPath = getSafeRedirectPath(
    new URLSearchParams(location.search).get('redirect')
  );
  const { setDifficulty, setMode, startGame } = useGameStore();
  const {
    step,
    currentDifficulty,
    completedSteps,
    totalSteps,
    results,
    startDiagnosis,
    startQuickDiagnosis,
    handleStepComplete,
  } = useDiagnosis();
  const [shareRewardState, setShareRewardState] = useState<'idle' | 'opening' | 'rewarded' | 'error'>('idle');
  const [shareRewardMessage, setShareRewardMessage] = useState<string | null>(null);
  const entry = new URLSearchParams(location.search).get('entry');
  const isCheckupEntry = entry === 'checkup';
  const canShowShareReward = canUseContactsViral() && !adRemoved;

  // 단계가 바뀔 때마다 난이도·모드 세팅 (startGame은 WordMemoryModule이 담당)
  useEffect(() => {
    if (currentDifficulty) {
      setDifficulty(currentDifficulty);
      setMode('basic');
      startGame();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDifficulty]);

  const onModuleComplete = (result: TrainingSessionResult) => {
    handleStepComplete(result);
  };

  const handleLater = () => {
    deferDiagnosis();
    navigate(redirectPath, { replace: true });
  };

  const handleCancelDiagnosis = () => {
    deferDiagnosis();
    navigate(redirectPath, { replace: true });
  };

  const handleShareReward = () => {
    if (shareRewardState === 'opening') return;

    if (!canUseContactsViral()) {
      setShareRewardState('error');
      setShareRewardMessage('토스앱에서만 공유 리워드를 사용할 수 있어요.');
      return;
    }

    setShareRewardState('opening');
    setShareRewardMessage(null);

    let cleanup: (() => void) | null = null;
    let awardedTicketCount = 0;
    cleanup = startContactsViralReward({
      onReward: (rewardAmount) => {
        const ticketCount = Math.max(1, Math.floor(rewardAmount));
        awardedTicketCount += ticketCount;
        addAdSkipTickets(ticketCount);
        setShareRewardState('rewarded');
        setShareRewardMessage(`광고 스킵권 ${ticketCount.toLocaleString()}개를 받았어요.`);
      },
      onClose: (event) => {
        cleanup?.();
        cleanup = null;

        if (event.sentRewardsCount > 0) {
          if (awardedTicketCount === 0) {
            awardedTicketCount = event.sentRewardsCount;
            addAdSkipTickets(event.sentRewardsCount);
          }
          setShareRewardState('rewarded');
          setShareRewardMessage(`광고 스킵권 ${awardedTicketCount.toLocaleString()}개를 받았어요.`);
          return;
        }

        setShareRewardState('idle');
        setShareRewardMessage(null);
      },
      onError: (error) => {
        console.warn('[ContactsViral] contactsViral failed', error);
        cleanup?.();
        cleanup = null;
        setShareRewardState('error');
        setShareRewardMessage('공유 리워드를 여는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.');
      },
    });

    if (!cleanup) {
      setShareRewardState('error');
      setShareRewardMessage('공유 리워드 설정을 확인해 주세요.');
    }
  };

  if (step === 'complete') {
    const baseline = profileDifficulty;
    const levelSummary = getUserLevelSummary(baselineScore);
    const stepScores: { label: string; score: number; colorClass: string }[] = (
      ['easy', 'medium', 'hard'] as Difficulty[]
    ).map(d => ({
      label: STEP_LABELS[d].label,
      score: (results as Record<string, number>)[d] ?? 0,
      colorClass: DIFFICULTY_COLOR[d],
    }));

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 safe-top safe-bottom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <motion.p
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', bounce: 0.5 }}
              className="text-5xl mb-4"
            >
              🎉
            </motion.p>
            <h1 className="text-2xl font-bold text-white mb-2">평가 완료!</h1>
            <p className="text-white/60 text-sm">3단계 진단이 끝났어요</p>
          </div>

          {/* 단계별 점수 */}
          <div className="bg-white/10 rounded-2xl p-5 mb-5 space-y-3">
            <p className="text-white font-semibold text-sm mb-1">단계별 결과</p>
            {stepScores.map(({ label, score, colorClass }) => (
              <div key={label} className="flex items-center justify-between">
                <span className={`text-sm font-bold ${colorClass}`}>{label}</span>
                <div className="flex-1 mx-4">
                  <div className="h-1.5 bg-white/15 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-white/60 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (score / 1000) * 100)}%` }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    />
                  </div>
                </div>
                <span className="text-white/80 text-sm font-mono w-12 text-right">{score}</span>
              </div>
            ))}
          </div>

          {/* 추천 시작 수준 */}
          <div className="bg-white/15 rounded-2xl p-5 mb-7 text-center">
            <p className="text-white/60 text-xs mb-1">추천 시작 수준</p>
            <p className={`text-3xl font-black ${DIFFICULTY_COLOR[baseline]}`}>
              {DIFFICULTY_LABEL[baseline]}
            </p>
            <p className="text-white/50 text-xs mt-1">
              훈련을 거듭할수록 수준이 자동으로 조정돼요
            </p>
          </div>

          <div className="bg-white/10 rounded-2xl p-5 mb-7">
            <p className="text-white/60 text-xs mb-1">현재 진단 수준</p>
            <p className="text-xl font-bold text-white">{levelSummary.label}</p>
            <p className="mt-2 text-sm text-white/70">{levelSummary.description}</p>
            <p className="mt-3 text-xs text-white/45">Baseline score {baselineScore}</p>
          </div>

          {canShowShareReward && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="mb-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/15 p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-[0.14em] text-emerald-100/80">공유 리워드</p>
                  <p className="mt-1 text-sm font-bold text-white">친구에게 공유하고 광고 스킵권 받기</p>
                </div>
                <span className="shrink-0 text-xl">🎁</span>
              </div>
              <p className="mb-3 text-xs text-emerald-50/80">
                보유 스킵권 {adSkipTickets.toLocaleString()}개
              </p>
              <button
                onClick={handleShareReward}
                disabled={shareRewardState === 'opening'}
                className="w-full rounded-xl bg-emerald-400 py-3 text-sm font-bold text-slate-950 shadow disabled:opacity-60"
              >
                {shareRewardState === 'opening' ? '공유 화면 여는 중...' : '친구에게 공유하기'}
              </button>
              {shareRewardMessage && (
                <p className={`mt-2 text-center text-xs ${
                  shareRewardState === 'error' ? 'text-red-200' : 'text-emerald-50'
                }`}>
                  {shareRewardMessage}
                </p>
              )}
            </motion.div>
          )}

          <motion.button
            onClick={() => navigate(redirectPath)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-white text-purple-700 font-bold rounded-xl shadow"
          >
            훈련 시작하기
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (step === 'intro') {
    const introTitle = isCheckupEntry ? '기억력 점검' : '개인 맞춤 시작 평가';
    const introDescription = isCheckupEntry
      ? (
        <>
          하루 1분으로 현재 기억 상태를<br />
          가볍게 확인해요.
        </>
      )
      : (
        <>
          현재 기억력 수준을 측정하여<br />
          맞춤 훈련 프로그램을 설계합니다.
        </>
      );
    const quickButtonLabel = isCheckupEntry ? '1분 점검 시작' : '빠른 점검 시작';

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 safe-top safe-bottom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <p className="text-5xl mb-4">🔬</p>
            <h1 className="text-2xl font-bold text-white mb-3">{introTitle}</h1>
            <p className="text-white/70 text-sm leading-relaxed">
              {introDescription}
            </p>
          </div>

          <div className="bg-white/10 rounded-2xl p-5 mb-6 space-y-4">
            <p className="text-white font-semibold text-sm mb-3">진행 순서</p>
            {(['easy', 'medium', 'hard'] as const).map((d, i) => {
              const meta = STEP_LABELS[d];
              return (
                <div key={d} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">
                    {i + 1}
                  </div>
                  <div>
                    <span className={`font-bold text-sm ${meta.color}`}>{meta.label}</span>
                    <span className="text-white/60 text-xs ml-2">{meta.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-white/50 text-xs text-center mb-6">
            빠른 점검 1단계 · 정밀 진단 3단계
          </p>

          <motion.button
            onClick={startQuickDiagnosis}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-white text-purple-700 font-bold rounded-xl shadow"
          >
            {quickButtonLabel}
          </motion.button>
          <button
            onClick={startDiagnosis}
            className="w-full mt-3 rounded-xl border border-white/20 py-3 text-sm font-semibold text-white/80"
          >
            정밀 진단 시작
          </button>
          <button
            onClick={handleLater}
            className="w-full mt-2 py-3 text-white/50 text-sm"
          >
            나중에 하기
          </button>
          <p className="mt-2 text-center text-xs text-white/40">
            평가를 완료하면 더 정확한 난이도와 추천 훈련을 받을 수 있어요.
          </p>
        </motion.div>
      </div>
    );
  }

  if (currentDifficulty) {
    const meta = STEP_LABELS[currentDifficulty];
    return (
      <div className="min-h-screen flex flex-col safe-top safe-bottom">
        <Suspense fallback={null}>
          <WordMemoryModule
            key={currentDifficulty}
            difficulty={currentDifficulty}
            mode="basic"
            isDiagnosis
            diagnosisLabel={`진단 ${completedSteps + 1}/${totalSteps} — ${meta.label}`}
            diagnosisColor={meta.color}
            onComplete={onModuleComplete}
            onExit={handleCancelDiagnosis}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
    </div>
  );
}
