import { useState } from 'react';

interface AccuracyTrendProps {
  accuracies: (number | null)[];
  labels: string[];
}

function cubicBezierPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

export function AccuracyTrend({ accuracies, labels }: AccuracyTrendProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const validPoints = accuracies.map((v, i) => ({ v, i })).filter(p => p.v !== null);

  if (validPoints.length < 2) {
    return (
      <p className="text-sm text-gray-400 text-center py-4">
        훈련을 더 완료하면 추이를 볼 수 있어요
      </p>
    );
  }

  const width = 280;
  const height = 90;
  const paddingLeft = 28;
  const paddingRight = 10;
  const paddingTop = 10;
  const paddingBottom = 10;
  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  const toX = (i: number) => paddingLeft + (i / (accuracies.length - 1)) * innerWidth;
  const toY = (v: number) => paddingTop + (1 - v) * innerHeight;

  const linePoints = validPoints.map(p => ({ x: toX(p.i), y: toY(p.v as number) }));

  const linePath = cubicBezierPath(linePoints);

  const first = linePoints[0];
  const last = linePoints[linePoints.length - 1];
  const areaPath =
    `${linePath} L ${last.x} ${toY(0)} L ${first.x} ${toY(0)} Z`;

  const yGuides = [0, 0.5, 1];

  const activePoint = activeIdx !== null
    ? validPoints.find(p => p.i === activeIdx) ?? null
    : null;

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height: 90 }}
      >
        <defs>
          <linearGradient id="accAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Y축 가이드라인 + 레이블 */}
        {yGuides.map(pct => (
          <g key={pct}>
            <line
              x1={paddingLeft} y1={toY(pct)}
              x2={width - paddingRight} y2={toY(pct)}
              stroke="#e5e7eb" strokeDasharray="4 3" strokeWidth={1}
            />
            <text
              x={paddingLeft - 4}
              y={toY(pct) + 4}
              textAnchor="end"
              fontSize={8}
              fill="#9ca3af"
            >
              {pct * 100}%
            </text>
          </g>
        ))}

        {/* 영역 채우기 */}
        <path d={areaPath} fill="url(#accAreaGrad)" />

        {/* 라인 */}
        <path
          d={linePath}
          fill="none"
          stroke="#8b5cf6"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 데이터 포인트 */}
        {validPoints.map((p) => {
          const x = toX(p.i);
          const y = toY(p.v as number);
          const isActive = activeIdx === p.i;
          return (
            <g key={p.i}>
              {isActive && (
                <line
                  x1={x} y1={paddingTop}
                  x2={x} y2={toY(0)}
                  stroke="#8b5cf6" strokeWidth={1} strokeDasharray="3 2" opacity={0.4}
                />
              )}
              <circle
                cx={x} cy={y}
                r={isActive ? 5 : 3.5}
                fill={isActive ? '#7c3aed' : '#8b5cf6'}
                stroke="white"
                strokeWidth={isActive ? 2 : 1.5}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setActiveIdx(p.i)}
                onMouseLeave={() => setActiveIdx(null)}
                onTouchStart={() => setActiveIdx(prev => prev === p.i ? null : p.i)}
              />
            </g>
          );
        })}

        {/* 활성 포인트 툴팁 */}
        {activePoint && (() => {
          const x = toX(activePoint.i);
          const y = toY(activePoint.v as number);
          const label = `${Math.round((activePoint.v as number) * 100)}%`;
          const boxW = 36;
          const boxH = 18;
          const bx = Math.min(Math.max(x - boxW / 2, paddingLeft), width - paddingRight - boxW);
          const by = y - boxH - 6;
          return (
            <g>
              <rect x={bx} y={by} width={boxW} height={boxH} rx={4} fill="#7c3aed" />
              <text x={bx + boxW / 2} y={by + 12} textAnchor="middle" fontSize={10} fill="white" fontWeight="bold">
                {label}
              </text>
            </g>
          );
        })()}
      </svg>

      {/* X축 레이블 */}
      <div className="flex justify-between mt-1" style={{ paddingLeft: paddingLeft, paddingRight: paddingRight }}>
        {labels.map((l, i) => (
          <span
            key={i}
            className={`text-xs ${
              i === labels.length - 1
                ? 'text-purple-600 font-bold'
                : activeIdx === i
                  ? 'text-purple-500 font-semibold'
                  : 'text-gray-400'
            }`}
          >
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
