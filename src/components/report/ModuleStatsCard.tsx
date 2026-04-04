import type { ModuleStat } from '../../types/training';

interface ModuleStatsCardProps {
  moduleStats: ModuleStat[];
}

export function ModuleStatsCard({ moduleStats }: ModuleStatsCardProps) {
  if (moduleStats.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-4">
        아직 데이터가 없어요
      </p>
    );
  }

  const maxSessions = Math.max(...moduleStats.map(m => m.sessions));

  return (
    <div className="space-y-3">
      {moduleStats.map((m) => (
        <div key={m.moduleId} className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center rounded-full bg-purple-50 text-lg shrink-0">
            {m.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-gray-700 truncate">{m.name}</span>
              <span className="text-xs text-gray-400 shrink-0 ml-2">{m.sessions}회</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-400 rounded-full transition-all"
                style={{ width: `${(m.sessions / maxSessions) * 100}%` }}
              />
            </div>
          </div>

          <div className="text-right shrink-0 w-14">
            <p className="text-sm font-bold text-gray-800">{Math.round(m.avgAccuracy * 100)}%</p>
            <p className="text-xs text-gray-400">{m.avgScore.toLocaleString()}점</p>
          </div>
        </div>
      ))}
    </div>
  );
}
