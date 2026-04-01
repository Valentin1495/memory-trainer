interface WeeklyBarChartProps {
  counts: number[];
  labels: string[];
  avgScores: (number | null)[];
}

export function WeeklyBarChart({ counts, labels, avgScores }: WeeklyBarChartProps) {
  const totalCount = counts.reduce((sum, count) => sum + count, 0);
  const bestCount = Math.max(...counts, 0);
  const bestIndex = counts.findIndex(count => count === bestCount);

  const summary =
    totalCount === 0
      ? '최근 7일 동안 아직 기록된 훈련이 없어요.'
      : totalCount === 1
        ? '최근 7일 동안 1회 훈련했어요.'
        : bestIndex >= 0 && bestCount > 0
          ? `${labels[bestIndex]}에 가장 활발했고, 최근 7일 동안 총 ${totalCount}회 훈련했어요.`
          : `최근 7일 동안 총 ${totalCount}회 훈련했어요.`;

  return (
    <div>
      <div className="space-y-2.5">
        {counts.map((count, i) => {
          const isToday = i === counts.length - 1;
          const avgScore = avgScores[i];
          const hasTraining = count > 0;

          return (
            <div
              key={labels[i]}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-colors ${
                isToday
                  ? 'border-purple-200 bg-purple-50'
                  : hasTraining
                    ? 'border-gray-200 bg-white'
                    : 'border-gray-100 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                    isToday
                      ? 'bg-purple-500 text-white'
                      : hasTraining
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {labels[i]}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${isToday ? 'text-purple-700' : 'text-gray-800'}`}>
                    {isToday ? '오늘 훈련 기록' : `${labels[i]}요일 기록`}
                  </p>
                  <p className="text-xs text-gray-400">
                    {hasTraining
                      ? `${count}회 훈련${avgScore !== null ? ` · 평균 ${avgScore.toLocaleString()}점` : ''}`
                      : '훈련 기록 없음'}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className={`text-sm font-bold ${hasTraining ? 'text-gray-800' : 'text-gray-400'}`}>
                  {count}회
                </p>
                {avgScore !== null && hasTraining && (
                  <p className="text-xs text-gray-400">{avgScore.toLocaleString()}점</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-center text-xs text-gray-400">
        {summary}
      </p>
    </div>
  );
}
