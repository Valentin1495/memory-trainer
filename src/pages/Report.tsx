import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWeeklyReport } from '../hooks/useWeeklyReport';
import { WeeklyBarChart } from '../components/report/WeeklyBarChart';
import { AccuracyTrend } from '../components/report/AccuracyTrend';
import { ModuleStatsCard } from '../components/report/ModuleStatsCard';

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

export function Report() {
  const navigate = useNavigate();
  const stats = useWeeklyReport();

  const dayLabels = getDayLabels();
  const isEmpty = stats.totalSessions === 0;

  return (
    <div className="h-screen overflow-y-auto safe-top safe-bottom">
      <div className="min-h-full flex flex-col px-4 pt-4 pb-6 max-w-sm mx-auto">

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/')} className="text-white/80 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">최근 7일 훈련 분석</h1>
            <p className="text-xs text-white/60">훈련 빈도, 정확도 추이, 모듈별 성과를 한눈에 확인하세요.</p>
          </div>
        </div>

        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center text-center"
          >
            <p className="text-4xl mb-4">📊</p>
            <p className="text-white font-semibold text-lg mb-2">아직 훈련 기록이 없어요</p>
            <p className="text-white/60 text-sm mb-6">훈련을 완료하면 리포트가 생성됩니다</p>
            <motion.button
              onClick={() => navigate('/')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 bg-white text-purple-600 font-bold rounded-xl"
            >
              훈련 시작하기
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-4">

            {/* 요약 카드 */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5"
            >
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">이번 주 요약</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-2xl font-black text-purple-600">{stats.totalSessions}</p>
                  <p className="text-xs text-gray-400 mt-1">훈련 횟수</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-purple-600">{stats.avgScore.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-1">평균 점수</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-purple-600">{Math.round(stats.avgAccuracy * 100)}%</p>
                  <p className="text-xs text-gray-400 mt-1">평균 정확도</p>
                </div>
              </div>
              {stats.streakDays > 0 && (
                <div className="mt-4 flex items-center justify-center gap-2 bg-orange-50 rounded-xl py-2">
                  <span className="text-lg">🔥</span>
                  <span className="text-sm font-bold text-orange-600">{stats.streakDays}일 연속 훈련 중!</span>
                </div>
              )}
            </motion.div>

            {/* 훈련 빈도 바 차트 */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl p-5"
            >
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">훈련 빈도</p>
              <p className="mt-1 mb-4 text-xs text-gray-400">막대를 누르면 날짜별 훈련 횟수와 평균 점수를 확인할 수 있어요.</p>
              <WeeklyBarChart
                counts={stats.dailyCounts}
                labels={dayLabels}
                avgScores={stats.dailyAvgScores}
              />
            </motion.div>

            {/* 정확도 추이 */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-5"
            >
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">정확도 추이</p>
              <p className="mt-1 mb-4 text-xs text-gray-400">날짜별 정확도 변화로 최근 집중도 흐름을 살펴보세요.</p>
              <AccuracyTrend accuracies={stats.dailyAccuracies} labels={dayLabels} />
            </motion.div>

            {/* 모듈별 통계 */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">모듈별 훈련</p>
                <span className="text-xs text-gray-400">최근 7일</span>
              </div>
              <ModuleStatsCard moduleStats={stats.moduleStats} />
            </motion.div>

            {/* 훈련 시작 CTA */}
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => navigate('/')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-white text-purple-700 font-bold rounded-xl shadow"
            >
              오늘 훈련 하러 가기
            </motion.button>

          </div>
        )}
      </div>
    </div>
  );
}
