import { useMemo, useState } from 'react';

interface MiniHeatmapProps {
  counts: number[];
  labels: string[];
}

function getHeatLevel(count: number, maxCount: number): string {
  if (count === 0) return 'bg-white/10 border-white/10';
  if (maxCount <= 1) return 'bg-cyan-300/75 border-cyan-200/60';

  const intensity = count / maxCount;

  if (intensity < 0.35) return 'bg-cyan-300/75 border-cyan-200/60';
  if (intensity < 0.6) return 'bg-emerald-300/80 border-emerald-200/70';
  if (intensity < 0.85) return 'bg-yellow-300/85 border-yellow-200/75';
  return 'bg-orange-300/90 border-orange-200/80 shadow-[0_0_18px_rgba(253,186,116,0.32)]';
}

export function MiniHeatmap({ counts, labels }: MiniHeatmapProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const maxCount = Math.max(...counts, 1);
  const totalCount = counts.reduce((sum, count) => sum + count, 0);

  const summary = useMemo(() => {
    if (totalCount === 0) {
      return '최근 7일 동안 아직 훈련 기록이 없어요';
    }

    if (totalCount === 1) {
      return '최근 7일 동안 1번 훈련했어요';
    }

    const bestCount = Math.max(...counts, 0);
    const bestIndex = counts.findIndex(count => count === bestCount);

    if (bestCount <= 0 || bestIndex < 0) {
      return `최근 7일 동안 총 ${totalCount}번 훈련했어요`;
    }

    return `${labels[bestIndex]}에 가장 많이 했고, 최근 7일 동안 총 ${totalCount}번 훈련했어요`;
  }, [counts, labels, totalCount]);

  return (
    <div>
      <div className="grid grid-cols-7 gap-2">
        {counts.map((count, i) => {
          const isToday = i === counts.length - 1;
          const isActive = activeIndex === i;
          const tooltipLabel = `${labels[i]} ${count}회`;

          return (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="relative">
                {isActive && (
                  <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-[10px] font-medium text-white shadow-lg">
                    {tooltipLabel}
                  </div>
                )}

                <button
                  type="button"
                  aria-label={`${labels[i]}, ${count === 0 ? '기록 없음' : `${count}회 훈련`}`}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(current => (current === i ? null : current))}
                  onFocus={() => setActiveIndex(i)}
                  onBlur={() => setActiveIndex(current => (current === i ? null : current))}
                  onClick={() => setActiveIndex(current => (current === i ? null : i))}
                  className={`relative h-9 w-9 rounded-xl border outline-none transition-all duration-200 ${
                    getHeatLevel(count, maxCount)
                  } ${isToday ? 'ring-2 ring-white/35 ring-offset-2 ring-offset-transparent' : ''} ${
                    isActive ? 'scale-105' : ''
                  }`}
                />
              </div>

              <span className={`text-xs ${isToday ? 'font-bold text-white' : 'text-white/50'}`}>
                {labels[i]}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-center text-[11px] text-white/55">{summary}</p>

      {/* 범례 */}
      <div className="mt-3 flex items-center justify-center gap-1.5">
        <span className="text-[10px] text-white/40">Less</span>
        {[
          'bg-white/10 border-white/10',
          'bg-cyan-300/75 border-cyan-200/60',
          'bg-emerald-300/80 border-emerald-200/70',
          'bg-yellow-300/85 border-yellow-200/75',
          'bg-orange-300/90 border-orange-200/80',
        ].map((cls, i) => (
          <div
            key={i}
            className={`h-3.5 w-3.5 rounded-sm border ${cls}`}
          />
        ))}
        <span className="text-[10px] text-white/40">More</span>
      </div>
    </div>
  );
}
