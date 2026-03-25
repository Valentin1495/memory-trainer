interface WeeklyBarChartProps {
  counts: number[];
  labels: string[];
  avgScores: (number | null)[];
}

export function WeeklyBarChart({ counts, labels, avgScores }: WeeklyBarChartProps) {
  const maxCount = Math.max(...counts, 1);
  const chartHeight = 80;

  return (
    <div>
      <div className="flex items-end gap-2" style={{ height: chartHeight + 24 }}>
        {counts.map((count, i) => {
          const barHeight = count === 0 ? 3 : Math.max((count / maxCount) * chartHeight, 12);
          const isToday = i === counts.length - 1;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              {avgScores[i] !== null && count > 0 && (
                <span className="text-xs text-gray-400 tabular-nums leading-none mb-1">
                  {avgScores[i]?.toLocaleString()}
                </span>
              )}
              <div className="w-full flex items-end justify-center" style={{ height: chartHeight }}>
                <div
                  className={`w-full rounded-t-lg transition-all duration-700 ${
                    isToday
                      ? 'bg-purple-500'
                      : count > 0 ? 'bg-purple-300' : 'bg-gray-100'
                  }`}
                  style={{ height: barHeight }}
                />
              </div>
              <span className={`text-xs tabular-nums ${isToday ? 'text-purple-600 font-bold' : 'text-gray-400'}`}>
                {labels[i]}
              </span>
              {count > 0 && (
                <span className="text-xs text-gray-400">{count}회</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
