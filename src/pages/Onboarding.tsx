import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { flushSync } from 'react-dom';
import { useUserProfileStore } from '../store/userProfileStore';
import { useGameStore } from '../store/gameStore';
import { getGuestId } from '../lib/supabase';
import type { TrainingGoal } from '../types/training';

const GOALS: { id: TrainingGoal; label: string; desc: string; icon: string }[] = [
  { id: 'focus', label: '집중력 향상', desc: '업무·학습 집중력을 높이고 싶어요', icon: '🎯' },
  { id: 'memory', label: '기억력 유지', desc: '일상 기억력을 유지하고 싶어요', icon: '🧠' },
  { id: 'health', label: '두뇌 건강', desc: '꾸준한 두뇌 건강 관리가 목표에요', icon: '💪' },
];

const DAILY_GOALS = [
  { minutes: 1, label: '1분', desc: '가볍게' },
  { minutes: 3, label: '3분', desc: '보통' },
  { minutes: 5, label: '5분', desc: '집중' },
];

type OnboardingStep = 'nickname' | 'goal' | 'daily';

export function Onboarding() {
  const navigate = useNavigate();
  const setProfile = useUserProfileStore(s => s.setProfile);
  const setNickname = useGameStore(s => s.setNickname);

  const [step, setStep] = useState<OnboardingStep>('nickname');
  const [nickname, setNicknameLocal] = useState('');
  const [goal, setGoal] = useState<TrainingGoal>('memory');
  const [dailyGoal, setDailyGoal] = useState(3);
  const [nicknameError, setNicknameError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const stepIndex = step === 'nickname' ? 0 : step === 'goal' ? 1 : 2;

  const handleNicknameNext = () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setNicknameError(true);
      flushSync(() => {});
      inputRef.current?.focus();
      return;
    }
    setStep('goal');
  };

  const handleGoalNext = () => setStep('daily');

  const handleComplete = () => {
    const userId = getGuestId();

    const profile = {
      userId,
      nickname: nickname.trim(),
      goal,
      dailyGoalMinutes: dailyGoal,
      currentDifficulty: 'medium' as const,
      lastModuleId: 'word-memory',
      onboardingComplete: true,
      diagnosisComplete: false,
      diagnosisDeferred: false,
      baselineScore: 0,
      createdAt: new Date().toISOString(),
    };
    setProfile(profile);
    setNickname(nickname.trim());
    navigate('/diagnosis');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 safe-top safe-bottom">
      {/* Progress dots */}
      <div className="flex gap-2 mb-10">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === stepIndex ? 'w-8 bg-white' : i < stepIndex ? 'w-4 bg-white/60' : 'w-4 bg-white/20'
            }`}
          />
        ))}
      </div>

      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">

          {step === 'nickname' && (
            <motion.div
              key="nickname"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="flex flex-col items-center"
            >
              <p className="text-5xl mb-6">🧠</p>
              <h1 className="text-3xl font-bold text-white text-center mb-2">기억력 트레이너</h1>
              <p className="text-white/70 text-center mb-8 text-sm">
                개인 맞춤형 기억력 훈련 프로그램에 오신 것을 환영합니다
              </p>
              <div className="bg-white rounded-2xl p-6 w-full shadow-xl">
                <label className="block text-sm font-semibold text-gray-700 mb-2">닉네임</label>
                <motion.input
                  ref={inputRef}
                  type="text"
                  value={nickname}
                  onChange={e => { setNicknameLocal(e.target.value); setNicknameError(false); }}
                  onKeyDown={e => e.key === 'Enter' && handleNicknameNext()}
                  placeholder="이름 또는 별명을 입력하세요"
                  maxLength={10}
                  autoFocus
                  animate={nicknameError ? { x: [0, -8, 8, -5, 5, 0] } : {}}
                  transition={{ duration: 0.35 }}
                  className={`w-full px-4 py-3 rounded-xl border-2 text-gray-800 outline-none transition-colors ${
                    nicknameError ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-purple-400'
                  }`}
                />
                {nicknameError && (
                  <p className="mt-1.5 text-xs text-red-500">닉네임을 입력해 주세요</p>
                )}
                <motion.button
                  onClick={handleNicknameNext}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-4 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow"
                >
                  다음
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 'goal' && (
            <motion.div
              key="goal"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="flex flex-col items-center"
            >
              <h2 className="text-2xl font-bold text-white text-center mb-2">훈련 목표</h2>
              <p className="text-white/70 text-center mb-6 text-sm">
                주요 목표를 선택하면 맞춤 훈련을 추천해 드려요
              </p>
              <div className="w-full flex flex-col gap-3 mb-6">
                {GOALS.map(g => (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                      goal === g.id
                        ? 'border-white bg-white/20 shadow-lg'
                        : 'border-white/20 bg-white/10 hover:bg-white/15'
                    }`}
                  >
                    <span className="text-3xl">{g.icon}</span>
                    <div>
                      <p className="font-bold text-white">{g.label}</p>
                      <p className="text-white/70 text-sm">{g.desc}</p>
                    </div>
                    {goal === g.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto w-5 h-5 bg-white rounded-full flex items-center justify-center"
                      >
                        <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>
              <motion.button
                onClick={handleGoalNext}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-white text-purple-700 font-bold rounded-xl shadow"
              >
                다음
              </motion.button>
            </motion.div>
          )}

          {step === 'daily' && (
            <motion.div
              key="daily"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="flex flex-col items-center"
            >
              <h2 className="text-2xl font-bold text-white text-center mb-2">하루 목표 시간</h2>
              <p className="text-white/70 text-center mb-6 text-sm">
                매일 얼마나 훈련할지 정해보세요
              </p>
              <div className="w-full flex flex-col gap-3 mb-6">
                {DAILY_GOALS.map(d => (
                  <button
                    key={d.minutes}
                    onClick={() => setDailyGoal(d.minutes)}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                      dailyGoal === d.minutes
                        ? 'border-white bg-white/20'
                        : 'border-white/20 bg-white/10 hover:bg-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-white">{d.label}</span>
                      <span className="text-white/70 text-sm">{d.desc}</span>
                    </div>
                    {dailyGoal === d.minutes && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 bg-white rounded-full flex items-center justify-center"
                      >
                        <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>
              <motion.button
                onClick={handleComplete}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-white text-purple-700 font-bold rounded-xl shadow"
              >
                시작하기
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
