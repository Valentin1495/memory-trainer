interface MiniBarChartProps {
  counts: number[];
  labels: string[];
}

export function MiniBarChart({ counts, labels }: MiniBarChartProps) {
  const maxCount = Math.max(...counts, 1);

  return (
    <div className="flex items-end gap-1.5 h-16">
      {counts.map((count, i) => {
        const heightPct = (count / maxCount) * 100;
        const isToday = i === counts.length - 1;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex items-end justify-center" style={{ height: 48 }}>
              <div
                className={`w-full rounded-t-sm transition-all duration-500 ${
                  isToday
                    ? count > 0 ? 'bg-white' : 'bg-white/20'
                    : count > 0 ? 'bg-white/60' : 'bg-white/15'
                }`}
                style={{ height: count === 0 ? 3 : `${Math.max(heightPct, 8)}%` }}
              />
            </div>
            <span className={`text-xs ${isToday ? 'text-white font-bold' : 'text-white/50'}`}>
              {labels[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
