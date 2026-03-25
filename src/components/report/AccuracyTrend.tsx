interface AccuracyTrendProps {
  accuracies: (number | null)[];
  labels: string[];
}

export function AccuracyTrend({ accuracies, labels }: AccuracyTrendProps) {
  const validPoints = accuracies.map((v, i) => ({ v, i })).filter(p => p.v !== null);

  if (validPoints.length < 2) {
    return (
      <p className="text-sm text-gray-400 text-center py-4">
        훈련을 더 완료하면 추이를 볼 수 있어요
      </p>
    );
  }

  const width = 280;
  const height = 60;
  const padding = 10;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const minY = 0;
  const maxY = 1;

  const toX = (i: number) => padding + (i / (accuracies.length - 1)) * innerWidth;
  const toY = (v: number) => padding + (1 - (v - minY) / (maxY - minY)) * innerHeight;

  const pathD = validPoints.reduce((d, p, idx) => {
    const x = toX(p.i);
    const y = toY(p.v as number);
    return idx === 0 ? `M ${x} ${y}` : `${d} L ${x} ${y}`;
  }, '');

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: 60 }}>
        {/* 50%, 80% 기준선 */}
        {[0.5, 0.8].map(pct => (
          <line
            key={pct}
            x1={padding} y1={toY(pct)}
            x2={width - padding} y2={toY(pct)}
            stroke="#e5e7eb" strokeDasharray="4 4" strokeWidth={1}
          />
        ))}
        <path d={pathD} fill="none" stroke="#8b5cf6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {validPoints.map((p, idx) => (
          <circle key={idx} cx={toX(p.i)} cy={toY(p.v as number)} r={3} fill="#8b5cf6" />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        {labels.map((l, i) => (
          <span key={i} className={`text-xs ${i === labels.length - 1 ? 'text-purple-600 font-bold' : 'text-gray-400'}`}>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
