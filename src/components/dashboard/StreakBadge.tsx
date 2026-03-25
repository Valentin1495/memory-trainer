interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  if (streak === 0) return null;
  return (
    <div className="flex items-center gap-1.5 bg-orange-500/20 border border-orange-400/30 rounded-full px-3 py-1.5">
      <span className="text-base">🔥</span>
      <span className="text-white font-bold text-sm">{streak}일 연속</span>
    </div>
  );
}
