import { useState, useRef, useLayoutEffect } from 'react';

interface WeeklyBarChartProps {
  counts: number[];
  labels: string[];
  avgScores: (number | null)[];
}

const BAR_AREA_H = 80;
const COUNT_H = 14;
const LABEL_H = 18;
const SVG_H = COUNT_H + BAR_AREA_H + LABEL_H;

export function WeeklyBarChart({ counts, labels, avgScores }: WeeklyBarChartProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgW, setSvgW] = useState(280);

  useLayoutEffect(() => {
    if (containerRef.current) {
      setSvgW(containerRef.current.clientWidth);
    }
  }, []);

  const totalCount = counts.reduce((sum, c) => sum + c, 0);
  const maxCount = Math.max(...counts, 1);
  const todayIdx = counts.length - 1;
  const n = counts.length;

  const slotW = svgW / n;
  const barW = slotW * 0.5;
  const barOffset = (slotW - barW) / 2;

  const barBottom = COUNT_H + BAR_AREA_H;
  const labelY = barBottom + 13;

  const barHeight = (count: number) =>
    count > 0 ? Math.max((count / maxCount) * BAR_AREA_H, 8) : 4;

  const centerX = (i: number) => i * slotW + slotW / 2;

  return (
    <div ref={containerRef}>
      <svg
        viewBox={`0 0 ${svgW} ${SVG_H}`}
        width={svgW}
        height={SVG_H}
        style={{ display: 'block', width: '100%', height: SVG_H }}
      >
        {counts.map((count, i) => {
          const isToday = i === todayIdx;
          const hasTraining = count > 0;
          const isActive = activeIdx === i;
          const bh = barHeight(count);
          const bx = i * slotW + barOffset;
          const by = barBottom - bh;
          const cx = centerX(i);

          const barColor = isActive
            ? '#7c3aed'
            : hasTraining
              ? '#c4b5fd'
              : '#d1d5db';

          const showCount = hasTraining && isActive;

          return (
            <g
              key={i}
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveIdx(prev => prev === i ? null : i)}
            >
              <rect x={i * slotW} y={0} width={slotW} height={SVG_H} fill="transparent" />

              <rect x={bx} y={by} width={barW} height={bh} rx={3} fill={barColor} />

              {showCount && (
                <text
                  x={cx}
                  y={by - 2}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight="bold"
                  fill={isActive ? '#7c3aed' : '#8b5cf6'}
                >
                  {count}
                </text>
              )}

              <text
                x={cx}
                y={labelY}
                textAnchor="middle"
                fontSize={10}
                fontWeight={isActive ? 'bold' : isToday ? '600' : 'normal'}
                fill={isActive ? '#7c3aed' : isToday ? '#8b5cf6' : '#9ca3af'}
              >
                {labels[i]}
              </text>
            </g>
          );
        })}
      </svg>

      {activeIdx !== null && (
        <div className={`mt-3 rounded-xl px-4 py-3 ${
          counts[activeIdx] > 0 ? 'bg-purple-50' : 'bg-gray-50'
        }`}>
          <p className={`text-sm font-semibold ${counts[activeIdx] > 0 ? 'text-purple-700' : 'text-gray-500'}`}>
            {activeIdx === todayIdx ? '오늘' : `${labels[activeIdx]}요일`}
          </p>
          {counts[activeIdx] > 0 ? (
            <p className="text-xs text-gray-500 mt-0.5">
              {counts[activeIdx]}회 훈련
              {avgScores[activeIdx] !== null
                ? ` · 평균 ${(avgScores[activeIdx] as number).toLocaleString()}점`
                : ''}
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-0.5">훈련 기록 없음</p>
          )}
        </div>
      )}

      <p className="mt-3 text-center text-xs text-gray-400">
        {totalCount === 0
          ? '최근 7일 동안 아직 기록된 훈련이 없어요.'
          : `최근 7일 동안 총 ${totalCount}회 훈련했어요.`}
      </p>
    </div>
  );
}
